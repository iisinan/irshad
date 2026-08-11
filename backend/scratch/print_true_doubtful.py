import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='Doubtful Stocks')
# Just find rows that have DOUBTFUL in the 3rd column
for index, row in df.iterrows():
    if 'DOUBTFUL' in str(row.values):
        # find the rationale which is usually the 4th column (index 3)
        print(f"[{row.iloc[0]}] {row.iloc[3]}")
