#!/usr/bin/env python3
"""
Batch-fetch stock data from Yahoo Finance for all NGX companies.
Tries multiple ticker suffixes: .LG, .LA, no suffix.
Outputs JSON: { symbol: { price, market_cap, pe_ratio, roe, overview, logo_url } }
"""
import yfinance as yf
import json
import sys
import time

SUFFIXES = [".LG", ".LA", ""]

def fetch_ticker(symbol: str) -> dict:
    for suffix in SUFFIXES:
        yf_symbol = f"{symbol}{suffix}"
        try:
            t = yf.Ticker(yf_symbol)
            info = t.info
            # Check if we got real data (not just an empty/error dict)
            if not info or info.get("quoteType") == "NONE":
                continue
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
            if price is None or price == 0:
                continue
            return {
                "yf_symbol": yf_symbol,
                "price": price,
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "roe": info.get("returnOnEquity"),
                "overview": info.get("longBusinessSummary"),
                "logo_url": info.get("logo_url"),
                "currency": info.get("currency"),
                "error": None,
            }
        except Exception as e:
            continue
    return {"error": "not_found"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No ticker file provided"}))
        sys.exit(1)

    ticker_file = sys.argv[1]
    with open(ticker_file) as f:
        symbols = [line.strip() for line in f if line.strip()]

    results = {}
    total = len(symbols)
    for i, symbol in enumerate(symbols):
        print(f"[{i+1}/{total}] Fetching {symbol}...", file=sys.stderr)
        results[symbol] = fetch_ticker(symbol)
        time.sleep(0.3)  # Be polite to Yahoo Finance

    print(json.dumps(results))

if __name__ == "__main__":
    main()
