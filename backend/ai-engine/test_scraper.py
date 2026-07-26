import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.tools.apify_client import FinancialScraper

async def test():
    scraper = FinancialScraper()
    res = await scraper.search_latest_financial_report_pdfs("INTBREW", 2026)
    print("Final Selected:", res)

if __name__ == "__main__":
    asyncio.run(test())
