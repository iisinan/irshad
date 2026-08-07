import pandas as pd
import json

df = pd.read_excel('/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx', header=3)
data = []

for index, row in df.iterrows():
    company = str(row['Company']).strip()
    if pd.isna(row['Company']) or company == 'nan' or company == '':
        continue
    
    # Clean ratios, handling percentages
    def parse_ratio(val):
        if pd.isna(val):
            return None
        if isinstance(val, str):
            val = val.strip().replace('%', '')
            try:
                return float(val) # if it's already a percentage e.g., '120.5' 
            except:
                return None
        return float(val) * 100 # if it's a decimal e.g., 0.1205

    data.append({
        'company': company,
        'debt_ratio': parse_ratio(row['Debt/MktCap']),
        'debt_verdict': str(row['Verdict']).strip() if not pd.isna(row['Verdict']) else None,
        'cash_ratio': parse_ratio(row['Cash/MktCap']),
        'cash_verdict': str(row['Verdict.1']).strip() if not pd.isna(row['Verdict.1']) else None,
        'inc_ratio': parse_ratio(row['Fin.Inc/Rev']),
        'inc_verdict': str(row['Verdict.2']).strip() if not pd.isna(row['Verdict.2']) else None,
        'final_verdict': str(row['Final Financial Verdict']).strip() if not pd.isna(row['Final Financial Verdict']) else None
    })

with open('backend/scratch/excel_data.json', 'w') as f:
    json.dump(data, f, indent=4)
print("JSON saved successfully")
