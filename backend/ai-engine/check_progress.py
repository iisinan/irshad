import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def get_count():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text('SELECT count(*) FROM companies WHERE date_listed IS NOT NULL'))
        print("Companies with date_listed:", result.scalar())

if __name__ == "__main__":
    asyncio.run(get_count())
