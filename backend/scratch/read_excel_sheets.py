import pandas as pd
xls = pd.ExcelFile('scratch/NGX_Shariah_Screen.xlsx')
print(xls.sheet_names)
