import pandas as pd
import psycopg2
import math

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
        mc_row = df[df.iloc[:, 0].astype(str).str.strip() == 'Market Capitalisation (₦)'].iloc[0]
        market_cap_raw = mc_row.iloc[1]
        market_cap = float(market_cap_raw)
        
        if math.isnan(market_cap):
            continue
            
        cur.execute("SELECT id FROM companies WHERE symbol = %s", (sheet,))
        c_res = cur.fetchone()
        if c_res:
            c_id = c_res[0]
            
            # Update companies market_cap
            cur.execute("UPDATE companies SET market_cap = %s WHERE id = %s", (market_cap, c_id))
            
            # Update the latest financials market_cap
            cur.execute("""
                UPDATE financials 
                SET market_cap = %s 
                WHERE company_id = %s AND reporting_period = 'Excel Sync'
            """, (market_cap, c_id))
            
            print(f"[{sheet}] Fixed MC to: {market_cap}")
    except Exception as e:
        pass

db_conn.commit()
cur.close()
db_conn.close()
print("Done fixing MCs.")
