import pandas as pd
import sys

file_path = "/Users/sinan/Downloads/NGX_Shariah_Screen (1).xlsx"
for skip in range(10):
    df = pd.read_excel(file_path, engine='openpyxl', skiprows=skip)
    columns = [str(c).lower() for c in df.columns]
    if any('ticker' in c for c in columns) or any('symbol' in c for c in columns):
        print(f"Found headers at row {skip}")
        print("Columns:", df.columns.tolist())
        print(df.head(2).to_dict('records'))
        break
