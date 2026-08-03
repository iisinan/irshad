import os
from dotenv import load_dotenv
load_dotenv()
import asyncio
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from app.scripts.ngxpulse_scraper import EnterpriseNGXScraper

async def test_aradel():
    scraper = EnterpriseNGXScraper()
    print("Fetching NGXPulse feed...")
    disclosures = await scraper.fetch_feed()
    if not disclosures:
        print("Empty feed")
        return

    financials = scraper.filter_financials(disclosures)
    
    # Filter for ARADEL
    aradel_items = [item for item in financials if item.get('symbol') == 'ARADEL']
    
    if not aradel_items:
        print("No financial statements found for ARADEL in the latest feed.")
        # Try to find any ARADEL disclosures regardless of type
        all_aradel = [item for item in disclosures if item.get('symbol') == 'ARADEL']
        if all_aradel:
            print(f"However, found {len(all_aradel)} other disclosures for ARADEL:")
            for item in all_aradel:
                print(f" - {item.get('title')} (Type: {item.get('type')})")
        return

    candidates = scraper.select_candidates(aradel_items)
    print(f"Found ARADEL candidate: {candidates.get('ARADEL', {}).get('title')}")
    
    async with scraper.async_session() as session:
        for symbol, candidate in candidates.items():
            print(f"Testing process for {symbol}...")
            # We bypass the DB freshness check temporarily for this test
            # by overriding get_company_data
            original_get = scraper.get_company_data
            
            async def mock_get(session, symbol):
                data = await original_get(session, symbol)
                if data:
                    # Mock prev_hash and prev_year/period to ensure it proceeds
                    return (data[0], data[1], 'pass', data[3], data[4], 'mocked_hash', None, None, None)
                return data
                
            scraper.get_company_data = mock_get
            
            await scraper.process_candidate(session, symbol, candidate)

if __name__ == "__main__":
    asyncio.run(test_aradel())
