import asyncio
from app.graph.builder import build_graph
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.companies import Company

async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def main():
    await setup_test_db()
    graph_app = build_graph()
    initial_state = {
        "ticker": "INTBREW",
        "financial_year": 2026,
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
        print("Invoking graph for NASCON...")
        result_state = await graph_app.ainvoke(initial_state)
        print("Done!")
        if "error" in result_state and result_state["error"]:
            print("Graph returned error:", result_state["error"])
        else:
            print("Success!")
            print("Chosen Values:", result_state.get("final_chosen_values", {}))
            print("Source URLs:", result_state.get("source_urls", {}))
    except Exception as e:
        print("Exception caught:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
