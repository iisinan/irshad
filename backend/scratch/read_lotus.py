import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='All Stocks')
# Find the header row
for idx, row in df.iterrows():
    if 'Ticker' in row.values or 'Symbol' in row.values:
        df.columns = df.iloc[idx]
        df = df.iloc[idx+1:].reset_index(drop=True)
        break
        
lotus = df[df.astype(str).apply(lambda x: x.str.contains('LOTUS', case=False, na=False)).any(axis=1)]
if not lotus.empty:
    print(lotus.to_dict('records'))
else:
    print("LOTUS not found in All Stocks.")
