import json
import os
import psycopg2
import sys

tickers_file = "/Users/sinan/Herd/irshad/database/data/ngx_companies.json"
with open(tickers_file, "r") as f:
    data = json.load(f)

tickers = [company.get("symbol") for company in data if company.get("symbol")][:30]

conn = psycopg2.connect("postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()
cur.execute("SELECT DISTINCT company_ticker FROM financial_screenings")
existing = [row[0] for row in cur.fetchall()]

missing = [t for t in tickers if t not in existing]
print(missing)
