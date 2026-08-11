import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='Doubtful Stocks')
# Print the 'Rationale' (column index 3)
for index, row in df.iterrows():
    print(f"[{row.iloc[0]}] {row.iloc[3]}")
