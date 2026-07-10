import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
response = requests.get('https://simplywall.st/stocks/ng/market-cap-large?_pr=next', headers=headers)
print(len(response.text))
