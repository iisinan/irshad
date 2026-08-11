import json
import re
import sqlite3 # or whatever the DB is

# read the HTML
with open('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/.system_generated/steps/13338/content.md', 'r') as f:
    html = f.read()

# Extract the JSON payload
match = re.search(r'window\.__ETFS_PRELOAD__\s*=\s*(\{.*?\});</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    etf_symbols = [row['symbol'] for row in data['rows']]
    print("ETFs found on NGXPulse:", etf_symbols)
    print("Total ETFs:", len(etf_symbols))
else:
    print("Could not find ETF data in HTML.")

