import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx')
row = df[df.iloc[:, 0].astype(str).str.contains('LOTUSHAL', case=False, na=False)]
for index, r in row.iterrows():
    print(r.to_dict())
