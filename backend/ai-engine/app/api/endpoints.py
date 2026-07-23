from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.financial_screening import FinancialScreening
from app.graph.builder import build_graph

router = APIRouter()
graph_app = build_graph()

class ScreenRequest(BaseModel):
    ticker: str
    financial_year: int = 2024

@router.get("/health")
async def health_check():
    return {"status": "ok"}

@router.post("/api/screen-company/{ticker}")
async def screen_company(ticker: str, financial_year: int = 2024, db: AsyncSession = Depends(get_db)):
    """
    Triggers the LangGraph AI workflow to collect, validate, and screen a single company.
    Called by Laravel Queue Worker.
    """
    initial_state = {
        "ticker": ticker.upper(),
        "financial_year": financial_year,
        "company_name": None,
        "search_results": {},
        "annual_report_url": None,
        "pdf_path": None,
        "raw_pdf_extraction": {},
        "secondary_sources_data": {},
        "normalized_data": {},
        "final_chosen_values": {},
        "confidence_score": 0.0,
        "source_urls": {},
        "calculation_results": {},
        "ai_explanation": None,
        "error": None
    }
    
    try:
        # Execute the LangGraph Workflow
        result_state = await graph_app.ainvoke(initial_state)
        
        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])
            
        # Extract results
        final_values = result_state.get("final_chosen_values", {})
        calc_results = result_state.get("calculation_results", {})
        
        # Save to DB
        from app.models.business_screening import BusinessScreening
        from app.models.companies import Company
        from datetime import datetime

        # Get company_id
        comp_result = await db.execute(select(Company).where(Company.ticker == ticker.upper()))
        company = comp_result.scalars().first()
        company_id = company.id if company else 0

        if not result_state.get("skip_financials"):
            extracted_year = result_state.get("raw_pdf_extraction", {}).get("financial_year")
            final_financial_year = extracted_year if extracted_year else financial_year
            
            screening = FinancialScreening(
                company_ticker=ticker.upper(),
                financial_year=final_financial_year,
                published_date=result_state.get("raw_pdf_extraction", {}).get("published_date"),
                report_quarter=result_state.get("raw_pdf_extraction", {}).get("reporting_period"),
                raw_source_values=result_state.get("secondary_sources_data", {}),
                normalized_values=result_state.get("normalized_data", {}),
                chosen_values=final_values,
                confidence_score=result_state.get("confidence_score", 0.0),
                source_urls=result_state.get("source_urls", {}),
                calculation_results=calc_results,
                ai_explanation=result_state.get("ai_explanation", "")
            )
            db.add(screening)
        
        bus_result = result_state.get("business_screening_result", {})
        if bus_result:
            bus_screening = BusinessScreening(
                company_id=company_id,
                ticker=ticker.upper(),
                business_summary=bus_result.get("business_summary"),
                current_core_business=bus_result.get("current_core_business"),
                detected_business_activities=bus_result.get("detected_business_activities"),
                detected_prohibited_activities=bus_result.get("detected_prohibited_activities"),
                supporting_evidence=bus_result.get("supporting_evidence"),
                source_urls=bus_result.get("source_urls"),
                source_publication_dates=bus_result.get("source_publication_dates"),
                ai_explanation=bus_result.get("ai_explanation"),
                confidence_score=bus_result.get("confidence_score", 0.0),
                business_compliance_status=bus_result.get("business_compliance_status"),
                last_analysed_timestamp=bus_result.get("last_analysed_timestamp")
            )
            db.add(bus_screening)

        await db.commit()
        if not result_state.get("skip_financials"):
            await db.refresh(screening)
        
        # Format exact JSON structure requested
        return {
            "company": result_state.get("company_name", ticker),
            "ticker": ticker.upper(),
            "financial_year": financial_year,
            "confidence": result_state.get("confidence_score", 0.0),
            "sources": result_state.get("source_urls", {}),
            "financials": final_values,
            "aaoifi": {
                "business_activity": bus_result.get("business_compliance_status", "PASS") if bus_result else "PASS", 
                "interest_debt_ratio": calc_results.get("ratios", {}).get("interest_bearing_debt_ratio", 0),
                "interest_income_ratio": calc_results.get("ratios", {}).get("non_permissible_income_ratio", 0),
                "cash_ratio": calc_results.get("ratios", {}).get("cash_and_equivalents_ratio", 0),
                "overall": "SHARIAH COMPLIANT" if calc_results.get("overall_financial_pass") else "NON COMPLIANT"
            },
            "explanation": result_state.get("ai_explanation", "")
        }
        
    except FileNotFoundError as e:
        # Return 200 so Laravel does not retry infinitely for missing files
        return {"error": "File Not Found", "detail": str(e), "retry": False}
    except Exception as e:
        # 500 triggers Laravel to retry the job (e.g., for API rate limits)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/company/{ticker}")
async def get_company_screening(ticker: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FinancialScreening)
        .where(FinancialScreening.company_ticker == ticker.upper())
        .order_by(FinancialScreening.created_at.desc())
        .limit(1)
    )
    screening = result.scalars().first()
    if not screening:
        raise HTTPException(status_code=404, detail="Company not found")
    return screening

from app.core.bulk_processor import BulkProcessor
from datetime import datetime

from app.tools.market_data_updater import MarketDataUpdater

@router.post("/api/update-market-data/{ticker}")
async def update_market_data(ticker: str):
    """
    Fetches latest market data from NGXPulse/Yahoo and returns it.
    The Laravel Job will actually save this to the DB, or Python can save it.
    Since we don't have the MarketData sqlalchemy model yet, we just return it and let Laravel handle it, 
    or we should write the SQLAlchemy model and save it here.
    Wait, Laravel's job expects a successful response. Let's just create the DB logic here.
    """
    updater = MarketDataUpdater()
    data = await updater.fetch_market_data(ticker)
    if not data:
        raise HTTPException(status_code=404, detail="Market data not found")
        
    # We will let Laravel save it directly by returning the data.
    # The Laravel Job currently just checks if response failed().
    # Let's return it so Laravel can process it.
    return data

@router.post("/cron/daily-ngx-scan")
async def daily_ngx_scan(background_tasks: BackgroundTasks):
    """
    Triggered by Laravel Task Scheduler every midnight.
    Kicks off a background job to scan all NGX companies for new filings.
    """
    current_year = datetime.now().year
    
    # We use a background task so the API responds immediately to Laravel
    processor = BulkProcessor()
    background_tasks.add_task(processor.process_all_tickers, financial_year=current_year)
    
    return {
        "status": "success", 
        "message": f"Daily NGX scan initiated for {current_year}."
    }
