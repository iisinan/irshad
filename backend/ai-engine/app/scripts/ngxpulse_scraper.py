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

FAILED_LOG_FILE = "/Users/sinan/Herd/irshad/backend/storage/logs/failed_extractions.jsonl"

def log_failure(ticker, url, reason):
    try:
        with open(FAILED_LOG_FILE, 'a') as f:
            f.write(json.dumps({
                "ticker": ticker,
                "url": url,
                "reason": str(reason),
                "timestamp": datetime.now().isoformat()
            }) + "\n")
    except Exception:
        pass

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
                text("SELECT financial_data_used, business_status FROM aaoifi_screenings WHERE company_id = :cid"), 
                {"cid": company_id}
            )
            screening = screen_res.fetchone()
            
            if screening:
                # OPTIMIZATION: Skip Stage 2 if Stage 1 (Business Activity) failed
                business_status = screening[1]
                if business_status and business_status.lower() != 'pass':
                    print(f"[{ticker}] Skipping financial extraction because business_status is '{business_status}'.")
                    continue

                # Check if already processed (Delta Sync logic)
                if screening[0]:
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

            # Release the DB connection back to the pool before starting long-running network tasks
            await session.commit()

            print(f"[{ticker}] New Financial Statement found! Downloading...", flush=True)
            
            # Download PDF
            pdf_path = f"/tmp/{ticker}_financials.pdf"
            try:
                pdf_response = requests.get(pdf_url, timeout=30)
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_response.content)
            except Exception as e:
                print(f"Failed to download PDF for {ticker}: {e}")
                log_failure(ticker, pdf_url, f"PDF Download Error: {e}")
                continue
                
            if not os.getenv("GEMINI_API_KEY"):
                print(f"[{ticker}] Skipping - no GEMINI_API_KEY.", flush=True)
                continue

            print(f"[{ticker}] Extracting financials via Gemini subprocess (90s timeout)...", flush=True)
            try:
                proc = await asyncio.create_subprocess_exec(
                    sys.executable, "-m", "app.scripts.gemini_extract_single",
                    pdf_path, str(2026),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                try:
                    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=90.0)
                    if stderr:
                        print(f"[{ticker}] Gemini log: {stderr.decode()[:300]}", flush=True)
                    decoded_stdout = stdout.decode().strip()
                    print(f"[{ticker}] STDOUT: {decoded_stdout[:500]}", flush=True)
                    result = json.loads(decoded_stdout) if decoded_stdout else {}
                except asyncio.TimeoutError:
                    proc.kill()
                    await proc.communicate()
                    print(f"[{ticker}] Gemini timed out after 90s. Skipping.", flush=True)
                    log_failure(ticker, pdf_url, "Gemini Timeout (90s)")
                    continue
            except Exception as e:
                print(f"[{ticker}] Subprocess error: {e}", flush=True)
                log_failure(ticker, pdf_url, f"Subprocess error: {e}")
                continue

            if not result:
                print(f"[{ticker}] Gemini returned empty result. Skipping.", flush=True)
                log_failure(ticker, pdf_url, "Gemini returned empty JSON")
                continue

            print(f"[{ticker}] JSON parsed successfully. Calculating ratios...", flush=True)
            result["source_url"] = pdf_url
            result["published_date"] = published_date_str

            # Calculate AAOIFI ratios
            print(f"[{ticker}] Fetching market cap from DB...", flush=True)
            try:
                comp_info = await asyncio.wait_for(
                    session.execute(text("SELECT market_cap FROM companies WHERE id = :cid"), {"cid": company_id}),
                    timeout=10.0
                )
                mc = comp_info.fetchone()[0] or 0.0
                print(f"[{ticker}] Market cap fetched: {mc}", flush=True)
            except asyncio.TimeoutError:
                print(f"[{ticker}] DB connection hung on market cap select! Timeout.", flush=True)
                log_failure(ticker, pdf_url, "DB connection hung on Market Cap select")
                continue
            except Exception as e:
                print(f"[{ticker}] Error fetching market cap: {e}", flush=True)
                log_failure(ticker, pdf_url, f"Error fetching Market Cap: {e}")
                continue
                
            calc_res = AAOIFICalculator.calculate(result, mc)

            debt_ratio = calc_res["ratios"]["interest_bearing_debt_ratio"] * 100.0 if calc_res["ratios"]["interest_bearing_debt_ratio"] != float('inf') else None
            cash_ratio = calc_res["ratios"]["cash_and_equivalents_ratio"] * 100.0 if calc_res["ratios"]["cash_and_equivalents_ratio"] != float('inf') else None
            income_ratio = calc_res["ratios"]["non_permissible_income_ratio"] * 100.0 if calc_res["ratios"]["non_permissible_income_ratio"] != float('inf') else None

            # Get statuses
            debt_status = 'pass' if calc_res["status"]["debt_pass"] else 'fail'
            cash_status = 'pass' if calc_res["status"]["cash_pass"] else 'fail'
            income_status = 'pass' if calc_res["status"]["income_pass"] else 'fail'
            
            # Combine Stage 1 (business_status) and Stage 2 (financials)
            # We already know business_status == 'pass' because of the skip logic earlier, 
            # but we use overall_financial_pass to determine the final verdict.
            final_status = 'halal' if calc_res["overall_financial_pass"] else 'non-halal'

            # Update DB
            try:
                await session.execute(
                    text("""
                        UPDATE aaoifi_screenings 
                        SET financial_data_used = :fin_data,
                            debt_ratio = :dr,
                            debt_status = :ds,
                            cash_ratio = :cr,
                            cash_status = :cs,
                            impermissible_income_ratio = :ir,
                            impermissible_income_status = :is,
                            final_status = :fs,
                            updated_at = NOW()
                        WHERE company_id = :cid
                    """),
                    {
                        "fin_data": json.dumps(result),
                        "dr": debt_ratio,
                        "ds": debt_status,
                        "cr": cash_ratio,
                        "cs": cash_status,
                        "ir": income_ratio,
                        "is": income_status,
                        "fs": final_status,
                        "cid": company_id
                    }
                )
                await session.commit()
                print(f"[{ticker}] ✅ Successfully updated financials in database.", flush=True)
            except Exception as e:
                await session.rollback()
                print(f"[{ticker}] ❌ DB update failed: {e}", flush=True)
                log_failure(ticker, pdf_url, f"Database update failed: {e}")
    print("NGXPulse Delta Sync Complete.")

if __name__ == "__main__":
    asyncio.run(main())
