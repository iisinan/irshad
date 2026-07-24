import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.tools.apify_client import FinancialScraper

async def test():
    scraper = FinancialScraper()
    res = await scraper.search_annual_report_pdfs("ARADEL", 2024, True)
    print("Final Selected:", res)

if __name__ == "__main__":
    asyncio.run(test())
