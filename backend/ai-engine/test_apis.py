import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv(dotenv_path="../.env")

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")

async def test_api(ticker):
    print(f"\n--- Testing APIs for {ticker} ---")
    
    async with httpx.AsyncClient() as client:
        # Alpha Vantage
        print("\n[Alpha Vantage]")
        av_url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
        av_resp = await client.get(av_url)
        if av_resp.status_code == 200:
            av_data = av_resp.json()
            if "annualReports" in av_data:
                print(f"Success! Found {len(av_data['annualReports'])} annual reports.")
                print(f"Keys available: {list(av_data['annualReports'][0].keys())[:10]}...")
                # Print a few key metrics
                rep = av_data['annualReports'][0]
                print(f"Sample - FY End: {rep.get('fiscalDateEnding')}, Total Revenue: {rep.get('totalRevenue')}, Net Income: {rep.get('netIncome')}")
            elif "Information" in av_data:
                print(f"Rate limited or informational message: {av_data['Information']}")
            elif "Error Message" in av_data:
                print(f"Error: {av_data['Error Message']}")
            else:
                print(f"Response: {av_data}")
        else:
            print(f"HTTP Error: {av_resp.status_code}")

        # FMP
        print("\n[FMP]")
        fmp_url = f"https://financialmodelingprep.com/api/v3/income-statement/{ticker}?limit=1&apikey={FMP_API_KEY}"
        fmp_resp = await client.get(fmp_url)
        if fmp_resp.status_code == 200:
            fmp_data = fmp_resp.json()
            if isinstance(fmp_data, list) and len(fmp_data) > 0:
                print("Success! Found income statement.")
                print(f"Keys available: {list(fmp_data[0].keys())[:10]}...")
                rep = fmp_data[0]
                print(f"Sample - FY: {rep.get('calendarYear')}, Revenue: {rep.get('revenue')}, Net Income: {rep.get('netIncome')}")
            elif isinstance(fmp_data, list) and len(fmp_data) == 0:
                print("Empty array returned. Ticker might not exist or no data available.")
            elif "Error Message" in fmp_data:
                print(f"Error: {fmp_data['Error Message']}")
            else:
                print(f"Response: {fmp_data}")
        else:
            print(f"HTTP Error: {fmp_resp.status_code}")

async def main():
    # Test just the ticker
    await test_api("DANGCEM")
    # Test with .LG suffix (Lagos)
    await test_api("DANGCEM.LG")
    await test_api("MTNN.LG")
    await test_api("AAPL") # control test

if __name__ == "__main__":
    asyncio.run(main())
