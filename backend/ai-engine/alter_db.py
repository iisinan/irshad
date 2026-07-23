import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/ai_engine"

async def alter_table():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        try:
            # Try to add the columns
            await conn.execute("ALTER TABLE financial_screenings ADD COLUMN published_date TIMESTAMP WITH TIME ZONE")
        except Exception as e:
            print("published_date might already exist or table missing", e)
            
        try:
            await conn.execute("ALTER TABLE financial_screenings ADD COLUMN report_quarter VARCHAR")
        except Exception as e:
            print("report_quarter might already exist or table missing", e)
            
    print("Alter table complete.")

if __name__ == "__main__":
    asyncio.run(alter_table())
