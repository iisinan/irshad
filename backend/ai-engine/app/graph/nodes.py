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
from app.tools.business_intelligence import BusinessIntelligenceAgent
from app.core.database import AsyncSessionLocal
from app.models.companies import Company
from app.models.financial_screening import FinancialScreening
from app.tools.ai_explainer import AIExplainer


# 1. Initialise & 2. Check Cache
async def initialise_and_check_cache(state: GraphState) -> GraphState:
    ticker = state["ticker"]
    financial_year = state.get("financial_year", 2026)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Company).where(Company.ticker == ticker))
        company = result.scalars().first()
        state["company_name"] = company.name if company else ticker
        state["company_id"] = company.id if company else None

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
            print(f"[{ticker}] Cache hit — existing financial data found, skipping PDF pipeline.")
        else:
            state["existing_financial_data"] = None

    return state


# 3. Collect Business Intelligence via Perplexity (web search for financials + news)
async def collect_business_intelligence(state: GraphState) -> GraphState:
    client = PerplexityClient()
    extracted_data = await client.fetch_comprehensive_data(
        state["company_name"], state.get("financial_year", 2026)
    )

    if extracted_data:
        state["business_intelligence"] = extracted_data.get("business_activities", {})
        state["business_news"]         = extracted_data.get("latest_news", [])
        state["perplexity_financials"] = extracted_data.get("financials", {})

        # Run deterministic Python business compliance check on activities from Perplexity
        principal  = state["business_intelligence"].get("principal_activities", "")
        segments   = state["business_intelligence"].get("business_segments", [])
        activities = [principal] + segments if principal else segments

        if activities:
            agent = BusinessIntelligenceAgent()
            bi_result = await agent.run_business_screening(
                ticker           = state["ticker"],
                company_name     = state["company_name"],
                principal_activities = principal,
                business_segments    = segments,
            )
            # Merge deterministic verdict back into business_intelligence
            state["business_intelligence"].update({
                "business_compliance_status":   bi_result.get("business_compliance_status", "Halal"),
                "detected_prohibited_activities": bi_result.get("detected_prohibited_activities", []),
                "ai_explanation":               bi_result.get("ai_explanation", ""),
            })

        # Short-circuit: if Python rule engine flagged haram, skip financials entirely
        if state["business_intelligence"].get("business_compliance_status") == "Non-Compliant":
            state["skip_financials"] = True
            print(f"[{state['ticker']}] Business screen FAILED — skipping financial pipeline.")

    return state


# 4. Search Financial Statements
async def search_financial_statements(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state

    scraper = FinancialScraper()
    results = await scraper.search_latest_financial_report_pdfs(
        state["ticker"], state["company_name"], state.get("financial_year", 2026)
    )
    state["search_results"]    = results
    state["annual_report_url"] = results.get("official") or results.get("ngx") or results.get("african_financials")

    if state["annual_report_url"]:
        if "source_urls" not in state:
            state["source_urls"] = {}
        state["source_urls"]["annual_report"] = state["annual_report_url"]

    return state


# 5 & 6. Verify & Download PDF  —  Lazy waterfall: HTTP → ScraperAPI → (Apify reserved)
async def download_pdf(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("annual_report_url"):
        return state

    url = state["annual_report_url"]

    async def save_bytes(content: bytes) -> str:
        fd, path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, "wb") as f:
            f.write(content)
        return path

    import hashlib

    try:
        # ATTEMPT 1: Plain HTTP (free, ~60% success for static PDFs)
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200 and b"%PDF" in resp.content[:1024]:
                state["pdf_path"]    = await save_bytes(resp.content)
                state["sha256_hash"] = hashlib.sha256(resp.content).hexdigest()
                print(f"[{state['ticker']}] PDF downloaded via plain HTTP.")
                return state

        # ATTEMPT 2: ScraperAPI rotating proxy (cheap, ~95% success incl. Cloudflare)
        scraper_api_key = os.getenv("SCRAPERAPI_KEY")
        if scraper_api_key:
            print(f"[{state['ticker']}] Plain HTTP failed — trying ScraperAPI proxy...")
            proxy_url = f"http://scraperapi:{scraper_api_key}@proxy-server.scraperapi.com:8001"
            # httpx ≥ 0.23 uses mounts, not proxies kwarg
            transport = httpx.AsyncHTTPTransport(proxy=proxy_url)
            async with httpx.AsyncClient(transport=transport, timeout=60.0, verify=False, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and b"%PDF" in resp.content[:1024]:
                    state["pdf_path"]    = await save_bytes(resp.content)
                    state["sha256_hash"] = hashlib.sha256(resp.content).hexdigest()
                    print(f"[{state['ticker']}] PDF downloaded via ScraperAPI.")
                    return state

        # ATTEMPT 3: Apify Puppeteer headless browser (expensive — reserved for JS-heavy pages)
        # NGX portal pages are already scraped via FinancialScraper which uses Apify directly,
        # so by the time we reach download_pdf the URL is a direct PDF link.
        # If neither attempt worked the link itself is broken; mark and continue gracefully.
        print(f"[{state['ticker']}] All PDF download attempts failed. Continuing with Perplexity fallback data.")
        state["error"] = "PDF download failed (HTTP → ScraperAPI). Will use Perplexity financial data."

    except Exception as e:
        state["error"] = f"PDF download exception: {str(e)}"

    return state


# 7. Store PDF in Cloudflare R2
async def store_pdf(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("pdf_path"):
        return state

    r2 = CloudflareR2Client()
    object_name = f"reports/{state['ticker']}_{state.get('financial_year', 2026)}.pdf"
    url = r2.upload_file(state["pdf_path"], object_name)
    if url:
        state["r2_storage_url"] = url
    return state


# 8. Extract Financial Data from PDF via Gemini
async def extract_financial_data(state: GraphState) -> GraphState:
    if state.get("skip_financials") or not state.get("pdf_path"):
        return state

    import fitz  # PyMuPDF
    try:
        doc  = fitz.open(state["pdf_path"])
        text = ""
        for i in range(min(50, len(doc))):
            text += doc[i].get_text()

        gemini = GeminiClient()
        data   = await gemini.extract_financial_data(text, state["company_name"], state.get("financial_year", 2026))

        ngx_date = state.get("search_results", {}).get("ngx_date")
        if ngx_date:
            data = data or {}
            data["published_date"] = ngx_date

        state["raw_pdf_extraction"] = data or {}
        state["is_extraction_valid"] = bool(data)
    except Exception as e:
        state["error"]             = f"Gemini extraction error: {str(e)}"
        state["is_extraction_valid"] = False

    return state


# 10. Cross Verify
async def cross_verify_data(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state

    verifier = CrossVerifier()
    new_data  = state.get("raw_pdf_extraction", {})
    old_data  = state.get("existing_financial_data", {})

    if not new_data and state.get("perplexity_financials"):
        print(f"[{state['ticker']}] PDF extraction empty — falling back to Perplexity financials.")
        new_data = state["perplexity_financials"]

    state["cross_verified_data"] = verifier.merge_financials(old_data, new_data)
    return state


# 11. Collect Market Data
async def collect_market_data(state: GraphState) -> GraphState:
    ticker     = state["ticker"]
    market_cap = 0.0

    try:
        async with AsyncSessionLocal() as db:
            result  = await db.execute(select(Company).where(Company.ticker == ticker))
            company = result.scalars().first()
            if company and hasattr(company, "market_cap") and company.market_cap:
                market_cap = float(company.market_cap)
    except Exception as e:
        print(f"[{ticker}] Market cap DB query failed: {str(e)}")

    # Fallback: Perplexity market cap (current, not from old PDF)
    if market_cap == 0 and state.get("perplexity_financials"):
        mc_data    = state["perplexity_financials"].get("market_cap", {})
        market_cap = float(mc_data.get("value", 0) if isinstance(mc_data, dict) else (mc_data or 0))

    state["market_data"] = {"market_cap": market_cap}
    return state


# 13 & 14. Normalise & Currency
async def normalise_financials(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state

    raw = state.get("cross_verified_data", {})
    state["normalized_data"]            = Normalizer.normalize(raw)
    state["currency_conversion_applied"] = True
    return state


# 15. Calculate AAOIFI Ratios (pure deterministic Python)
async def calculate_aaoifi(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state

    normalized   = state.get("normalized_data", {})
    is_bank      = state.get("business_intelligence", {}).get("is_bank_or_financial", False)
    market_cap   = state.get("market_data", {}).get("market_cap", 0)

    calc = AAOIFICalculator.calculate(normalized, market_cap, "bank" if is_bank else "standard")
    state["calculation_results"] = calc
    return state


# 17. Generate Human-Readable Explanation
async def generate_explanation(state: GraphState) -> GraphState:
    if state.get("skip_financials"):
        return state

    calc = state.get("calculation_results", {})
    explainer = AIExplainer()
    state["ai_explanation"] = explainer.generate_explanation(state["company_name"], calc)
    return state
