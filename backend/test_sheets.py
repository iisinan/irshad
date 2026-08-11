import pandas as pd
xl = pd.ExcelFile('/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx')
for sheet in ['DANGSUGAR', 'UACN', 'OANDO']:
    df = pd.read_excel(xl, sheet_name=sheet)
    col0 = df.iloc[:, 0].tolist()
    # Find rows for Market Cap, Revenue, etc.
    print(f"--- {sheet} ---")
    for i, val in enumerate(col0):
        if isinstance(val, str) and any(keyword in val for keyword in ['Market Capitalisation (₦)', 'Revenue', 'Finance Income']):
            print(f"{val}: {df.iloc[i, 1]}")
