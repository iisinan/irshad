import asyncio
import json
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from app.tools.aaoifi_calculator import AAOIFICalculator

async def main():
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        # Get MORISON id
        comp = await session.execute(text("SELECT id, market_cap FROM companies WHERE symbol = 'MORISON'"))
        row = comp.fetchone()
        if not row: return
        cid, mc = row[0], row[1] or 0.0
        
        # Get current JSON
        scr = await session.execute(text("SELECT financial_data_used FROM aaoifi_screenings WHERE company_id = :cid"), {"cid": cid})
        fin_data_str = scr.fetchone()[0]
        if not fin_data_str: return
        
        fin_data = json.loads(fin_data_str) if isinstance(fin_data_str, str) else fin_data_str
        
        calc_res = AAOIFICalculator.calculate(fin_data, mc)
        debt = calc_res["ratios"]["interest_bearing_debt_ratio"] * 100.0
        cash = calc_res["ratios"]["cash_and_equivalents_ratio"] * 100.0
        inc = calc_res["ratios"]["non_permissible_income_ratio"] * 100.0
        
        print(f"Calculated Debt Ratio: {debt}%")
        print(f"Calculated Cash Ratio: {cash}%")
        print(f"Calculated Income Ratio: {inc}%")
        
        await session.execute(
            text("""
                UPDATE aaoifi_screenings 
                SET debt_ratio = :dr,
                    cash_ratio = :cr,
                    impermissible_income_ratio = :ir
                WHERE company_id = :cid
            """),
            {"dr": debt, "cr": cash, "ir": inc, "cid": cid}
        )
        await session.commit()
        print("Updated MORISON.")

asyncio.run(main())
