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
    financial_year: int = 2025

@router.get("/health")
async def health_check():
    return {"status": "ok"}

@router.post("/api/screen-company/{ticker}")
async def screen_company(ticker: str, financial_year: int = 2025, db: AsyncSession = Depends(get_db)):
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
        "business_intelligence": {},
        "perplexity_financials": {},
        "business_news": [],
        "cross_verified_data": {},
        "normalized_data": {},
        "source_urls": {},
        "calculation_results": {},
        "ai_explanation": None,
        "skip_financials": False,
        "error": None
    }
    
    try:
        # Execute the LangGraph Workflow
        result_state = await graph_app.ainvoke(initial_state)
        
        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])

        # Determine if we need to fallback to 2025
        final_values = result_state.get("cross_verified_data", {})
        bus_result = result_state.get("business_intelligence", {})
        business_failed = bus_result and bus_result.get("business_compliance_status") == "Non-Compliant"

        # Did it fail to find financials, but the business isn't non-compliant?
        if not final_values and not business_failed:
            if initial_state["financial_year"] == 2026:
                print(f"Fallback to 2025 triggered for {ticker}")
                initial_state["financial_year"] = 2025
                result_state = await graph_app.ainvoke(initial_state)

                if result_state.get("error"):
                    raise HTTPException(status_code=500, detail=result_state["error"])

                final_values    = result_state.get("cross_verified_data", {})
                bus_result      = result_state.get("business_intelligence", {})
                business_failed = bus_result and bus_result.get("business_compliance_status") == "Non-Compliant"
            
        # Extract results
        calc_results = result_state.get("calculation_results", {})
        
        # Save to DB
        from app.core.db_saver import save_graph_result_to_db
        screening = await save_graph_result_to_db(db, ticker, financial_year, result_state)
        
        if screening:
            await db.refresh(screening)
        
        # If no report was found, we should notify the queue worker
        if not final_values and not business_failed:
            return {"error": "File Not Found", "detail": "No annual report could be located.", "retry": False}

        # Extract ratios safely in case the LLM hallucinates a string instead of a dictionary
        raw_ratios = calc_results.get("ratios", {})
        if not isinstance(raw_ratios, dict):
            raw_ratios = {}

        # Merge sources
        sources = result_state.get("source_urls", {})
        if bus_result and bus_result.get("source_urls"):
            sources["business_news"] = bus_result.get("source_urls")

        # Format exact JSON structure requested
        business_screen = bus_result.get("business_compliance_status", "Halal") if bus_result else "Halal"
        response_data = {
            "company": result_state.get("company_name", ticker),
            "ticker": ticker.upper(),
            "financial_year": financial_year,
            "sources": sources,
            "financials": final_values,
            "aaoifi": {
                "business_activity": business_screen,
                "detected_prohibited_activities": bus_result.get("detected_prohibited_activities", []) if bus_result else [],
                "interest_debt_ratio": raw_ratios.get("interest_bearing_debt_ratio", 0),
                "interest_income_ratio": raw_ratios.get("non_permissible_income_ratio", 0),
                "cash_ratio": raw_ratios.get("cash_and_equivalents_ratio", 0),
                "overall": "SHARIAH COMPLIANT" if calc_results.get("overall_financial_pass") and business_screen != "Non-Compliant" else "NON COMPLIANT"
            },
            "explanation": result_state.get("ai_explanation", "")
        }
        return sanitize_json(response_data)
        
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
    current_year = 2026
    
    # We use a background task so the API responds immediately to Laravel
    processor = BulkProcessor()
    background_tasks.add_task(processor.process_all_tickers, financial_year=current_year)
    
    return {
        "status": "success", 
        "message": f"Daily NGX scan initiated for {current_year}."
    }
