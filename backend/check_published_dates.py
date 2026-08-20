import psycopg2
import sys

# The list of symbols to check
symbols = [
    'ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER',
    'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL',
    'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT',
    'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK',
    'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'MAYBAKER',
    'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NASCON',
    'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO',
    'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT',
    'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN',
    'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM', 'NAHCO', 'LOTUSHAL15'
]

missing = []
not_found = []

try:
    conn = psycopg2.connect("postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require")
    cur = conn.cursor()

    for symbol in symbols:
        cur.execute("SELECT id FROM companies WHERE symbol = %s", (symbol,))
        row = cur.fetchone()
        if not row:
            not_found.append(symbol)
            continue
        
        company_id = row[0]
        
        # Check financials published_date
        cur.execute("SELECT published_date FROM financials WHERE company_id = %s ORDER BY created_at DESC LIMIT 1", (company_id,))
        fin_row = cur.fetchone()
        fin_date = fin_row[0] if fin_row else None
        
        # Check aaoifi_screenings published_date
        cur.execute("SELECT published_date FROM aaoifi_screenings WHERE company_id = %s ORDER BY created_at DESC LIMIT 1", (company_id,))
        scr_row = cur.fetchone()
        scr_date = scr_row[0] if scr_row else None
        
        if not fin_date and not scr_date:
            missing.append(symbol)

    cur.close()
    conn.close()

    print(f"Total checked: {len(symbols)}")
    print(f"Not found in DB: {', '.join(not_found)}")
    print(f"Missing Published Date: {', '.join(missing)}")

except Exception as e:
    print(f"Error: {e}")
