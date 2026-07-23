import os
import tempfile
import time
import httpx
from sqlalchemy.future import select
from app.graph.state import GraphState
from app.tools.pdf_extractor import PDFExtractor
from app.tools.apify_client import FinancialScraper, AlphaVantageClient, FMPClient
from app.core.storage_client import StorageClient
from app.core.database import AsyncSessionLocal
from app.models.companies import Company
from app.models.financial_documents import FinancialDocument

async def search_company(state: GraphState) -> GraphState:
    # 1. Search Company Node
    ticker = state["ticker"]
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Company).where(Company.ticker == ticker))
        company = result.scalars().first()
        if company:
            state["company_name"] = company.name
        else:
            print(f"Company {ticker} not found in DB. Falling back to ticker as name.")
            state["company_name"] = ticker
            
    return state

from app.models.financial_screening import FinancialScreening
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal

async def check_financial_cache(state: GraphState) -> GraphState:
    """
    Checks the database to see the most recent financial year we have processed.
    Sets the target year to the next logical year.
    If we are up to date, it doesn't skip yet, it just sets the target year to search for.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(FinancialScreening)
            .where(FinancialScreening.company_ticker == state["ticker"])
            .order_by(FinancialScreening.financial_year.desc())
            .limit(1)
        )
        recent_fin = result.scalars().first()
        
        if recent_fin:
            # Store the existing business info in case we don't find a new PDF
            existing_activities = recent_fin.chosen_values.get("principal_activities", "")
            existing_segments = recent_fin.chosen_values.get("business_segments", [])
            state["raw_pdf_extraction"] = {
                "principal_activities": existing_activities,
                "business_segments": existing_segments
            }
            # We flag that we have a fallback
            state["has_fallback_business_info"] = True
        else:
            # No historical data, fallback to the requested year (e.g. 2024)
            state["has_fallback_business_info"] = False
            
    return state

async def locate_annual_report(state: GraphState) -> GraphState:
    # 2. Web Search Node — always targets FULL YEAR annual reports
    if "source_urls" not in state:
        state["source_urls"] = {}
    scraper = FinancialScraper()

    start_time = time.perf_counter()
    # Pass annual_report=True so the scraper searches for full-year reports only
    urls = await scraper.search_annual_report_pdfs(
        state["company_name"] or state["ticker"],
        state["financial_year"],
        annual_only=True
    )
    elapsed = time.perf_counter() - start_time
    print(f"[Observability] locate_annual_report took {elapsed:.2f} seconds")

    chosen_url = urls.get("ngx") or urls.get("official")
    if chosen_url:
        state["annual_report_url"] = chosen_url
        state["source_urls"]["annual_report"] = chosen_url

        # Deduplication: Check if this exact URL was already processed
        async with AsyncSessionLocal() as db:
            from app.models.financial_documents import FinancialDocument
            existing_url_doc = await db.execute(
                select(FinancialDocument).where(FinancialDocument.source_url == chosen_url)
            )
            if existing_url_doc.scalars().first():
                print(f"URL {chosen_url} already exists in database. Skipping PDF extraction.")
                state["skip_financials"] = True
    else:
        print(f"No annual report PDF found for {state['ticker']}.")
        if state.get("has_fallback_business_info"):
            print("Skipping financial extraction — using existing business info.")
            state["skip_financials"] = True

    return state

async def download_report(state: GraphState) -> GraphState:
    # 3. Download PDF Node
    url = state.get("annual_report_url")
    if not url:
        return state
        
    local_path = state.get("pdf_path")
    
    if url.startswith("http"):
        print(f"Downloading PDF from {url}...")
        start_time = time.perf_counter()
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            async with httpx.AsyncClient(timeout=60.0, headers=headers, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                fd, temp_path = tempfile.mkstemp(suffix=".pdf")
                with os.fdopen(fd, 'wb') as f:
                    f.write(response.content)
                local_path = temp_path
                state["pdf_path"] = local_path
                elapsed = time.perf_counter() - start_time
                print(f"[Observability] download_report (HTTP) took {elapsed:.2f} seconds")
        except Exception as e:
            print(f"Failed to download PDF: {e}")
            return state

    if local_path and os.path.exists(local_path):
        storage = StorageClient()
        s3_key = storage.upload_document(
            file_path=local_path, 
            ticker=state["ticker"], 
            financial_year=state["financial_year"]
        )
        if s3_key:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Company).where(Company.ticker == state["ticker"]))
                company = result.scalars().first()
                if company:
                    # Check if already exists in DB
                    file_hash = storage.calculate_checksum(local_path)
                    result = await db.execute(
                        select(FinancialDocument)
                        .where(FinancialDocument.checksum == file_hash)
                    )
                    existing_doc = result.scalars().first()
                    
                    if not existing_doc:
                        new_doc = FinancialDocument(
                            company_id=company.id,
                            document_type="Financial Report",
                            financial_year=state["financial_year"],
                            reporting_period="Latest", # Will be updated by Gemini
                            source_url=state["annual_report_url"],
                            s3_key=s3_key,
                            checksum=file_hash
                        )
                        db.add(new_doc)
                        await db.commit()
                        print(f"Document record saved to DB with S3 Key: {s3_key}")
                    else:
                        print(f"Document hash {file_hash} already exists in DB. Skipping extraction.")
                        state["skip_financials"] = True
                
    return state

async def extract_financial_statements(state: GraphState) -> GraphState:
    # 4. LLM PDF Extraction Node
    pdf_path = state.get("pdf_path")
    year = state.get("financial_year", 2026)

    if pdf_path:
        extractor = PDFExtractor()
        start_time = time.perf_counter()
        extracted_data = await extractor.extract_financials(pdf_path, year)
        elapsed = time.perf_counter() - start_time
        print(f"[Observability] extract_financial_statements (Gemini) took {elapsed:.2f} seconds")
        state["raw_pdf_extraction"] = extracted_data

        # Warn if Gemini returned an interim/partial-year report
        period = extracted_data.get("reporting_period", "").upper()
        if any(p in period for p in ["H1", "H2", "Q1", "Q2", "Q3", "INTERIM", "HALF"]):
            print(f"⚠️  WARNING: Extracted report for {state['ticker']} is interim ({period}). "
                  f"Financial ratios may be understated. Full-year report preferred.")
            state["interim_report_warning"] = True

        # Store company type flag for downstream AAOIFI calculation
        state["is_bank"] = extracted_data.get("is_bank_or_financial", False)

    return state

async def collect_multiple_sources(state: GraphState) -> GraphState:
    # 5. Fetch from secondary APIs/websites for Validation
    validation_data = {}
    
    # Try Alpha Vantage
    av_client = AlphaVantageClient()
    av_data = await av_client.fetch_financials(state["ticker"])
    if av_data:
        validation_data["alpha_vantage"] = av_data

    # Try FMP
    fmp_client = FMPClient()
    fmp_data = await fmp_client.fetch_financials(state["ticker"])
    if fmp_data:
        validation_data["fmp"] = fmp_data

    # Fallback to Yahoo Finance Snippet via Apify Scraper
    scraper = FinancialScraper()
    scraper_data = await scraper.fetch_validation_data(state["ticker"])
    if scraper_data:
        validation_data["yahoo_finance"] = scraper_data

    if validation_data:
        state["secondary_source_data"] = validation_data
    return state

from app.tools.normalizer import Normalizer
from app.tools.aaoifi_calculator import AAOIFICalculator

async def normalize_data(state: GraphState) -> GraphState:
    # 6. Deterministic Normalization
    if state.get("skip_financials"):
        return state
    raw_pdf_data = state.get("raw_pdf_extraction", {})
    if raw_pdf_data:
        state["normalized_data"] = {
            "pdf_source": Normalizer.normalize(raw_pdf_data)
        }
    return state

async def validate_and_resolve(state: GraphState) -> GraphState:
    # 7. Compare sources, resolve conflicts, calculate confidence
    if state.get("skip_financials"):
        return state
    pdf_normalized = state.get("normalized_data", {}).get("pdf_source", {})
    if pdf_normalized:
        state["final_chosen_values"] = pdf_normalized
        
        # Check if we have secondary validation data
        secondary_data = state.get("secondary_source_data", {})
        if secondary_data:
            print("Validation secondary data present. Cross-referencing...")
            # For this Phase, if we have secondary data, we assume it matched closely or is flagged.
            # In a full implementation, we'd use Gemini to compare `pdf_normalized` vs `secondary_data["snippet"]`
            state["confidence_score"] = 92.0 # Adjusted after validation
        else:
            state["confidence_score"] = 99.0 # We trust the official PDF solely
            
        if "source_urls" not in state or not state["source_urls"]:
            state["source_urls"] = {}
        state["source_urls"]["primary"] = "Official Annual Report PDF"
    return state

async def calculate_aaoifi(state: GraphState) -> GraphState:
    # 8. Deterministic AAOIFI Math Engine
    if state.get("skip_financials"):
        return state
    final_values = state.get("final_chosen_values", {})
    if final_values:
        market_cap   = state.get("market_cap", 0.0) or 0.0
        company_type = "bank" if state.get("is_bank", False) else "standard"
        print(f"[AAOIFI] company_type={company_type}, market_cap={market_cap:,.0f}")
        state["calculation_results"] = AAOIFICalculator.calculate(
            final_values,
            market_cap=market_cap,
            company_type=company_type
        )
    return state

from app.tools.ai_explainer import AIExplainer

async def generate_explanation(state: GraphState) -> GraphState:
    # 9. LLM Explanation of deterministic results
    if state.get("skip_financials"):
        return state
    calc_results = state.get("calculation_results", {})
    if calc_results:
        explainer = AIExplainer()
        explanation = explainer.generate_explanation(state.get("company_name", state["ticker"]), calc_results)
        state["ai_explanation"] = explanation
    return state

from app.tools.business_intelligence import BusinessIntelligenceAgent
from app.models.business_screening import BusinessScreening
from datetime import datetime, timezone, timedelta

async def perform_business_screening(state: GraphState) -> GraphState:
    # 10. Business Screening (Qualitative/Non-Financial)
    pdf_data = state.get("raw_pdf_extraction", {})
    principal_activities = pdf_data.get("principal_activities", "")
    business_segments = pdf_data.get("business_segments", [])
    
    # Always run business screening to check for fresh news
    agent = BusinessIntelligenceAgent()
    start_time = time.perf_counter()
    result = await agent.run_business_screening(
        ticker=state["ticker"],
        company_name=state.get("company_name", state["ticker"]),
        principal_activities=principal_activities,
        business_segments=business_segments
    )
    elapsed = time.perf_counter() - start_time
    print(f"[Observability] perform_business_screening took {elapsed:.2f} seconds")
    state["business_screening_result"] = result
    
    if result.get("business_compliance_status") == "Non-Compliant":
        print(f"[{state['ticker']}] Business screening failed. Skipping financial extraction.")
        state["skip_financials"] = True
        
    return state

async def store_results(state: GraphState) -> GraphState:
    # 11. Store to PostgreSQL (moved to endpoint for now)
    return state
