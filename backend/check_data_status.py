import asyncio
import asyncpg

async def main():
    url = "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    try:
        conn = await asyncpg.connect(url)
        
        # Get all tickers
        companies = await conn.fetch("SELECT ticker FROM companies ORDER BY ticker")
        all_tickers = [c['ticker'] for c in companies]
        
        # Get completed screenings
        screenings = await conn.fetch("SELECT ticker, report_quarter, published_date FROM financial_screenings")
        screened_tickers = set(s['ticker'] for s in screenings)
        
        print(f"Total Companies tracked: {len(all_tickers)}")
        print(f"Total Companies with extracted data: {len(screenings)}")
        print("\n--- AVAILABLE DATA ---")
        for s in screenings:
            print(f"✅ {s['ticker']} (Period: {s['report_quarter']}, Date: {s['published_date']})")
            
        print("\n--- MISSING DATA (Pending Extraction) ---")
        missing = [t for t in all_tickers if t not in screened_tickers]
        print(f"{len(missing)} companies are missing data.")
        if missing:
            print(", ".join(missing[:50]) + ("..." if len(missing) > 50 else ""))
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
