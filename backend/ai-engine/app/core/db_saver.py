import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.financial_screening import FinancialScreening
from app.models.business_screening import BusinessScreening
from app.models.companies import Company

def sanitize_json(data):
    if isinstance(data, dict):
        return {k: sanitize_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json(v) for v in data]
    elif isinstance(data, float):
        if math.isinf(data) or math.isnan(data):
            return None
    return data

async def save_graph_result_to_db(db: AsyncSession, ticker: str, financial_year: int, result_state: dict):
    # Get company_id
    comp_result = await db.execute(select(Company).where(Company.ticker == ticker.upper()))
    company = comp_result.scalars().first()
    company_id = company.id if company else 0

    final_values = result_state.get("cross_verified_data", {})
    calc_results = result_state.get("calculation_results", {})
    bus_result = result_state.get("business_intelligence", {})
    
    # --- ADMIN REVIEW SAFEGUARD ---
    if company:
        current_status = company.current_status or "Unknown"
        
        # Calculate new potential status
        new_status = "Unknown"
        financial_pass = calc_results.get("overall_financial_pass")
        bus_status = bus_result.get("business_compliance_status")
        
        if financial_pass is False or bus_status == "Non-Compliant":
            new_status = "Non-Compliant"
        elif financial_pass is True and bus_status == "Halal":
            new_status = "Halal"
            
        if new_status != "Unknown" and current_status != "Unknown" and new_status != current_status:
            print(f"[{ticker}] VERDICT CHANGE DETECTED: {current_status} -> {new_status}. Queuing Admin Review instead of saving.")
            
            # Insert into compliance_reviews
            from sqlalchemy import text
            await db.execute(
                text("""
                    INSERT INTO compliance_reviews (company_id, old_status, new_status, reason, status, created_at, updated_at)
                    VALUES (:cid, :old, :new, :reason, 'pending', NOW(), NOW())
                """),
                {
                    "cid": company_id,
                    "old": current_status,
                    "new": new_status,
                    "reason": "Automated pipeline detected a verdict change from recent data extraction."
                }
            )
            await db.commit()
            
            # Send email alert via artisan command
            import subprocess
            import os
            try:
                laravel_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
                subprocess.run(["php", "artisan", "compliance:alert", str(company_id)], cwd=laravel_dir, check=True)
                print(f"ALERT EMAIL SENT TO: sinanismailaidris@gmail.com for {ticker}")
            except Exception as e:
                print(f"Failed to trigger email alert command: {e}")
            
            # Skip saving new financials
            result_state["skip_financials"] = True
            return None
    # ------------------------------
    
    if not result_state.get("skip_financials"):
        extracted_year = result_state.get("raw_pdf_extraction", {}).get("financial_year")
        final_financial_year = extracted_year if extracted_year else financial_year
        
        pub_date_str = result_state.get("raw_pdf_extraction", {}).get("published_date")
        pub_date_obj = None
        if pub_date_str:
            try:
                from dateutil.parser import parse
                pub_date_obj = parse(pub_date_str)
            except Exception:
                pass

        screening = FinancialScreening(
            company_ticker=ticker.upper(),
            financial_year=final_financial_year,
            published_date=pub_date_obj,
            report_quarter=result_state.get("raw_pdf_extraction", {}).get("reporting_period"),
            raw_source_values=sanitize_json(result_state.get("raw_pdf_extraction", {})),
            normalized_values=sanitize_json(result_state.get("normalized_data", {})),
            chosen_values=sanitize_json(final_values),
            confidence_score=result_state.get("confidence_score", 0),
            source_urls=sanitize_json(result_state.get("source_urls", {})),
            calculation_results=sanitize_json(calc_results),
            ai_explanation=result_state.get("ai_explanation", "")
        )
        db.add(screening)
    
    bus_result = result_state.get("business_intelligence", {})
    if bus_result:
        timestamp_str = bus_result.get("last_analysed_timestamp")
        timestamp_obj = None
        if timestamp_str:
            try:
                from dateutil.parser import parse
                timestamp_obj = parse(timestamp_str)
            except Exception:
                pass

        bus_screening = BusinessScreening(
            company_id=company_id,
            ticker=ticker.upper(),
            business_summary=bus_result.get("business_summary"),
            current_core_business=bus_result.get("current_core_business"),
            detected_business_activities=sanitize_json(bus_result.get("detected_business_activities")),
            detected_prohibited_activities=sanitize_json(bus_result.get("detected_prohibited_activities")),
            supporting_evidence=sanitize_json(bus_result.get("supporting_evidence")),
            source_urls=sanitize_json(bus_result.get("source_urls")),
            source_publication_dates=sanitize_json(bus_result.get("source_publication_dates")),
            ai_explanation=bus_result.get("ai_explanation"),
            confidence_score=bus_result.get("confidence_score", 0),
            business_compliance_status=bus_result.get("business_compliance_status"),
            last_analysed_timestamp=timestamp_obj
        )
        db.add(bus_screening)
        
    await db.commit()
    return screening if not result_state.get("skip_financials") else None
