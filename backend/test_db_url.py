import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    try:
        url = "postgresql+asyncpg://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb"
        # Notice: I stripped '?sslmode=require'
        engine = create_async_engine(url)
        print("Engine created successfully")
        
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            print("Connected to DB and executed query successfully!")
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")

asyncio.run(main())
