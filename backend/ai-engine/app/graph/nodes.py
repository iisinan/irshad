import os
import httpx
import tempfile
from sqlalchemy.future import select
from app.graph.state import GraphState
from app.tools.apify_client import FinancialScraper
from app.tools.perplexity_client import PerplexityClient
from app.tools.gemini_client import GeminiClient
from app.tools.storage_r2 import CloudflareR2Client
from app.core.cross_verifier import CrossVerifier
from app.tools.normalizer import Normalizer
from app.tools.aaoifi_calculator import AAOIFICalculator
from app.core.database import AsyncSessionLocal
from app.models.companies import Company
from app.models.financial_screening import FinancialScreening
from app.tools.ai_explainer import AIExplainer

# 1. Initialise & 2. Check Cache
async def initialise_and_check_cache(state: GraphState) -> GraphState:
    ticker = state["ticker"]
    financial_year = state.get("financial_year", 2026)
    
    async with AsyncSessionLocal() as db:
        # Get Company
        result = await db.execute(select(Company).where(Company.ticker == ticker))
        company = result.scalars().first()
        state["company_name"] = company.name if company else ticker
        state["company_id"] = company.id if company else None
        
        # Check Cache for the given financial year
        result_fin = await db.execute(
            select(FinancialScreening)
            .where(FinancialScreening.company_ticker == ticker, FinancialScreening.financial_year == financial_year)
            .order_by(FinancialScreening.id.desc())
            .limit(1)
        )
        recent_fin = result_fin.scalars().first()
        if recent_fin and recent_fin.chosen_values:
            state["existing_financial_data"] = recent_fin.chosen_values
            state["skip_financials"] = True
            print(f"[{ticker}] Found existing financial data, skipping financials.")
        else:
            state["existing_financial_data"] = None
            
    return state

# 3. Collect Business Intelligence & 12. Business News (Combined for efficiency using Perplexity)
async def collect_business_intelligence(state: GraphState) -> GraphState:
    client = PerplexityClient()
    # We will adjust the perplexity client later to only return business info/news
    extracted_data = await client.fetch_comprehensive_data(
        state["company_name"], state.get("financial_year", 2026)
    )
    if extracted_data:
        state["business_intelligence"] = extracted_data.get("business_activities", {})
        state["business_news"] = extracted_data.get("latest_news", [])
        state["perplexity_financials"] = extracted_data.get("financials", {})
        
        if state["business_intelligence"].get("verdict") == "Non-Compliant":
            state["skip_financials"] = True
    return state

# 4. Search Financial Statements
async def search_financial_statements(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state
        
    scraper = FinancialScraper()
    results = await scraper.search_latest_financial_report_pdfs(state["ticker"], state["company_name"], state.get("financial_year", 2026))
    state["search_results"] = results
    state["annual_report_url"] = results.get("official") or results.get("ngx") or results.get("african_financials")
    
    if state["annual_report_url"]:
        if "source_urls" not in state:
            state["source_urls"] = {}
        state["source_urls"]["annual_report"] = state["annual_report_url"]
    
    return state

# 5 & 6. Verify & Download PDF
async def download_pdf(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("annual_report_url"):
        return state
        
    url = state["annual_report_url"]
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url, follow_redirects=True)
            if resp.status_code == 200:
                fd, path = tempfile.mkstemp(suffix=".pdf")
                with os.fdopen(fd, 'wb') as f:
                    f.write(resp.content)
                state["pdf_path"] = path
                import hashlib
                state["sha256_hash"] = hashlib.sha256(resp.content).hexdigest()
    except Exception as e:
        state["error"] = f"Failed to download PDF: {str(e)}"
    return state

# 7. Store PDF
async def store_pdf(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("pdf_path"):
        return state
        
    r2 = CloudflareR2Client()
    object_name = f"reports/{state['ticker']}_{state.get('financial_year', 2026)}.pdf"
    url = r2.upload_file(state["pdf_path"], object_name)
    if url:
        state["r2_storage_url"] = url
    return state

# 8. Extract Financial Data
async def extract_financial_data(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("pdf_path"):
        return state
        
    import fitz # PyMuPDF
    try:
        doc = fitz.open(state["pdf_path"])
        # Extract first 50 pages (where financials usually are) to save tokens
        text = ""
        for i in range(min(50, len(doc))):
            text += doc[i].get_text()
            
        gemini = GeminiClient()
        data = await gemini.extract_financial_data(text, state["company_name"], state.get("financial_year", 2026))
        
        # Inject the parsed NGX uploaded date if available
        ngx_date = state.get("search_results", {}).get("ngx_date")
        if ngx_date:
            if not data:
                data = {}
            data["published_date"] = ngx_date

        state["raw_pdf_extraction"] = data
        state["is_extraction_valid"] = True if data else False
    except Exception as e:
        state["error"] = f"Gemini Extraction error: {str(e)}"
        state["is_extraction_valid"] = False
        
    return state

# 10. Cross Verify
async def cross_verify_data(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state
        
    verifier = CrossVerifier()
    new_data = state.get("raw_pdf_extraction", {})
    old_data = state.get("existing_financial_data", {})
    
    # Fallback to perplexity financials if PDF extraction was empty/failed
    if not new_data and state.get("perplexity_financials"):
        print(f"Fallback to Perplexity financials for {state['ticker']}")
        new_data = state["perplexity_financials"]
        
    merged = verifier.merge_financials(old_data, new_data)
    state["cross_verified_data"] = merged
    
    return state

# 11. Collect Market Data
async def collect_market_data(state: GraphState) -> GraphState:
    ticker = state["ticker"]
    market_cap = 0.0
    
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Company).where(Company.ticker == ticker))
            company = result.scalars().first()
            if company and hasattr(company, 'market_cap') and company.market_cap:
                market_cap = float(company.market_cap)
    except Exception as e:
        print(f"Failed to query market cap from DB for {ticker}: {str(e)}")
        
    # Fallback to perplexity market cap if DB is 0
    if market_cap == 0 and state.get("perplexity_financials"):
        mc_data = state["perplexity_financials"].get("market_cap", {})
        if isinstance(mc_data, dict):
            market_cap = float(mc_data.get("value", 0) or 0)
        else:
            market_cap = float(mc_data or 0)
            
    state["market_data"] = {"market_cap": market_cap} 
    return state

# 13 & 14. Normalise & Currency
async def normalise_financials(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state
        
    raw = state.get("cross_verified_data", {})
    state["normalized_data"] = Normalizer.normalize(raw)
    state["currency_conversion_applied"] = True # It handles inside Normalizer
    return state

# 15. Calculate AAOIFI
async def calculate_aaoifi(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state
        
    normalized = state.get("normalized_data", {})
    is_bank = state.get("business_intelligence", {}).get("is_bank_or_financial", False)
    market_cap = state.get("market_data", {}).get("market_cap", 0)
    
    calc = AAOIFICalculator.calculate(normalized, market_cap, "bank" if is_bank else "standard")
    state["calculation_results"] = calc
    return state

# 17. Generate Explanation
async def generate_explanation(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state
        
    calc = state.get("calculation_results", {})
    explainer = AIExplainer()
    state["ai_explanation"] = explainer.generate_explanation(state["company_name"], calc)
    return state

# 18. Confidence Scoring
async def confidence_scoring(state: GraphState) -> GraphState:
    # Mock confidence for now
    state["confidence_score"] = 90
    state["confidence_breakdown"] = {"source": 90, "ai": 90, "cross_verify": 90}
    return state
