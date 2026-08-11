import pandas as pd
import json

df = pd.read_excel('scratch/NGX_Shariah_Screen.xlsx', sheet_name='NGX Screen')
ticker_row = None
for idx, row in df.iterrows():
    if 'Ticker' in row.values or 'Symbol' in row.values or 'TICKER' in row.values:
        ticker_row = idx
        break

if ticker_row is not None:
    df.columns = df.iloc[ticker_row]
    df = df.iloc[ticker_row+1:].reset_index(drop=True)
    print("Columns:", df.columns.tolist())
    status_cols = [c for c in df.columns if 'status' in str(c).lower() or 'screen' in str(c).lower() or 'halal' in str(c).lower()]
    print("Status cols:", status_cols)
    
    col = None
    for c in status_cols:
        if 'business' in str(c).lower() or 'stage 1' in str(c).lower() or 'shariah' in str(c).lower():
            col = c
            break
            
    if col:
        failed = df[df[col].astype(str).str.lower().isin(['fail', 'failed', 'non-halal', 'haram', 'non-compliant'])]
        symbols = failed['Ticker'].dropna().unique().tolist()
        print("\nFailed in Excel:", len(symbols))
        print(symbols)
    else:
        print("Column not found.")
else:
    print("Ticker row not found.")
