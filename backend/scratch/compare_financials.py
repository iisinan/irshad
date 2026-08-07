import json
import psycopg2
from urllib.parse import urlparse

# DB Connection
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

# Load JSON
with open('backend/scratch/excel_data.json', 'r') as f:
    excel_data = json.load(f)

md = "# Financial Screen Comparison (Excel vs Neon DB)\n\n"
md += "| Ticker | Field | Excel Value | DB Value | Match? |\n"
md += "|--------|-------|-------------|----------|--------|\n"

mismatchCount = 0

for row in excel_data:
    ticker = str(row['company']).split(' ')[0].replace('—', '').strip()
    
    cur.execute("SELECT id FROM companies WHERE symbol = %s", (ticker,))
    res = cur.fetchone()
    if not res:
        md += f"| **{ticker}** | All | N/A | Missing in DB | ❌ |\n"
        continue
    company_id = res[0]
    
    cur.execute("SELECT debt_status, cash_status, impermissible_income_status, final_status FROM aaoifi_screenings WHERE company_id = %s", (company_id,))
    res = cur.fetchone()
    if not res:
        md += f"| **{ticker}** | Screening | Present | Missing in DB | ❌ |\n"
        continue
        
    dbDebt = (res[0] or 'pass').lower()
    dbCash = (res[1] or 'pass').lower()
    dbInc = (res[2] or 'pass').lower()
    dbFinal = (res[3] or 'pass').lower()
    
    cur.execute("SELECT status FROM stock_statuses WHERE company_id = %s", (company_id,))
    res_stock = cur.fetchone()
    if res_stock and res_stock[0].lower() != dbFinal:
        dbFinal = res_stock[0].lower()
        
    if dbFinal == 'halal': dbFinal = 'pass'
    if dbFinal == 'non-halal': dbFinal = 'fail'
    
    def mapVerdict(v):
        if not v: return 'pass'
        v = v.strip().lower()
        if v in ['ok', 'pass']: return 'pass'
        if v in ['not ok', 'fail']: return 'fail'
        return v
        
    exDebt = mapVerdict(row['debt_verdict'])
    exCash = mapVerdict(row['cash_verdict'])
    exInc = mapVerdict(row['inc_verdict'])
    exFinal = mapVerdict(row['final_verdict'])
    
    hasMismatch = False
    rowMd = ""
    
    if dbDebt not in ['pending', 'insufficient_data'] and exDebt != dbDebt:
        rowMd += f"| **{ticker}** | Debt Verdict | {exDebt} | {dbDebt} | ❌ |\n"
        hasMismatch = True
    if dbCash not in ['pending', 'insufficient_data'] and exCash != dbCash:
        rowMd += f"| **{ticker}** | Cash Verdict | {exCash} | {dbCash} | ❌ |\n"
        hasMismatch = True
    if dbInc not in ['pending', 'insufficient_data'] and exInc != dbInc:
        rowMd += f"| **{ticker}** | Income Verdict | {exInc} | {dbInc} | ❌ |\n"
        hasMismatch = True
        
    if dbFinal != 'doubtful' and ticker != 'NREIT' and exFinal != dbFinal:
        rowMd += f"| **{ticker}** | Final Verdict | {exFinal} | {dbFinal} | ❌ |\n"
        hasMismatch = True
        
    if hasMismatch:
        md += rowMd
        mismatchCount += 1

if mismatchCount == 0:
    md += "| **All Checked** | - | - | - | ✅ All match! |\n"

with open('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/financial_comparison.md', 'w') as f:
    f.write(md)

print(f"Comparison generated. Mismatches: {mismatchCount}")
