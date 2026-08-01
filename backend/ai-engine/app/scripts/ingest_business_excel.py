import os
import sys
import pandas as pd
import asyncio
import json
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from google import genai
from google.genai import types

async def rephrase_rationale(rationale: str, client: genai.Client) -> str:
    if not rationale or str(rationale).strip() == "nan":
        return ""
        
    prompt = (
        f"You are a Shariah finance expert. Rewrite the following business screening rationale "
        f"into a clean, professional, user-friendly sentence or two. Ensure it sounds authoritative "
        f"and focuses on the permissibility of their core business activities based on AAOIFI standards.\n\n"
        f"Raw Rationale: {rationale}\n\n"
        f"Rephrased:"
    )
    
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-3.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error (possibly out of credits): {e}")
        return rationale # Fallback to original

async def main():
    file_path = "/Users/sinan/Downloads/NGX_Shariah_Screen (1).xlsx"
    if not os.path.exists(file_path):
        print(f"Error: Excel file not found at {file_path}")
        return

    # Find where headers start
    headers_row = 3 # Hardcoded from our test, but we can verify dynamically if needed
    df = pd.read_excel(file_path, engine='openpyxl', skiprows=headers_row)
    
    api_key = os.getenv("GEMINI_API_KEY")
    client = None
    if api_key:
        from google.genai import types as genai_types
        client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1'))
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        for idx, row in df.iterrows():
            ticker = str(row.get('Ticker', '')).strip()
            if not ticker or ticker == 'nan':
                continue
                
            business_status = str(row.get('Business Activity Screen', '')).strip().upper()
            raw_rationale = str(row.get('Rationale', '')).strip()
            
            # 1. Find company in DB
            result = await session.execute(text("SELECT id FROM companies WHERE symbol = :ticker"), {"ticker": ticker})
            company = result.fetchone()
            if not company:
                print(f"Warning: Ticker {ticker} not found in database. Skipping.")
                continue
            
            company_id = company[0]
            
            # 2. Rephrase
            if client:
                rephrased = await rephrase_rationale(raw_rationale, client)
            else:
                rephrased = raw_rationale
                
            db_status = 'pass' if business_status == 'PASS' else 'fail'
            
            # 3. Update aaoifi_screenings
            await session.execute(
                text("""
                    UPDATE aaoifi_screenings 
                    SET business_status = :status, 
                        business_reasoning = :reasoning,
                        updated_at = NOW()
                    WHERE company_id = :company_id
                """),
                {
                    "status": db_status,
                    "reasoning": json.dumps(rephrased),
                    "company_id": company_id
                }
            )
            print(f"Updated Stage 1 (Business Activity) for {ticker}: {db_status}")
            
        await session.commit()
    print("Excel Import Completed Successfully.")

if __name__ == "__main__":
    asyncio.run(main())
