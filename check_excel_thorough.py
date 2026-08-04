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

mapping = {
    "STERLNBANK": "STERLING",
    "GUARANTY": "GTCO",
    "TOTAL": "TOTAL",
    "ABBEYBDS": "ABBEY",
    "OMOSAVBNK": "OMOSAV",
    "ASOSAVINGS": "ASO",
    "UNHOMES": "UNHOMES",
    "VALUEFUND": "VALUE",
    "DEAPCAP": "DEAP",
    "SIMCAPVAL": "SIMCAP",
    "NIG-GERMAN": "NIG",
    "UNIONDICON": "UNION",
    "MULTITREX": "MULTI"
}

results = []

for stock in stocks_to_check:
    search_term = mapping.get(stock, stock[:5]) # search first 5 chars if no explicit mapping
    
    # find matches in excel
    matches = df[df.iloc[:, 0].astype(str).str.contains(search_term, case=False, na=False)]
    
    if len(matches) > 0:
        for idx, row in matches.iterrows():
            excel_ticker = str(row.iloc[0]).strip()
            excel_status = str(row.iloc[2]).strip().lower()
            
            if excel_status != 'pass' and excel_status != 'compliant' and excel_status != 'halal' and excel_status != 'nan':
                results.append(f"List Ticker: {stock} | Excel Ticker: {excel_ticker} | Status: {excel_status.upper()} | Reason: {row.iloc[3]}")
    else:
        # try secondary search
        pass

for r in results:
    print(r)
