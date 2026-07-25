import pandas as pd
import json

try:
    df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen.xlsx')
    df = df.where(pd.notnull(df), None)
    data = df.to_dict(orient='records')
    with open('excel_dump.json', 'w') as f:
        json.dump(data, f, default=str)
    print("Successfully dumped Excel to excel_dump.json")
except Exception as e:
    print("Error:", str(e))
