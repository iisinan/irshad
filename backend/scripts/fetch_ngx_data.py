#!/usr/bin/env python3
"""
fetch_ngx_data.py
-----------------
Fetches live price, market cap, and sector metadata for NGX stocks
using TradingView's Scanner API (no authentication required).

Outputs JSON: { symbol: { price, market_cap, sector, industry, source } }
Run: python3 scripts/fetch_ngx_data.py > ngx_data.json
"""
import json
import sys
import requests

def fetch_tradingview_ngx() -> dict:
    url = "https://scanner.tradingview.com/nigeria/scan"
    payload = {
        "filter": [{"left": "type", "operation": "in_range", "right": ["stock", "dr", "fund"]}],
        "options": {"lang": "en"},
        "markets": ["nigeria"],
        "symbols": {"query": {"types": []}, "tickers": []},
        "columns": ["name", "close", "market_cap_basic", "sector", "industry"],
        "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"},
        "range": [0, 500]
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        
        results = {}
        for item in data.get("data", []):
            # item['d'] is an array matching the requested columns: 
            # [name, close, market_cap, sector, industry]
            cols = item.get("d", [])
            if len(cols) >= 5:
                symbol = str(cols[0]).upper().strip()
                results[symbol] = {
                    "price": float(cols[1]) if cols[1] is not None else None,
                    "market_cap": float(cols[2]) if cols[2] is not None else None,
                    "sector": cols[3],
                    "industry": cols[4],
                    "source": "tradingview",
                    "currency": "NGN",
                    "logo_url": f"https://ngxpulse.ng/logos_small/{symbol}.png"
                }
        return results
    except Exception as e:
        print(f"TradingView fetch failed: {e}", file=sys.stderr)
        return {}

def main():
    ticker_file = sys.argv[1] if len(sys.argv) > 1 else "all_tickers.txt"
    with open(ticker_file) as f:
        symbols = [line.strip().upper() for line in f if line.strip()]

    print(f"Fetching NGX market data via TradingView...", file=sys.stderr)
    tv_data = fetch_tradingview_ngx()
    
    results = {}
    found_count = 0
    
    for sym in symbols:
        # TradingView might use slightly different tickers for some (e.g. ACCESSCORP vs ACCESS)
        # We check the exact symbol first
        if sym in tv_data and tv_data[sym]["price"] is not None:
            results[sym] = tv_data[sym]
            found_count += 1
        else:
            # Fallback for known ticker mismatches
            mismatches = {
                "FBNH": "FIRSTHOLDCO",
                "ACCESS": "ACCESSCORP"
            }
            alt_sym = mismatches.get(sym)
            if alt_sym and alt_sym in tv_data and tv_data[alt_sym]["price"] is not None:
                results[sym] = tv_data[alt_sym]
                found_count += 1
            else:
                results[sym] = {"error": "not_found"}

    print(f"\n{'='*40}", file=sys.stderr)
    print(f"DONE: {found_count}/{len(symbols)} stocks with prices found via TradingView", file=sys.stderr)

    print(json.dumps(results, default=str))

if __name__ == "__main__":
    main()
