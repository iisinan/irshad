import pandas as pd
import json

# Load Excel
excel_path = "/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx"
df = pd.read_excel(excel_path, header=3)

# Filter for FAIL
failed_stocks = df[df['Business Activity Screen'] == 'FAIL']

results = {}

for index, row in failed_stocks.iterrows():
    ticker = row['Ticker']
    rationale = row['Rationale']
    
    if pd.isna(ticker) or pd.isna(rationale):
        continue
        
    ticker = str(ticker).strip()
    rationale = str(rationale).strip()
    
    if not rationale:
        continue
            
    results[ticker] = rationale

output_path = "/Users/sinan/Herd/irshad/backend/raw_rationales.json"
with open(output_path, "w") as f:
    json.dump(results, f, indent=4)
    
print(f"Successfully extracted {len(results)} rationales and saved to {output_path}")
