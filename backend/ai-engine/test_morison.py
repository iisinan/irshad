import os
import sys
import pandas as pd
import asyncio
import requests
import json
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from google import genai
from app.tools.pdf_extractor import PDFExtractor
from app.tools.aaoifi_calculator import AAOIFICalculator
from app.scripts.ingest_business_excel import rephrase_rationale

async def main():
    target_ticker = "MORISON"
    print(f"=== TESTING PIPELINE FOR {target_ticker} ===")
    
    # 1. Excel Business Activity
    print("\n--- 1. BUSINESS ACTIVITY (EXCEL + GEMINI) ---")
    file_path = "/Users/sinan/Downloads/NGX_Shariah_Screen (1).xlsx"
    df = pd.read_excel(file_path, engine='openpyxl', skiprows=3)
    
    row = df[df['Ticker'] == target_ticker]
    if row.empty:
        print("Ticker not found in Excel!")
        return
        
    row = row.iloc[0]
    raw_rationale = str(row.get('Rationale', '')).strip()
    business_status = str(row.get('Business Activity Screen', '')).strip().upper()
    db_status = 'pass' if business_status == 'PASS' else 'fail'
    
    print(f"Excel Raw Status: {business_status}")
    print(f"Excel Raw Rationale: {raw_rationale}")
    
    api_key = os.getenv("GEMINI_API_KEY")
    from google.genai import types as genai_types
    client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1'))
    
    rephrased = await rephrase_rationale(raw_rationale, client)
    print(f"Gemini Rephrased Rationale: {rephrased}")
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        # Get company ID
        comp_res = await session.execute(text("SELECT id FROM companies WHERE symbol = :ticker"), {"ticker": target_ticker})
        company = comp_res.fetchone()
        if not company:
            print("Company not in DB!")
            return
        company_id = company[0]
        
        # Update DB for Stage 1
        await session.execute(
            text("""
                UPDATE aaoifi_screenings 
                SET business_status = :status, 
                    business_reasoning = :reasoning,
                    updated_at = NOW()
                WHERE company_id = :company_id
            """),
            {"status": db_status, "reasoning": json.dumps(rephrased), "company_id": company_id}
        )
        await session.commit()
        print("Database updated with Business Activity.")

    # 2. NGXPulse Financial Extraction
    print("\n--- 2. FINANCIAL EXTRACTION (NGXPULSE + GEMINI) ---")
    headers = {'Referer': 'https://ngxpulse.ng/disclosures'}
    url = "https://ngxpulse.ng/api/ngxdata/disclosures?limit=500"
    response = requests.get(url, headers=headers)
    data = response.json().get("data", [])
    
    target_pdf_url = None
    for item in data:
        if item.get("symbol") == target_ticker and item.get("type") == "Financial Statements":
            target_pdf_url = item.get("url")
            break
            
    if not target_pdf_url:
        print("No Financial Statement found on NGXPulse for this ticker.")
        return
        
    print(f"Found PDF: {target_pdf_url}")
    pdf_path = f"/tmp/{target_ticker}_financials.pdf"
    pdf_response = requests.get(target_pdf_url)
    with open(pdf_path, 'wb') as f:
        f.write(pdf_response.content)
        
    print("Extracting with Gemini 3.5 Flash...")
    extractor = PDFExtractor()
    result = await extractor.extract_financials(pdf_path, 2026)
    print("Extraction Result:")
    print(json.dumps(result, indent=2))
    
    result["source_url"] = target_pdf_url
    
    # 3. Calculate AAOIFI math
    async with async_session() as session:
        comp_info = await session.execute(text("SELECT market_cap FROM companies WHERE id = :cid"), {"cid": company_id})
        mc = comp_info.fetchone()[0] or 0.0
        
        calc_res = AAOIFICalculator.calculate(result, mc)
        
        debt_ratio = calc_res["ratios"]["interest_bearing_debt_ratio"] * 100.0 if calc_res["ratios"]["interest_bearing_debt_ratio"] != float('inf') else None
        cash_ratio = calc_res["ratios"]["cash_and_equivalents_ratio"] * 100.0 if calc_res["ratios"]["cash_and_equivalents_ratio"] != float('inf') else None
        income_ratio = calc_res["ratios"]["non_permissible_income_ratio"] * 100.0 if calc_res["ratios"]["non_permissible_income_ratio"] != float('inf') else None
        
        print(f"Calculated Debt Ratio: {debt_ratio}%")
        print(f"Calculated Cash Ratio: {cash_ratio}%")
        print(f"Calculated Income Ratio: {income_ratio}%")
        
        # Update DB for Stage 2
        await session.execute(
            text("""
                UPDATE aaoifi_screenings 
                SET financial_data_used = :fin_data,
                    debt_ratio = :dr,
                    cash_ratio = :cr,
                    impermissible_income_ratio = :ir,
                    updated_at = NOW()
                WHERE company_id = :cid
            """),
            {
                "fin_data": json.dumps(result), 
                "dr": debt_ratio,
                "cr": cash_ratio,
                "ir": income_ratio,
                "cid": company_id
            }
        )
        await session.commit()
        print("Database updated with Financial Data and Calculated Ratios.")
        
    print("\n=== PIPELINE TEST COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(main())
