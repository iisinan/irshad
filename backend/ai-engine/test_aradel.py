import asyncio
from app.core.bulk_processor import BulkProcessor

async def main():
    bp = BulkProcessor()
    tickers = await bp.get_all_tickers()
    if 'ARADEL' in tickers:
        print("ARADEL index:", tickers.index('ARADEL'))
    else:
        print("ARADEL not found")

asyncio.run(main())
