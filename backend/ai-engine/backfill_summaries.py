import asyncio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from google import genai

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

async def backfill():
    async with async_sessionmaker(engine)() as session:
        query = text("""
            SELECT 
                c.id as company_id,
                c.symbol, 
                a.business_status,
                a.business_reasoning,
                a.final_status,
                a.debt_ratio,
                a.cash_ratio,
                a.impermissible_income_ratio,
                a.debt_status,
                a.cash_status,
                a.impermissible_income_status,
                s.reason as current_reason
            FROM aaoifi_screenings a
            JOIN companies c ON a.company_id = c.id
            LEFT JOIN stock_statuses s ON c.id = s.company_id
            WHERE a.business_reasoning IS NOT NULL
        """)
        res = await session.execute(query)
        rows = res.fetchall()
        
        print(f"Found {len(rows)} records to evaluate for backfill.")
        
        for row in rows:
            company_id = row[0]
            symbol = row[1]
            biz_status = row[2]
            biz_reason = row[3]
            final_status = row[4]
            current_reason = row[11]
            
            # Extract biz reason text if it's JSON
            if isinstance(biz_reason, dict) and "reasoning" in biz_reason:
                biz_reason_text = biz_reason["reasoning"]
            elif isinstance(biz_reason, dict) and "evidence" in biz_reason:
                biz_reason_text = biz_reason["evidence"]
            elif isinstance(biz_reason, str):
                try:
                    parsed = json.loads(biz_reason)
                    if isinstance(parsed, dict):
                        biz_reason_text = parsed.get("reasoning", biz_reason)
                    else:
                        biz_reason_text = biz_reason
                except:
                    biz_reason_text = biz_reason
            else:
                biz_reason_text = str(biz_reason)
                
            prompt = None
            
            # Rule 1: Fails business activity
            if biz_status == 'fail':
                prompt = f"""
                Rewrite the following business activity justification for a stock's Shariah compliance into clear, professional, and grammatically correct English.
                It should sound like an objective financial report explaining why the company fails Shariah compliance based on its core operations.
                Do not add any new information. Keep it concise (1-2 sentences).
                
                Original rationale: {biz_reason_text}
                """
            
            # Rule 2: Passes business activity, but fails financial screening
            elif biz_status == 'pass' and final_status == 'non-halal':
                fails_text = []
                if row[8] == 'fail': fails_text.append(f"Interest-Bearing Debt ({round(float(row[5] or 0), 2)}% which exceeds the 30% limit)")
                if row[9] == 'fail': fails_text.append(f"Cash and Equivalents ({round(float(row[6] or 0), 2)}% which exceeds the 30% limit)")
                if row[10] == 'fail': fails_text.append(f"Impermissible Income ({round(float(row[7] or 0), 2)}% which exceeds the 5% limit)")
                
                prompt = f"""
                Write a professional Shariah compliance summary for a stock.
                The company PASSED the business activity screening with this rationale: "{biz_reason_text}"
                However, it FAILED the quantitative financial screening because of the following: {', '.join(fails_text)}.
                
                Merge these facts into a seamless, professional 2-sentence paragraph explaining that while its core business is permissible, it fails quantitative Shariah compliance due to exceeding financial limits. Do not use academic citations or brackets.
                """
                
            # Rule 3: Passes both
            elif biz_status == 'pass' and final_status == 'halal':
                prompt = f"""
                Write a professional Shariah compliance summary for a stock.
                The company PASSED the business activity screening with this rationale: "{biz_reason_text}"
                It also PASSED the quantitative financial screening with the following metrics: Debt Ratio is {round(float(row[5] or 0), 2)}%, Cash Ratio is {round(float(row[6] or 0), 2)}%, and Impermissible Income is {round(float(row[7] or 0), 2)}%.
                
                Merge these facts into a seamless, professional 2-sentence paragraph explaining that the company fully complies with Shariah standards for both its core business and its financial ratios. Do not use academic citations or brackets.
                """
                
            if prompt:
                print(f"Generating summary for {symbol}...")
                try:
                    response = client.models.generate_content(
                        model='gemini-3.5-flash',
                        contents=prompt.strip(),
                    )
                    new_reason = response.text.strip()
                    
                    check_q = text("SELECT id FROM stock_statuses WHERE company_id = :cid")
                    exists = await session.execute(check_q, {'cid': company_id})
                    if exists.fetchone():
                        upd = text("UPDATE stock_statuses SET reason = :r, status = :status, updated_at = NOW(), last_updated = NOW() WHERE company_id = :cid")
                        await session.execute(upd, {'cid': company_id, 'status': final_status, 'r': new_reason})
                    else:
                        ins = text("INSERT INTO stock_statuses (company_id, status, reason, updated_at, last_updated) VALUES (:cid, :status, :r, NOW(), NOW())")
                        await session.execute(ins, {'cid': company_id, 'status': final_status, 'r': new_reason})
                    await session.commit()
                    print(f"[{symbol}] Successfully updated.")
                    
                    await asyncio.sleep(2) # rate limit mitigation
                except Exception as e:
                    print(f"Error on {symbol}: {e}")

if __name__ == '__main__':
    asyncio.run(backfill())
