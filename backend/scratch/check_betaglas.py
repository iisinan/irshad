import pandas as pd
xls = pd.ExcelFile('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx')
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet)
    for index, row in df.iterrows():
        row_str = ' | '.join([str(x) for x in row.values if pd.notna(x)])
        if 'BETAGLAS' in row_str:
            print(f"Sheet '{sheet}': {row_str}")
