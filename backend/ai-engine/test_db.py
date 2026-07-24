import asyncio
import os
from app.core.database import engine

async def test():
    async with engine.begin() as conn:
        print('Success!')

asyncio.run(test())
