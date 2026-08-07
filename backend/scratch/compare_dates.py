import pandas as pd
import psycopg2
import json
import re
from datetime import datetime
import dateparser

db_url = "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
db_conn = psycopg2.connect(db_url)
cur = db_conn.cursor()

excel_path = '/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx'
xls = pd.ExcelFile(excel_path)
sheets = xls.sheet_names

def standardize_date(text):
    if not text or text == "Unknown" or text == "N/A":
        return "N/A"
    
    # Try to extract common date patterns like "30 June 2026", "31 December 2025", "31 May 2026"
    date_match = re.search(r'(\d{1,2}\s+[a-zA-Z]+\s+\d{4})', text)
    if date_match:
        try:
            parsed = datetime.strptime(date_match.group(1), "%d %B %Y")
            return parsed.strftime("%Y-%m-%d")
        except:
            pass
            
    # Try to parse using dateparser if regex fails
    try:
        parsed = dateparser.parse(text, settings={'STRICT_PARSING': False})
        if parsed:
            return parsed.strftime("%Y-%m-%d")
    except:
        pass
        
    return text

markdown_lines = []
markdown_lines.append("# Excel vs Database Reporting Period End Date & Published Date Comparison")
markdown_lines.append("")
markdown_lines.append("| Ticker | Excel Period End Date | DB Period End Date | DB Published Date | Match? |")
markdown_lines.append("|---|---|---|---|---|")

for sheet in sheets:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    cell_a1 = str(df.columns[0])
    if pd.isna(cell_a1) or 'AAOIFI' not in cell_a1:
        if len(df) > 0:
            cell_a1 = str(df.iloc[0, 0])
    
    excel_period = "Unknown"
    if ' | ' in cell_a1:
        excel_period = cell_a1.split(' | ')[-1].strip()
        
    cur.execute("SELECT id FROM companies WHERE symbol = %s", (sheet,))
    c_res = cur.fetchone()
    db_period = "N/A"
    db_pub_date = "N/A"
    match = "❌"
    
    if c_res:
        c_id = c_res[0]
        cur.execute("SELECT financial_data_used FROM aaoifi_screenings WHERE company_id = %s", (c_id,))
        a_res = cur.fetchone()
        
        if a_res and a_res[0]:
            try:
                fin_data = a_res[0]
                if isinstance(fin_data, str):
                    fin_data = json.loads(fin_data)
                    
                db_period = str(fin_data.get('reporting_period', 'N/A'))
                db_pub_date = str(fin_data.get('published_date', 'N/A'))
            except:
                db_period = "Error parsing JSON"

    excel_date = standardize_date(excel_period)
    db_date = standardize_date(db_period)
    db_pub_date = standardize_date(db_pub_date)
    
    if excel_date != "N/A" and excel_date == db_date:
        match = "✅"
    elif excel_date != "N/A" and excel_date != "Unknown" and excel_date != db_date:
        if excel_date == "2025-12-31" and db_date != "2025-12-31":
            match = "❌ (DB is newer)"
        else:
            match = "❌"
            
    markdown_lines.append(f"| {sheet} | {excel_date} | {db_date} | {db_pub_date} | {match} |")

cur.close()
db_conn.close()

with open("/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/date_quarter_comparison.md", "w") as f:
    f.write("\n".join(markdown_lines))

print("Done writing artifact.")
