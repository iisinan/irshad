import yfinance as yf
import json
import sys

def scrape_data(tickers):
    results = []
    for ticker_symbol in tickers:
        try:
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            # Usually Nigerian tickers on Yahoo Finance end with .LG
            base_symbol = ticker_symbol.replace(".LG", "")
            
            # Extract basic info
            price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose", 0)
            volume = info.get("regularMarketVolume") or info.get("volume", 0)
            name = info.get("shortName") or info.get("longName", base_symbol)
            sector = info.get("sector", "Unknown")
            
            # Extract financial info for AAOIFI
            total_debt = info.get("totalDebt", 0)
            total_assets = info.get("totalAssets", 0)
            # If total_assets is not provided directly, sometimes we use marketCap as denominator for AAOIFI
            # but standard AAOIFI uses total assets or 12-month average market cap. We will fetch marketCap.
            market_cap = info.get("marketCap", 0)
            
            total_revenue = info.get("totalRevenue", 0)
            # Interest income isn't always directly in `info`. 
            # We'll try to fetch it, but default to 0 if not available via fast API.
            interest_income = info.get("interestIncome", 0)
            
            results.append({
                "symbol": base_symbol,
                "name": name,
                "sector": sector,
                "price": price,
                "volume": volume,
                "total_debt": total_debt,
                "total_assets": total_assets,
                "market_cap": market_cap,
                "total_revenue": total_revenue,
                "interest_income": interest_income,
                "error": None
            })
        except Exception as e:
            results.append({
                "symbol": ticker_symbol.replace(".LG", ""),
                "error": str(e)
            })
            
    return results

if __name__ == "__main__":
    # Top NGX tickers available on Yahoo Finance
    target_tickers = [
        "DANGCEM.LG", 
        "MTNN.LG", 
        "BUACEMENT.LG", 
        "NESTLE.LG",
        "GTCO.LG", 
        "ZENITHBANK.LG", 
        "STANBIC.LG",
        "NB.LG",
        "WAPCO.LG",
        "GUARANTY.LG"
    ]
    
    data = scrape_data(target_tickers)
    # Output empty array for now since Yahoo Finance dropped NGX support
    print(json.dumps([]))
