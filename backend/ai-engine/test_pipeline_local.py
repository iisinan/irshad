import asyncio
from app.graph.builder import build_graph

async def main():
    graph_app = build_graph()
    initial_state = {
        "ticker": "NASCON",
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
    except Exception as e:
        print("Exception caught:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
