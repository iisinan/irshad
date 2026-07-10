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
    
    # Generate realistic fake market data for the requested tickers
    import random
    
    mock_results = []
    for ticker_symbol in target_tickers:
        base_symbol = ticker_symbol.replace(".LG", "")
        # Mock price between 10.0 and 1000.0
        price = round(random.uniform(10.0, 1000.0), 2)
        volume = random.randint(10000, 5000000)
        
        # Determine a mock sector
        if "BANK" in base_symbol or "GTCO" in base_symbol or "STANBIC" in base_symbol:
            sector = "Financial Services"
        elif "CEM" in base_symbol or "WAPCO" in base_symbol:
            sector = "Industrial Goods"
        elif "MTN" in base_symbol:
            sector = "ICT"
        else:
            sector = "Consumer Goods"
            
        # Mock market cap (in billions, converted to absolute value)
        market_cap = random.uniform(10_000_000_000, 5_000_000_000_000)
        # Total Assets & Debt to keep it compliant or non-compliant randomly
        total_assets = market_cap * random.uniform(0.5, 2.0)
        total_debt = total_assets * random.uniform(0.1, 0.8)
        
        # Interest income (1% to 10% of revenue)
        total_revenue = total_assets * random.uniform(0.1, 0.5)
        interest_income = total_revenue * random.uniform(0.01, 0.1)
        
        mock_results.append({
            "symbol": base_symbol,
            "name": base_symbol + " PLC",
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
        
    print(json.dumps(mock_results))
