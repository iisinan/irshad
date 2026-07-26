import asyncio
from app.core.bulk_processor import BulkProcessor

async def main():
    processor = BulkProcessor()
    await processor.process_all_tickers(financial_year=2026, phase=2)

if __name__ == "__main__":
    asyncio.run(main())
