import pandas as pd
import psycopg2
import json
import re
from datetime import datetime

# Connect to DB
db_url = "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
db_conn = psycopg2.connect(db_url)
cur = db_conn.cursor()

excel_path = '/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx'
xls = pd.ExcelFile(excel_path)
sheets = xls.sheet_names

markdown_lines = []
markdown_lines.append("# Standardized Period End Date Comparison")
markdown_lines.append("")
markdown_lines.append("| Ticker | Excel Period End Date | DB Period End Date | Most Recent Source |")
markdown_lines.append("|---|---|---|---|")

def extract_date(text):
    if not isinstance(text, str):
        return None
    
    # Try to find common date patterns like "30 June 2026", "31 December 2025", "31 May 2026", "31 March 2026"
    months = r"(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    pattern = r"(\d{1,2})\s+(" + months + r")\s+(\d{4})"
    match = re.search(pattern, text, re.IGNORECASE)
    
    if match:
        day, month, year = match.groups()
        # Some normalization
        if month.lower() == 'jan': month = 'January'
        if month.lower() == 'feb': month = 'February'
        if month.lower() == 'mar': month = 'March'
        if month.lower() == 'apr': month = 'April'
        if month.lower() == 'jun': month = 'June'
        if month.lower() == 'jul': month = 'July'
        if month.lower() == 'aug': month = 'August'
        if month.lower() == 'sep': month = 'September'
        if month.lower() == 'oct': month = 'October'
        if month.lower() == 'nov': month = 'November'
        if month.lower() == 'dec': month = 'December'
        
        date_str = f"{day} {month} {year}"
        try:
            return datetime.strptime(date_str, "%d %B %Y").date()
        except ValueError:
            pass
            
    # Try Q1, Q2, H1 format fallbacks if no explicit date
    if 'Q1' in text and '2026' in text:
        return datetime(2026, 3, 31).date()
    if ('Q2' in text or 'H1' in text or '6M' in text) and '2026' in text:
        return datetime(2026, 6, 30).date()
    if 'FY2025' in text:
        return datetime(2025, 12, 31).date()
    
    return None

for sheet in sheets:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    cell_a1 = str(df.columns[0])
    if pd.isna(cell_a1) or 'AAOIFI' not in cell_a1:
        if len(df) > 0:
            cell_a1 = str(df.iloc[0, 0])
    
    excel_period = "Unknown"
    if ' | ' in cell_a1:
        excel_period = cell_a1.split(' | ')[-1].strip()
        
    excel_date = extract_date(excel_period)
    
    cur.execute("SELECT id FROM companies WHERE symbol = %s", (sheet,))
    c_res = cur.fetchone()
    
    db_period_str = "N/A"
    db_date = None
    
    if c_res:
        c_id = c_res[0]
        cur.execute("SELECT financial_data_used FROM aaoifi_screenings WHERE company_id = %s", (c_id,))
        a_res = cur.fetchone()
        
        if a_res and a_res[0]:
            try:
                fin_data = a_res[0]
                if isinstance(fin_data, str):
                    fin_data = json.loads(fin_data)
                    
                db_period_str = str(fin_data.get('reporting_period', 'N/A'))
                db_date = extract_date(db_period_str)
                
            except Exception as e:
                pass
                
    excel_date_str = excel_date.strftime('%Y-%m-%d') if excel_date else 'Unknown'
    db_date_str = db_date.strftime('%Y-%m-%d') if db_date else 'Unknown'
    
    more_recent = "Equal"
    if excel_date and db_date:
        if excel_date > db_date:
            more_recent = "Excel"
        elif db_date > excel_date:
            more_recent = "Database"
    elif excel_date and not db_date:
        more_recent = "Excel"
    elif db_date and not excel_date:
        more_recent = "Database"
    else:
        more_recent = "Unknown"

    markdown_lines.append(f"| {sheet} | {excel_date_str} | {db_date_str} | {more_recent} |")

cur.close()
db_conn.close()

with open("/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/date_quarter_comparison.md", "w") as f:
    f.write("\n".join(markdown_lines))

print("Done writing artifact.")
