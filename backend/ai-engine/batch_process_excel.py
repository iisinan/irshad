import os
from dotenv import load_dotenv
load_dotenv()
import asyncio
import pandas as pd
import httpx
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from app.scripts.ngxpulse_scraper import EnterpriseNGXScraper

class BatchExcelScraper(EnterpriseNGXScraper):
    def __init__(self, excel_path):
        super().__init__()
        self.excel_path = excel_path

    async def get_passed_tickers(self):
        df = pd.read_excel(self.excel_path, header=3)
        passed_df = df[df['Business Activity Screen'].str.upper() == 'PASS']
        return passed_df['Ticker'].dropna().unique().tolist()

    async def fetch_symbol_feed(self, symbol, retries=3):
        url = f"https://ngxpulse.ng/api/ngxdata/disclosures?symbol={symbol}"
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=self.headers, timeout=20.0)
                    response.raise_for_status()
                    data = response.json().get("data", [])
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"[{symbol}] Attempt {attempt+1} failed to fetch feed: {e}")
                await asyncio.sleep(2 ** attempt)
        return []

    async def run_batch(self):
        print("Starting Batch Excel Scraper...")
        tickers = await self.get_passed_tickers()
        print(f"Found {len(tickers)} companies that passed the business screen in Excel.")

        async with self.async_session() as session:
            for symbol in tickers:
                print(f"\n--- Checking {symbol} ---")
                
                # Verify company exists in DB
                db_data = await self.get_company_data(session, symbol)
                if not db_data:
                    print(f"[{symbol}] Not found in companies/aaoifi_screenings DB, skipping.")
                    continue
                
                disclosures = await self.fetch_symbol_feed(symbol)
                financials = self.filter_financials(disclosures)
                if not financials:
                    print(f"[{symbol}] No financial statements found in NGXPulse.")
                    continue
                    
                # Get the first one (most recent)
                candidate = financials[0]
                
                await self.process_candidate(session, symbol, candidate)

if __name__ == "__main__":
    scraper = BatchExcelScraper('/Users/sinan/Downloads/NGX_Shariah_Screen (1).xlsx')
    asyncio.run(scraper.run_batch())
