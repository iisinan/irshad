import yfinance as yf
import json
import sys

symbol = sys.argv[1] if len(sys.argv) > 1 else 'MTNN.LG'
ticker = yf.Ticker(symbol)
info = ticker.info

print(json.dumps({
    'eps': info.get('trailingEps'),
    'pe_ratio': info.get('trailingPE'),
    'roe': info.get('returnOnEquity'),
    'dividend_yield': info.get('dividendYield'),
    'profit_margin': info.get('profitMargins')
}, indent=2))
