import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.tools.apify_client import FinancialScraper

async def test():
    scraper = FinancialScraper()
    res = await scraper.search_annual_report_pdfs("MTN Nigeria", 2025)
    print("RESULT:", res)

asyncio.run(test())
