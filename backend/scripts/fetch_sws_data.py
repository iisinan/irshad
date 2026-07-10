import sys
import json
import random

def fetch_sws_data(ticker):
    """
    Mock implementation of Simply Wall St data fetcher.
    In a production environment, this would use an official SWS API key 
    or a headless browser (Playwright/Puppeteer) to scrape the SPA.
    """
    # Blacklist sectors: "Banks", "Insurance", "Diversified Financials", "Consumer Finance", "Capital Markets", "Tobacco", "Distillers and Vintners"
    
    ticker_upper = ticker.upper()
    
    # Map common Nigerian stocks to their known sectors
    sector_map = {
        'ZENITHBANK': 'Banks',
        'GTCO': 'Banks',
        'UBA': 'Banks',
        'ACCESS': 'Banks',
        'FBNH': 'Banks',
        'AIICO': 'Insurance',
        'CUSTODIAN': 'Insurance',
        'STANBIC': 'Diversified Financials',
        'MTNN': 'Wireless Telecommunication Services',
        'AIRTELAFRI': 'Wireless Telecommunication Services',
        'DANGCEM': 'Building Materials',
        'BUACEMENT': 'Building Materials',
        'NESTLE': 'Packaged Foods and Meats',
        'NB': 'Brewers',
        'GUINNESS': 'Brewers',
        'NGXGROUP': 'Capital Markets',
        'OANDO': 'Energy',
        'SEPLAT': 'Energy',
        'PRESCO': 'Agriculture',
        'OKOMUOIL': 'Agriculture',
        'UACN': 'Conglomerates',
        'TRANSCORP': 'Conglomerates',
    }
    
    industry = sector_map.get(ticker_upper)
    
    if not industry:
        if 'BANK' in ticker_upper or 'FB' in ticker_upper:
            industry = 'Banks'
        elif 'INS' in ticker_upper or 'ASSUR' in ticker_upper:
            industry = 'Insurance'
        elif 'OIL' in ticker_upper or 'PET' in ticker_upper:
            industry = 'Energy'
        else:
            # Deterministically pick a sector based on ticker hash
            fallback_sectors = [
                'Industrial Goods', 'Consumer Goods', 'Healthcare',
                'Technology', 'Real Estate', 'Services', 'Logistics',
                'Basic Materials', 'Utilities', 'Capital Goods'
            ]
            hash_val = sum(ord(c) for c in ticker_upper)
            industry = fallback_sectors[hash_val % len(fallback_sectors)]
    
    # Mock a market cap between 10B and 5Trillion Naira
    market_cap = random.uniform(10_000_000_000, 5_000_000_000_000)
    
    # Generate realistic mock data for new fields based on ticker
    overview = f"{ticker_upper} is a leading company in the {industry} sector in Nigeria, focused on sustainable growth and delivering value to its shareholders."
    analysts_target = random.uniform(50.0, 1500.0)
    
    valuations = ["Undervalued by 20%", "Fairly Valued", "Overvalued by 10%", "Highly Undervalued (40% discount)"]
    valuation_info = random.choice(valuations)
    
    growths = ["Earnings are forecast to grow 15% per year", "Revenue is expected to grow 8% annually", "Earnings grew by 22% over the past year", "Slower growth expected in the short term"]
    growth_info = random.choice(growths)
    
    div_yield = random.uniform(2.0, 12.0)
    
    return {
        "status": "success",
        "ticker": ticker_upper,
        "industry": industry,
        "market_cap": market_cap,
        "overview": overview,
        "analysts_target": round(analysts_target, 2),
        "valuation_info": valuation_info,
        "growth_info": growth_info,
        "div_yield": round(div_yield, 2)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No ticker provided"}))
        sys.exit(1)
        
    ticker = sys.argv[1]
    data = fetch_sws_data(ticker)
    print(json.dumps(data))
