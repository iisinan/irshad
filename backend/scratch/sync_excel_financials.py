import pandas as pd
import psycopg2
import re

db_url = "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
db_conn = psycopg2.connect(db_url)
cur = db_conn.cursor()

excel_path = '/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx'
xls = pd.ExcelFile(excel_path)
sheets = xls.sheet_names

for sheet in sheets:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    
    # 1. Market Cap
    try:
        mc_row = df[df.iloc[:, 0].astype(str).str.contains('Market Capitalisation', case=False, na=False)].iloc[-1]
        market_cap_raw = mc_row.iloc[1]
        market_cap = float(market_cap_raw)
    except:
        print(f"[{sheet}] Could not find Market Cap, skipping.")
        continue
        
    # 2. Multiplier
    multiplier = 1
    try:
        source_row = df[df.iloc[:, 0].astype(str).str.contains('Source Financial Data', case=False, na=False)].iloc[0, 0]
        if "N'000-equivalent" in str(source_row) or "N'000" in str(source_row):
            multiplier = 1000
        elif "N'm" in str(source_row) or "N'000,000" in str(source_row) or "Millions" in str(source_row):
            multiplier = 1000000
    except:
        pass
        
    def get_val(keyword):
        try:
            row = df[df.iloc[:, 0].astype(str).str.contains(keyword, case=False, na=False, regex=False)].iloc[0]
            val = row.iloc[1]
            if pd.isna(val) or val == 'NaN':
                return 0.0
            return float(val) * multiplier
        except:
            return 0.0

    borrowings_nc = get_val('Borrowings — Non-current')
    if borrowings_nc == 0.0: borrowings_nc = get_val('Borrowings - Non-current')
        
    borrowings_c = get_val('Borrowings — Current')
    if borrowings_c == 0.0: borrowings_c = get_val('Borrowings - Current')
        
    comm_papers = get_val('Commercial Papers')
    total_debt = borrowings_nc + borrowings_c + comm_papers
    
    cash = get_val('Cash and Cash Equivalents')
    securities = get_val('Other Financial Assets / Securities')
    
    revenue = get_val('Revenue')
    interest_income = get_val('Finance Income')
    if interest_income == 0.0: interest_income = get_val('Finance (Interest) Income')
        
    cur.execute("SELECT id FROM companies WHERE symbol = %s", (sheet,))
    c_res = cur.fetchone()
    if c_res:
        c_id = c_res[0]
        
        # Update market_cap
        cur.execute("UPDATE companies SET market_cap = %s WHERE id = %s", (market_cap, c_id))
        
        # We also need to delete the old ones or just insert a newer date.
        # AAOIFI screening service picks the most recent `financials` record.
        period = "Excel Sync"
        cur.execute("""
            INSERT INTO financials 
            (company_id, total_debt, cash_and_equivalents, interest_bearing_securities, total_revenue, interest_income, market_cap, reporting_period, created_at, updated_at, total_assets, net_income) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)
        """, (c_id, total_debt, cash, securities, revenue, interest_income, market_cap, period, 0, 0))
        
        print(f"[{sheet}] Synced! MC: {market_cap}, Debt: {total_debt}, Mult: {multiplier}")
    else:
        print(f"[{sheet}] Company not found in DB.")

db_conn.commit()
cur.close()
db_conn.close()
print("Done syncing.")
