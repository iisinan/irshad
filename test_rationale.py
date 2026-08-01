import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)
rationales = df.iloc[:, 3].dropna().unique()
for r in rationales:
    print(r)
