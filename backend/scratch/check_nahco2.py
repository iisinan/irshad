import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='All Stocks')
for index, row in df.iterrows():
    if 'NAHCO' in str(row.values):
        print(f"[{row.iloc[0]}] Status: {row.iloc[2]}")
