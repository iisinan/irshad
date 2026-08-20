import json

tickers = [
    "ABCTRANS", "ACADEMY", "AIRTELAFRI", "ALEX", "ARADEL", "AUSTINLAZ", "BAPLC", "BERGER",
    "BUACEMENT", "BUAFOODS", "CADBURY", "CAP", "CAVERTON", "CHAMS", "CHELLARAM", "CONOIL",
    "CUTIX", "CWG", "DANGCEM", "DANGSUGAR", "EKOCORP", "ENAMELWA", "ETERNA", "ETRANZACT",
    "EUNISELL", "FIDSON", "FTNCOCOA", "GEREGU", "HBMNG", "HONYFLOUR", "IMG", "JAIZBANK",
    "JAPAULGOLD", "JBERGER", "JOHNHOLT", "JULI", "LEARNAFRCA", "LEGENDINT", "MAYBAKER",
    "MCNICHOLS", "MECURE", "MEYER", "MORISON", "MTNN", "MULTITREX", "MULTIVERSE", "NASCON",
    "NEIMETH", "NESTLE", "NNFM", "NREIT", "OANDO", "OKOMUOIL", "OMATEK", "PHARMDEKO",
    "PREMPAINTS", "PRESCO", "PZ", "REDSTAREX", "RONCHESS", "RTBRISCOE", "SCOA", "SEPLAT",
    "SKYAVN", "THOMASWY", "TIP", "TOTAL", "TRANSEXPR", "TRANSPOWER", "TRIPPLEG", "UACN",
    "UNILEVER", "UNIONDICON", "UPDC", "UPL", "VITAFOAM", "NAHCO", "LOTUSHAL15"
]

with open('/Users/sinan/Herd/irshad/backend/python_comparison_results.json', 'r') as f:
    results = json.load(f)
    
discrepancies = results.get('discrepancies', {})
missing = results.get('missing', [])

output = "# CSV vs DB (Neon) Comparison for Requested Tickers\n\n"

for ticker in tickers:
    output += f"## {ticker}\n"
    if ticker in missing:
        output += f"- **Missing in Database**\n\n"
        continue
        
    diffs = discrepancies.get(ticker)
    if not diffs:
        output += f"- **Data Perfectly Matches**\n\n"
        continue
        
    for key, diff in diffs.items():
        output += f"- **{key}:** {diff}\n"
    output += "\n"
    
with open('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/filtered_comparison.md', 'w') as f:
    f.write(output)
    
print("Filtered comparison written.")
