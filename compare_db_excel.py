import pandas as pd
import json

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)

with open('backend/db_dump3.json', 'r') as f:
    db_data = json.load(f)

# Convert db_data to a dictionary keyed by symbol
db_dict = {item['symbol'].upper(): item for item in db_data}

discrepancies = []
total_checked = 0

for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip().upper()
    if pd.isna(row.iloc[0]) or ticker == 'NAN' or ticker == 'TICKER':
        continue

    total_checked += 1
    
    excel_status = str(row.iloc[2]).strip().lower()
    if excel_status == 'doubtful':
        excel_status = 'doubtful' # Should we treat doubtful as something else? It's fine.

    if ticker not in db_dict:
        discrepancies.append(f"MISSING IN DB: {ticker} is in Excel but not in aaoifi_screenings table.")
        continue

    db_status = 'none'
    if 'aaoifi_screening' in db_dict[ticker] and db_dict[ticker]['aaoifi_screening'] is not None:
        db_status = str(db_dict[ticker]['aaoifi_screening'].get('business_status')).strip().lower()
    
    if excel_status != db_status:
        # Note: If excel is 'doubtful', we mapped it to 'doubtful' in rephrase_local.py
        # But wait, did rephrase_local.py import 'doubtful' as 'doubtful'?
        # Let's check if there's any mismatch.
        discrepancies.append(f"STATUS MISMATCH for {ticker}: Excel='{excel_status}', DB='{db_status}'")

if not discrepancies:
    print(f"SUCCESS: All {total_checked} tickers from Excel match the database exactly in terms of Business Activity Status.")
else:
    print(f"FOUND {len(discrepancies)} DISCREPANCIES out of {total_checked} checked:")
    for d in discrepancies:
        print(f"- {d}")
