import asyncio
from app.core.bulk_processor import BulkProcessor

async def main():
    processor = BulkProcessor()
    print("Re-running Phase 1 to catch any missed companies...")
    await processor.process_all_tickers(financial_year=2026, phase=1)

if __name__ == "__main__":
    asyncio.run(main())
