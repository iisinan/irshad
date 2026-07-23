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

@router.post("/screen")
async def trigger_screening(request: ScreenRequest, db: AsyncSession = Depends(get_db)):
    """
    Triggers the LangGraph AI workflow to collect, validate, and screen a company.
    In a real MVP this might be run as a background task, but for the API interface
    we run it synchronously or return a job ID.
    """
    initial_state = {
        "ticker": request.ticker.upper(),
        "financial_year": request.financial_year,
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
        screening = FinancialScreening(
            company_ticker=request.ticker.upper(),
            financial_year=request.financial_year,
            published_date=result_state.get("raw_pdf_extraction", {}).get("published_date"),
            report_quarter=result_state.get("raw_pdf_extraction", {}).get("report_quarter"),
            raw_source_values=result_state.get("secondary_sources_data", {}),
            normalized_values=result_state.get("normalized_data", {}),
            chosen_values=final_values,
            confidence_score=result_state.get("confidence_score", 0.0),
            source_urls=result_state.get("source_urls", {}),
            calculation_results=calc_results,
            ai_explanation=result_state.get("ai_explanation", "")
        )
        db.add(screening)
        await db.commit()
        await db.refresh(screening)
        
        # Format exact JSON structure requested
        return {
            "company": result_state.get("company_name", request.ticker),
            "ticker": request.ticker.upper(),
            "financial_year": request.financial_year,
            "confidence": result_state.get("confidence_score", 0.0),
            "sources": result_state.get("source_urls", {}),
            "financials": final_values,
            "aaoifi": {
                "business_activity": "PASS", # Placeholder for business rules
                "interest_debt_ratio": calc_results.get("ratios", {}).get("interest_bearing_debt_ratio", 0),
                "interest_income_ratio": calc_results.get("ratios", {}).get("non_permissible_income_ratio", 0),
                "cash_ratio": calc_results.get("ratios", {}).get("cash_and_equivalents_ratio", 0),
                "overall": "SHARIAH COMPLIANT" if calc_results.get("overall_financial_pass") else "NON COMPLIANT"
            },
            "explanation": result_state.get("ai_explanation", "")
        }
        
    except Exception as e:
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
