import os
from dotenv import load_dotenv
load_dotenv()
import sys
from google import genai
import json
import asyncio
import hashlib
import time
import httpx
import fitz  # PyMuPDF
import re
from sqlalchemy import text
from app.core.database import async_sessionmaker, engine
from app.tools.aaoifi_calculator import AAOIFICalculator
from datetime import datetime

class EnterpriseNGXScraper:
    def __init__(self):
        self.feed_url = "https://ngxpulse.ng/api/ngxdata/disclosures?limit=1000"
        self.headers = {'Referer': 'https://ngxpulse.ng/disclosures'}
        self.async_session = async_sessionmaker(engine, expire_on_commit=False)
        self.gemini_timeout = 90.0
        self.gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    def parse_title(self, title):
        title_lower = title.lower()
        
        year_match = re.search(r'\b(20\d{2})\b', title)
        year = int(year_match.group(1)) if year_match else None
        
        period = "Annual"
        if re.search(r'\b(q1|first quarter|quarter 1)\b', title_lower):
            period = "Q1"
        elif re.search(r'\b(q2|second quarter|half year|h1|quarter 2)\b', title_lower):
            period = "Q2"
        elif re.search(r'\b(q3|third quarter|9 months|nine months|quarter 3)\b', title_lower):
            period = "Q3"
        elif re.search(r'\b(q4|fourth quarter|full year|audited|quarter 4)\b', title_lower):
            period = "Annual"

        revision_keywords = ['amended', 'revised', 'corrected', 'restated', 'updated']
        is_revised = any(kw in title_lower for kw in revision_keywords)
        
        return year, period, is_revised

    async def run(self):
        print("Starting Enterprise NGXPulse Scraper Phase 2...")
        
        disclosures = await self.fetch_feed()
        if not disclosures:
            print("Aborting: Feed empty or invalid.")
            return

        financials = self.filter_financials(disclosures)
        candidates = self.select_candidates(financials)
        print(f"Found {len(candidates)} candidate financial statements to process.")

        async with self.async_session() as session:
            for symbol, candidate in candidates.items():
                await self.process_candidate(session, symbol, candidate)

    async def fetch_feed(self, retries=3):
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.feed_url, headers=self.headers, timeout=20.0)
                    response.raise_for_status()
                    data = response.json().get("data", [])
                    if isinstance(data, list) and len(data) > 0:
                        return data
                    print(f"Feed validation failed: Invalid data format.")
            except Exception as e:
                print(f"Attempt {attempt+1} failed to fetch feed: {e}")
                await asyncio.sleep(2 ** attempt)
        return None

    def filter_financials(self, disclosures):
        valid = []
        ignore_keywords = ['agm', 'dividend', 'rights issue', 'board meeting', 'press release', 'notice']
        for item in disclosures:
            if item.get("type") == "Financial Statements" and item.get("url") and item.get("symbol"):
                title = item.get("title", "").lower()
                if not any(kw in title for kw in ignore_keywords):
                    valid.append(item)
        return valid

    def select_candidates(self, financials):
        candidates = {}
        for item in financials:
            symbol = item["symbol"]
            if symbol not in candidates:
                candidates[symbol] = item
        return candidates

    async def get_company_data(self, session, symbol):
        query = text("""
            SELECT c.id as company_id, c.market_cap, s.business_status, s.financial_data_used, 
                   s.disclosure_id, s.pdf_hash, s.reporting_year, s.reporting_period, s.published_date, s.business_reasoning
            FROM companies c
            JOIN aaoifi_screenings s ON c.id = s.company_id
            WHERE c.symbol = :symbol
        """)
        res = await session.execute(query, {"symbol": symbol})
        return res.fetchone()

    async def generate_professional_justification(self, session, cid, symbol, biz_status, biz_reason, final_status, debt_ratio, cash_ratio, income_ratio, debt_status, cash_status, income_status):
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
        if biz_status == 'fail':
            prompt = f"""
            Rewrite the following business activity justification for a stock's Shariah compliance into clear, professional, and grammatically correct English.
            It should sound like an objective financial report explaining why the company fails Shariah compliance based on its core operations.
            Do not add any new information. Keep it concise (1-2 sentences).
            
            Original rationale: {biz_reason_text}
            """
        elif biz_status == 'pass' and final_status == 'non-halal':
            fails_text = []
            if debt_status == 'fail': fails_text.append(f"Interest-Bearing Debt ({round(debt_ratio, 2)}% which exceeds the 30% limit)")
            if cash_status == 'fail': fails_text.append(f"Cash and Equivalents ({round(cash_ratio, 2)}% which exceeds the 30% limit)")
            if income_status == 'fail': fails_text.append(f"Impermissible Income ({round(income_ratio, 2)}% which exceeds the 5% limit)")
            prompt = f"""
            Write a professional Shariah compliance summary for a stock.
            The company PASSED the business activity screening with this rationale: "{biz_reason_text}"
            However, it FAILED the quantitative financial screening because of the following: {', '.join(fails_text)}.
            
            Merge these facts into a seamless, professional 2-sentence paragraph explaining that while its core business is permissible, it fails quantitative Shariah compliance due to exceeding financial limits. Do not use academic citations or brackets.
            """
        elif biz_status == 'pass' and final_status == 'halal':
            prompt = f"""
            Write a professional Shariah compliance summary for a stock.
            The company PASSED the business activity screening with this rationale: "{biz_reason_text}"
            It also PASSED the quantitative financial screening with the following metrics: Debt Ratio is {round(debt_ratio, 2)}%, Cash Ratio is {round(cash_ratio, 2)}%, and Impermissible Income is {round(income_ratio, 2)}%.
            
            Merge these facts into a seamless, professional 2-sentence paragraph explaining that the company fully complies with Shariah standards for both its core business and its financial ratios. Do not use academic citations or brackets.
            """
            
        if prompt:
            print(f"[{symbol}] Generating AI professional justification summary...")
            try:
                response = self.gemini_client.models.generate_content(
                    model='gemini-3.5-flash',
                    contents=prompt.strip(),
                )
                new_reason = response.text.strip()
                check_q = text("SELECT id FROM stock_statuses WHERE company_id = :cid")
                exists = await session.execute(check_q, {'cid': cid})
                if exists.fetchone():
                    upd = text("UPDATE stock_statuses SET reason = :r, status = :status, updated_at = NOW(), last_updated = NOW() WHERE company_id = :cid")
                    await session.execute(upd, {'cid': cid, 'status': final_status, 'r': new_reason})
                else:
                    ins = text("INSERT INTO stock_statuses (company_id, status, reason, updated_at, last_updated) VALUES (:cid, :status, :r, NOW(), NOW())")
                    await session.execute(ins, {'cid': cid, 'status': final_status, 'r': new_reason})
            except Exception as e:
                print(f"[{symbol}] AI Justification Generation failed: {e}")

    async def log_audit(self, session, company_id, disclosure_id, url, pdf_hash, status, reason, duration=0.0):
        query = text("""
            INSERT INTO ngxpulse_audit_logs 
            (company_id, disclosure_id, source_url, pdf_hash, status, reason, processing_duration, created_at, updated_at)
            VALUES (:cid, :did, :url, :hash, :status, :reason, :duration, NOW(), NOW())
        """)
        await session.execute(query, {
            "cid": company_id, "did": disclosure_id, "url": url, "hash": pdf_hash, 
            "status": status, "reason": reason, "duration": duration
        })
        await session.commit()

    async def push_to_review_queue(self, session, company_id, disclosure_id, url, extracted_data, reason):
        query = text("""
            INSERT INTO financial_review_queue 
            (company_id, disclosure_id, source_url, extracted_data, status, review_reason, created_at, updated_at)
            VALUES (:cid, :did, :url, :data, 'pending', :reason, NOW(), NOW())
        """)
        await session.execute(query, {
            "cid": company_id, "did": disclosure_id, "url": url, 
            "data": json.dumps(extracted_data), "reason": reason
        })
        await session.commit()

    async def download_pdf(self, url, pdf_path, retries=3):
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=30.0)
                    resp.raise_for_status()
                    with open(pdf_path, 'wb') as f:
                        f.write(resp.content)
                    return True
            except Exception as e:
                print(f"Download attempt {attempt+1} failed: {e}")
                await asyncio.sleep(2 ** attempt)
        return False

    async def process_candidate(self, session, symbol, candidate):
        start_time = time.time()
        url = candidate["url"]
        disclosure_id = candidate.get("id", "")
        pub_date_str = candidate.get("created")
        title = candidate.get("title", "")

        db_data = await self.get_company_data(session, symbol)
        if not db_data:
            return
            
        cid = db_data[0]
        mc = float(db_data[1] or 0.0)
        business_status = db_data[2]
        prev_hash = db_data[5]
        prev_year = db_data[6]
        prev_period = db_data[7]
        
        if business_status and business_status.lower() != 'pass':
            await self.log_audit(session, cid, disclosure_id, url, None, 'skipped', 'Business status failed')
            # Generate AI text for business fail cases anyway since they might have just been imported
            biz_reason = db_data[9]
            await self.generate_professional_justification(session, cid, symbol, 'fail', biz_reason, 'non-halal', 0, 0, 0, 'pass', 'pass', 'pass')
            await session.commit()
            return

        # Pre-AI Freshness Verification (Phase 11 & Phase 8)
        title_year, title_period, is_revised = self.parse_title(title)
        
        # If we have previous year/period in DB, do logic checks
        if prev_year and title_year:
            if title_year < prev_year:
                await self.log_audit(session, cid, disclosure_id, url, None, 'skipped', f'Older year in title: {title_year} < {prev_year}')
                return
            if title_year == prev_year and title_period == prev_period:
                if not is_revised:
                    await self.log_audit(session, cid, disclosure_id, url, None, 'skipped', f'Same period ({title_period} {title_year}) and not marked revised')
                    return

        print(f"[{symbol}] Processing new candidate: {title}")
        
        # Phase 9: Download with Retries
        await asyncio.sleep(5)
        pdf_path = f"/tmp/{symbol}_fin.pdf"
        success = await self.download_pdf(url, pdf_path)
        if not success:
            await self.log_audit(session, cid, disclosure_id, url, None, 'failed', 'Download failed after retries')
            return

        # Phase 7 & 8: Hash Check
        with open(pdf_path, 'rb') as f:
            pdf_hash = hashlib.sha256(f.read()).hexdigest()
            
        if prev_hash == pdf_hash:
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'skipped', 'Duplicate Hash')
            return

        # Validate PDF with PyMuPDF
        try:
            doc = fitz.open(pdf_path)
            if doc.is_encrypted or doc.page_count == 0:
                raise Exception("PDF is encrypted or empty")
            text_content = "".join(page.get_text() for page in doc[:5])
            if len(text_content.strip()) < 50:
                raise Exception("PDF contains no readable text")
        except Exception as e:
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'failed', f'PDF Validation failed: {e}')
            return

        # Phase 12: AI Extraction with Retries
        if not os.getenv("GEMINI_API_KEY"):
            print("Skipping AI extraction, no GEMINI_API_KEY")
            return

        extracted_data = {}
        target_year = str(title_year) if title_year else str(datetime.now().year)
        
        for attempt in range(3):
            try:
                proc = await asyncio.create_subprocess_exec(
                    sys.executable, "-m", "app.scripts.gemini_extract_single",
                    pdf_path, target_year,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.gemini_timeout)
                decoded_stdout = stdout.decode().strip()
                extracted_data = json.loads(decoded_stdout) if decoded_stdout else {}
                if extracted_data and "error" not in extracted_data:
                    break
            except asyncio.TimeoutError:
                proc.kill()
                print(f"Gemini attempt {attempt+1} timeout.")
            except Exception as e:
                print(f"Gemini attempt {attempt+1} error: {e}")
            await asyncio.sleep(2 ** attempt)

        if not extracted_data or "error" in extracted_data:
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'failed', 'Gemini returned empty or error after retries')
            return

        extracted_data["source_url"] = url
        extracted_data["published_date"] = pub_date_str

        # Phase 13 & 10: Extraction & Discrepancy Validation
        try:
            assets = extracted_data.get("total_assets", {}).get("value", -1)
            debt = extracted_data.get("total_debt", {}).get("value", -1)
            gemini_period = extracted_data.get("reporting_period", "")
            
            needs_review = False
            review_reason = []
            
            # Post-AI Period Discrepancy Check (Phase 10)
            if title_period and gemini_period:
                def norm(p):
                    p = p.lower()
                    if any(x in p for x in ['q1', 'first quarter', 'quarter 1', '3m', '3 month', 'three month', 'jan-march']): return 'Q1'
                    if any(x in p for x in ['q2', 'second quarter', 'quarter 2', '6m', '6 mth', '6 month', 'half year', 'h1', 'six month']): return 'Q2'
                    if any(x in p for x in ['q3', 'third quarter', 'quarter 3', '9m', '9 month', 'nine month']): return 'Q3'
                    if any(x in p for x in ['q4', 'fourth quarter', 'quarter 4', 'annual', 'full year', 'audited', 'year ended']): return 'Annual'
                    return p
                
                if norm(title_period) != norm(gemini_period):
                    needs_review = True
                    review_reason.append(f"Period Mismatch (Title: {title_period} vs PDF: {gemini_period})")

            if assets <= 0:
                needs_review = True
                review_reason.append("Assets <= 0")
            if debt < 0:
                needs_review = True
                review_reason.append("Debt < 0")
                
            for key in ["total_assets", "total_debt", "cash_and_equivalents"]:
                conf = extracted_data.get(key, {}).get("confidence", 0)
                if conf < 70:
                    needs_review = True
                    review_reason.append(f"Low confidence on {key}")
                    
            if needs_review:
                await self.push_to_review_queue(session, cid, disclosure_id, url, extracted_data, " | ".join(review_reason))
                duration = time.time() - start_time
                await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'review', "Sent to review queue", duration)
                return
                
        except Exception as e:
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'failed', f'Validation crash: {e}')
            return

        # Calculation
        try:
            calc_res = AAOIFICalculator.calculate(extracted_data, mc)
            
            dr = calc_res["ratios"]["interest_bearing_debt_ratio"]
            cr = calc_res["ratios"]["cash_and_equivalents_ratio"]
            ir = calc_res["ratios"]["non_permissible_income_ratio"]
            
            debt_ratio = dr * 100.0 if dr != float('inf') else None
            cash_ratio = cr * 100.0 if cr != float('inf') else None
            income_ratio = ir * 100.0 if ir != float('inf') else None

            debt_status = 'pass' if calc_res["status"]["debt_pass"] else 'fail'
            cash_status = 'pass' if calc_res["status"]["cash_pass"] else 'fail'
            income_status = 'pass' if calc_res["status"]["income_pass"] else 'fail'
            final_status = 'halal' if calc_res["overall_financial_pass"] else 'non-halal'

            report_year = extracted_data.get("financial_year")
            report_period = extracted_data.get("reporting_period")
        except Exception as e:
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'failed', f'AAOIFI Calculation crash: {e}')
            return

        # Phase 14: Atomic Update
        try:
            update_query = text("""
                UPDATE aaoifi_screenings 
                SET financial_data_used = :fin_data,
                    debt_ratio = :dr, debt_status = :ds,
                    cash_ratio = :cr, cash_status = :cs,
                    impermissible_income_ratio = :ir, impermissible_income_status = :is,
                    final_status = :fs,
                    disclosure_id = :did, pdf_hash = :hash,
                    reporting_year = :ry, reporting_period = :rp, published_date = :pd,
                    updated_at = NOW()
                WHERE company_id = :cid
            """)
            from datetime import datetime
            pd_obj = None
            if pub_date_str:
                try:
                    pd_obj = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                except:
                    pass
            
            await session.execute(update_query, {
                "fin_data": json.dumps(extracted_data),
                "dr": debt_ratio, "ds": debt_status,
                "cr": cash_ratio, "cs": cash_status,
                "ir": income_ratio, "is": income_status,
                "fs": final_status,
                "did": disclosure_id, "hash": pdf_hash,
                "ry": report_year, "rp": report_period, 
                "pd": pd_obj,
                "cid": cid
            })
            
            duration = time.time() - start_time
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'success', 'Successfully processed', duration)
            print(f"[{symbol}] ✅ Successfully updated.")
            
            biz_reason = db_data[9]
            await self.generate_professional_justification(
                session, cid, symbol, 'pass', biz_reason, final_status, 
                debt_ratio or 0, cash_ratio or 0, income_ratio or 0, 
                debt_status, cash_status, income_status
            )
        except Exception as e:
            await session.rollback()
            await self.log_audit(session, cid, disclosure_id, url, pdf_hash, 'failed', f'DB Update crash: {e}')
            print(f"[{symbol}] ❌ DB update failed: {e}")

if __name__ == "__main__":
    scraper = EnterpriseNGXScraper()
    asyncio.run(scraper.run())
