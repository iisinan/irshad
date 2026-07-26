import asyncio
import os
import sys
from datetime import datetime

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import AsyncSessionLocal
from app.models.financial_screening import FinancialScreening
from app.tools.apify_client import FinancialScraper
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Find all distinct tickers that have missing published dates
        stmt = select(FinancialScreening.company_ticker).where(FinancialScreening.published_date == None).distinct()
        result = await db.execute(stmt)
        tickers = result.scalars().all()
        
        print(f"Found {len(tickers)} unique companies missing published dates.")
        
        scraper = FinancialScraper()
        
        for idx, ticker in enumerate(tickers):
            print(f"[{idx+1}/{len(tickers)}] Fetching date for {ticker}...")
            
            try:
                # Scrape NGX
                results = await scraper.search_latest_financial_report_pdfs(ticker, "", 2026)
                
                ngx_date_str = results.get("ngx_date")
                if ngx_date_str:
                    parsed_date = datetime.strptime(ngx_date_str, "%B %d, %Y")
                    # Update all screenings for this ticker that are missing the date
                    update_stmt = select(FinancialScreening).where(
                        FinancialScreening.company_ticker == ticker,
                        FinancialScreening.published_date == None
                    )
                    res = await db.execute(update_stmt)
                    recs = res.scalars().all()
                    
                    for rec in recs:
                        rec.published_date = parsed_date
                    
                    await db.commit()
                    print(f"  -> Saved date: {ngx_date_str} for {len(recs)} records.")
                else:
                    print(f"  -> No valid date found.")
            except Exception as e:
                print(f"  -> Error processing {ticker}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
