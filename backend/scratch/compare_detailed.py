import json
import psycopg2
import pandas as pd
from urllib.parse import urlparse

url = urlparse("postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require")
conn = psycopg2.connect(
    dbname=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port,
    sslmode='require'
)
cur = conn.cursor()

excel_path = '/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx'
xl = pd.ExcelFile(excel_path)

md = "# Financial Details Comparison (Excel vs DB)\n\n"
md += "| Ticker | Metric | Excel Value | DB Value | Match? |\n"
md += "|--------|--------|-------------|----------|--------|\n"

mismatchCount = 0

for sheet_name in xl.sheet_names:
    if sheet_name == 'Financial Summary':
        continue
        
    ticker = sheet_name.strip()
    
    # Read sheet
    df = pd.read_excel(excel_path, sheet_name=sheet_name)
    
    # Find the row indices dynamically in case they move
    debt_ex = None
    cash_ex = None
    inc_ex = None
    
    for idx, row in df.iterrows():
        col0 = str(row.iloc[0]).lower()
        if '1. debt' in col0:
            debt_ex = row.iloc[2]
        elif '2. total cash' in col0:
            cash_ex = row.iloc[2]
        elif '3. finance' in col0:
            inc_ex = row.iloc[2]
            
    def parse_ratio(val):
        if pd.isna(val) or val == 'nan' or val is None:
            return None
        return float(val) * 100
        
    debt_ex = parse_ratio(debt_ex)
    cash_ex = parse_ratio(cash_ex)
    inc_ex = parse_ratio(inc_ex)
    
    # Fetch from DB
    cur.execute("SELECT id FROM companies WHERE symbol = %s", (ticker,))
    res = cur.fetchone()
    if not res:
        md += f"| **{ticker}** | All | N/A | Missing in DB | ❌ |\n"
        continue
    company_id = res[0]
    
    cur.execute("SELECT debt_ratio, cash_ratio, impermissible_income_ratio FROM aaoifi_screenings WHERE company_id = %s", (company_id,))
    res = cur.fetchone()
    if not res:
        md += f"| **{ticker}** | All | N/A | Missing Screening in DB | ❌ |\n"
        continue
        
    debt_db = float(res[0]) if res[0] is not None else None
    cash_db = float(res[1]) if res[1] is not None else None
    inc_db = float(res[2]) if res[2] is not None else None
    
    def check_match(ex, db):
        if ex is None and db is None: return True, "✅"
        if ex is None or db is None: return False, "❌"
        # Match if within 0.05%
        if abs(ex - db) < 0.05:
            return True, "✅"
        return False, "❌"
        
    dm, dms = check_match(debt_ex, debt_db)
    cm, cms = check_match(cash_ex, cash_db)
    im, ims = check_match(inc_ex, inc_db)
    
    def format_val(val):
        return f"{val:.4f}%" if val is not None else "N/A"
        
    if not dm or not cm or not im:
        md += f"| **{ticker}** | Debt Ratio | {format_val(debt_ex)} | {format_val(debt_db)} | {dms} |\n" if not dm else ""
        md += f"| **{ticker}** | Cash Ratio | {format_val(cash_ex)} | {format_val(cash_db)} | {cms} |\n" if not cm else ""
        md += f"| **{ticker}** | Income Ratio | {format_val(inc_ex)} | {format_val(inc_db)} | {ims} |\n" if not im else ""
        mismatchCount += 1

if mismatchCount == 0:
    md += "| **All Checked** | - | - | - | ✅ All match! |\n"

with open('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/financial_details_comparison.md', 'w') as f:
    f.write(md)

print(f"Details Comparison generated. Mismatched Tickers: {mismatchCount}")
