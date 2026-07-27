# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pandas",
#     "openpyxl",
#     "psycopg2-binary",
# ]
# ///
import pandas as pd
import psycopg2
import sys

# Read excel file
try:
    df = pd.read_excel('NGX_Shariah_Screen.xlsx')
except Exception as e:
    print(f"Failed to read Excel file: {e}")
    sys.exit(1)

# Basic normalizations
df.columns = df.columns.str.strip().str.lower()
print("Excel Columns:", df.columns.tolist())

# Assume there's a column for symbol, company name, status, etc.
# Connect to DB
try:
    conn = psycopg2.connect("postgresql://neondb_owner:npg_u31fJIRhDStL@ep-polished-breeze-a22n2192-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require")
    cur = conn.cursor()
    cur.execute("SELECT symbol, name, status, aaoifi_status, is_active FROM companies")
    db_companies = cur.fetchall()
except Exception as e:
    print(f"Database error: {e}")
    sys.exit(1)

db_dict = {row[0]: {'name': row[1], 'status': row[2], 'aaoifi_status': row[3], 'is_active': row[4]} for row in db_companies}
db_symbols = set(db_dict.keys())

# Let's find the symbol column in Excel
sym_col = None
for col in df.columns:
    if 'ticker' in col or 'symbol' in col or 'code' in col:
        sym_col = col
        break

if not sym_col:
    # try the first column if it looks like a symbol
    sym_col = df.columns[0]

print(f"Using '{sym_col}' as the symbol column.")

excel_symbols = set()
for index, row in df.iterrows():
    sym = str(row[sym_col]).strip()
    if pd.isna(row[sym_col]) or sym == 'nan' or sym == '':
        continue
    excel_symbols.add(sym)

missing_in_db = excel_symbols - db_symbols
missing_in_excel = db_symbols - excel_symbols

print(f"Total in DB: {len(db_symbols)}")
print(f"Total in Excel: {len(excel_symbols)}")

print("\n--- Companies in Excel but NOT in DB ---")
for s in sorted(missing_in_db):
    print(f"- {s}")

print("\n--- Companies in DB but NOT in Excel ---")
for s in sorted(missing_in_excel):
    print(f"- {s} ({db_dict[s]['name']})")

print("\n--- First 5 rows of Excel Data ---")
print(df.head())
