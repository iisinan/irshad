import sys
import asyncio
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

from app.graph.builder import build_graph

async def main():
    ticker = sys.argv[1] if len(sys.argv) > 1 else "DANGCEM"
    print(f"Testing LangGraph Execution for {ticker} (FY 2026)")
    
    graph_app = build_graph()
    
    initial_state = {
        "ticker": ticker,
        "financial_year": 2026,
        "company_name": None,
        "search_results": {},
        "annual_report_url": None,
        "pdf_path": None,
        "raw_pdf_extraction": {},
        "business_intelligence": {},
        "cross_verified_data": {},
        "normalized_data": {},
        "confidence_score": 0,
        "confidence_breakdown": {},
        "source_urls": {},
        "calculation_results": {},
        "ai_explanation": None,
        "skip_financials": False,
        "error": None
    }
    
    result = await graph_app.ainvoke(initial_state)
    
    print("\n--- Final LangGraph Output ---")
    print(f"Company: {result.get('company_name')}")
    print(f"Final Financials: {result.get('cross_verified_data')}")
    print(f"Business Compliance: {result.get('business_intelligence', {}).get('verdict')}")
    print(f"AAOIFI Ratios: {result.get('calculation_results')}")
    if result.get('error'):
        print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(main())
