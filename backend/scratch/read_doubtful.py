import pandas as pd
import json

file_path = '/Users/sinan/Downloads/Doubtful Stocks.xlsx'
df = pd.read_excel(file_path, header=None)
# Assuming columns are: 0: Symbol, 1: Sector, 2: Status, 3: Reason
records = []
for index, row in df.iterrows():
    symbol = str(row[0]).strip()
    if pd.isna(row[0]) or symbol == 'nan':
        continue
    reason = str(row[3]).strip()
    records.append({"symbol": symbol, "reason": reason})

print(json.dumps(records, indent=2))
