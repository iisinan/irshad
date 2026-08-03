import pandas as pd
import json

df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', header=3)
records = []
for index, row in df.iterrows():
    ticker = str(row['Ticker']).strip()
    if pd.isna(row['Ticker']) or not ticker:
        continue
    status = str(row['Business Activity Screen']).strip().lower()
    rationale = str(row['Rationale']).strip() if pd.notna(row['Rationale']) else ''
    
    if status not in ['pass', 'fail', 'doubtful']:
        continue
        
    records.append({
        'ticker': ticker,
        'status': status,
        'rationale': rationale
    })

with open('scratch/business_activity.json', 'w') as f:
    json.dump(records, f)

print(f"Exported {len(records)} records to JSON.")
