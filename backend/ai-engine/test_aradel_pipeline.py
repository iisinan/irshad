import asyncio
import os
import json
from dotenv import load_dotenv
from app.graph.builder import build_graph

# Make sure we load the env file from the backend folder to get the GEMINI_API_KEY
load_dotenv("../backend/.env")

async def main():
    print("Building LangGraph...")
    app = build_graph()
    
    pdf_path = "../backend/storage/app/Aradel-2025-Annual-Report.pdf"
    if not os.path.exists(pdf_path):
        print(f"ERROR: Could not find PDF at {pdf_path}")
        return

    print("Initializing state...")
    initial_state = {
        "ticker": "ARADEL",
        "financial_year": 2024,
        "company_name": "Aradel Holdings Plc",
        "search_results": {},
        "annual_report_url": "local_file",
        "pdf_path": pdf_path,
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
    
    print("Running LangGraph workflow...")
    # Ainvoke runs the async graph
    try:
        final_state = await app.ainvoke(initial_state)
        
        print("\n==================================================")
        print("WORKFLOW COMPLETED SUCCESSFULLY!")
        print("==================================================")
        
        print("\n--- Raw LLM Extraction from Gemini 1.5 Pro ---")
        print(json.dumps(final_state.get("raw_pdf_extraction"), indent=2))
        
        print("\n--- Deterministic Normalized Values ---")
        print(json.dumps(final_state.get("final_chosen_values"), indent=2))
        
        print("\n--- Deterministic AAOIFI Results ---")
        print(json.dumps(final_state.get("calculation_results"), indent=2))
        
        print("==================================================")
    except Exception as e:
        print(f"\nERROR: Workflow failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
