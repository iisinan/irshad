import pandas as pd

excel_path = '/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx'
df = pd.read_excel(excel_path, header=2)

stocks_to_check = [
    "OANDO", "TOTAL", "CONOIL", "ETERNA", "CAVERTON", "DANGSUGAR", "ABCTRANS",
    "MULTITREX", "FTNCOCOA", "BAPLC", "STERLNBANK", "NOTORE", "VANLEER", "VALUEFUND",
    "GEREGU", "DEAPCAP", "NIG-GERMAN", "IHS", "UNIONDICON", "ABBEYBDS", "OMOSAVBNK",
    "STUDPRESS", "NASCON", "UACN", "RTBRISCOE", "GUARANTY", "SCOA", "UPL", "JBERGER",
    "MEYER", "CHAMS", "BERGER", "SIMCAPVAL", "ASOSAVINGS", "UNHOMES"
]

failed_in_excel = []

for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip().upper()
    if ticker in stocks_to_check:
        excel_status = str(row.iloc[2]).strip().lower()
        if excel_status != 'pass' and excel_status != 'compliant' and excel_status != 'halal':
            failed_in_excel.append(f"{ticker} (Status in Excel: {excel_status})")

print("Stocks from the list that FAILED business activity in Excel:")
for s in failed_in_excel:
    print(s)
