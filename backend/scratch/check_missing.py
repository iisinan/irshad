import pandas as pd

df = pd.read_excel('scratch/NGX_Shariah_Screen.xlsx', sheet_name='NGX Screen')
for idx, row in df.iterrows():
    if 'Ticker' in row.values:
        df.columns = df.iloc[idx]
        df = df.iloc[idx+1:].reset_index(drop=True)
        break

missing = ['VSPBONDETF', 'LIVESTOCK', 'AVACAP', 'STANBICETF30', 'GREENWETF', 'VETGRIF30', 'ZICHIS', 'VETBANK', 'SIAMLETF40']
print(df[df['Ticker'].isin(missing)][['Ticker', 'Business Activity Screen']])
