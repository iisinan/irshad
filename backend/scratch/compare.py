import pandas as pd

df = pd.read_excel('scratch/NGX_Shariah_Screen.xlsx', sheet_name='NGX Screen')
for idx, row in df.iterrows():
    if 'Ticker' in row.values:
        df.columns = df.iloc[idx]
        df = df.iloc[idx+1:].reset_index(drop=True)
        break

excel_failed = df[df['Business Activity Screen'].astype(str).str.lower().isin(['fail', 'failed', 'non-halal', 'haram', 'non-compliant'])]['Ticker'].dropna().unique().tolist()
excel_failed = set(excel_failed)

db_failed = {"AFRINSURE", "CNIF", "MOFIREIF", "ROYALEX", "VFDGROUP", "AVACAP", "FIRSTHOLDCO", "LINKASSURE", "ETI", "INFINITY", "STANBIC", "UNIVINSURE", "VETGRIF30", "SIAMLETF40", "GREENWETF", "STANBICETF30", "WAPIC", "IKEJAHOTEL", "VETBANK", "VSPBONDETF", "STACO", "NIDF", "REGALINS", "SOVRENINS", "NPFMCRFBK", "VERITASKAP", "GUINEAINS", "UNITYBNK", "MBENEFIT", "LIVINGTRUST", "MANSARD", "LIVESTOCK", "NSLTECH", "FTGINSURE", "GOLDBREW", "ELLAHLAKES", "CHAMPION", "ACCESSCORP", "AFRIPRUD", "PRESTIGE", "SUNUASSUR", "FIDELITYBK", "GUINNESS", "CUSTODIAN", "CORNERST", "NB", "UBA", "STERLINGNG", "LASACO", "NEM", "GTCO", "UCAP", "FCMB", "CONHALLPLC", "INTBREW", "INTENEGINS", "TRANSCOHOT", "WEMABANK", "ZICHIS", "AVAIF", "ZENITHBANK", "ABBEYBANK", "CMFC", "AIICO"}

print("In DB but not Excel:", db_failed - excel_failed)
print("In Excel but not DB:", excel_failed - db_failed)
