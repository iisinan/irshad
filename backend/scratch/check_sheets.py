import pandas as pd
xls = pd.ExcelFile('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx')
print(xls.sheet_names)
