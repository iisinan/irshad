import requests
import json
from bs4 import BeautifulSoup

api_key = "fef2dcc2d8c88617ce1276e8e1f68d97"
url = "https://africanfinancials.com/equities/"

try:
    print("Fetching via ScraperAPI...")
    r = requests.get('http://api.scraperapi.com', params={'api_key': api_key, 'url': url, 'render': 'true'}, timeout=60)
    print("Parsing...")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    companies = []
    # Find the table or links
    for link in soup.find_all('a'):
        href = link.get('href', '')
        if '/company/ng-' in href:
            symbol = href.split('/company/ng-')[1].replace('/', '').upper()
            name = link.text.strip()
            if symbol and name and len(symbol) < 15 and symbol not in [c['symbol'] for c in companies]:
                companies.append({'symbol': symbol, 'name': name, 'sector': 'Unknown'})
                
    print(f"Found {len(companies)} companies.")
    with open('database/data/ngx_companies.json', 'w') as f:
        json.dump(companies, f, indent=4)
        
except Exception as e:
    print(e)
