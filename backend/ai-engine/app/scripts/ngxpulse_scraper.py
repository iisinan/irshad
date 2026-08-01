import os
import sys
import json
import asyncio
import requests
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from app.tools.pdf_extractor import PDFExtractor
from app.tools.aaoifi_calculator import AAOIFICalculator
from datetime import datetime

async def main():
    print("Starting NGXPulse Daily Delta Sync...")
    
    headers = {'Referer': 'https://ngxpulse.ng/disclosures'}
    url = "https://ngxpulse.ng/api/ngxdata/disclosures?limit=1000"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to fetch NGXPulse API: {response.status_code}")
        return
        
    data = response.json().get("data", [])
    if not data:
        print("No data returned from NGXPulse.")
        return
        
    print(f"Fetched {len(data)} total disclosures from feed.")
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    pdf_extractor = None
    try:
        pdf_extractor = PDFExtractor()
    except Exception as e:
        print(f"Warning: PDFExtractor init failed (check GEMINI_API_KEY). {e}")

    async with async_session() as session:
        for item in data:
            if item.get("type") != "Financial Statements" or not item.get("url"):
                continue
                
            ticker = item.get("symbol")
            pdf_url = item.get("url")
            published_date_str = item.get("created")
            
            # Check if this specific URL has already been processed for this ticker
            # We can check the aaoifi_screenings or financial_screenings.
            # But the simplest is: does aaoifi_screenings.financial_data_used contain this url?
            
            # 1. Get company id
            comp_res = await session.execute(text("SELECT id FROM companies WHERE symbol = :ticker"), {"ticker": ticker})
            company = comp_res.fetchone()
            if not company:
                continue
            company_id = company[0]
            
            # 2. Get current screening
            screen_res = await session.execute(
                text("SELECT financial_data_used FROM aaoifi_screenings WHERE company_id = :cid"), 
                {"cid": company_id}
            )
            screening = screen_res.fetchone()
            
            # Check if already processed (Delta Sync logic)
            if screening and screening[0]:
                try:
                    fin_data = json.loads(screening[0]) if isinstance(screening[0], str) else screening[0]
                    if fin_data.get("source_url") == pdf_url:
                        # We hit a filing we already processed. Since the feed is ordered newest-first,
                        # we can safely skip, but we might want to continue in case we missed earlier ones.
                        # For now, let's just skip it.
                        print(f"[{ticker}] Already processed {pdf_url}. Skipping.")
                        continue
                except Exception:
                    pass

            print(f"[{ticker}] New Financial Statement found! Downloading...")
            
            # Download PDF
            pdf_path = f"/tmp/{ticker}_financials.pdf"
            try:
                pdf_response = requests.get(pdf_url)
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_response.content)
            except Exception as e:
                print(f"Failed to download PDF for {ticker}: {e}")
                continue
                
            if not pdf_extractor:
                print("Skipping Gemini extraction due to missing API key.")
                continue

            print(f"[{ticker}] Extracting financials via Gemini...")
            try:
                # We assume current year is 2026 for now, or we let Gemini figure it out.
                result = await pdf_extractor.extract_financials(pdf_path, 2026)
                result["source_url"] = pdf_url
                result["published_date"] = published_date_str
                
                # Calculate AAOIFI ratios
                comp_info = await session.execute(text("SELECT market_cap FROM companies WHERE id = :cid"), {"cid": company_id})
                mc = comp_info.fetchone()[0] or 0.0
                calc_res = AAOIFICalculator.calculate(result, mc)
                
                debt_ratio = calc_res["ratios"]["interest_bearing_debt_ratio"] * 100.0 if calc_res["ratios"]["interest_bearing_debt_ratio"] != float('inf') else None
                cash_ratio = calc_res["ratios"]["cash_and_equivalents_ratio"] * 100.0 if calc_res["ratios"]["cash_and_equivalents_ratio"] != float('inf') else None
                income_ratio = calc_res["ratios"]["non_permissible_income_ratio"] * 100.0 if calc_res["ratios"]["non_permissible_income_ratio"] != float('inf') else None

                # Update DB
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
                print(f"[{ticker}] Successfully updated financials in database.")
                
            except Exception as e:
                print(f"[{ticker}] Extraction failed (Out of credits?): {e}")

        await session.commit()
    print("NGXPulse Delta Sync Complete.")

if __name__ == "__main__":
    asyncio.run(main())
