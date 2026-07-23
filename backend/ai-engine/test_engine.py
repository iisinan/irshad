import asyncio
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# The Laravel .env uses DB_URL
if os.getenv("DB_URL"):
    os.environ["DATABASE_URL"] = os.getenv("DB_URL")

from app.graph.builder import build_graph
from app.graph.state import GraphState

async def main():
    app = build_graph()
    print("--- Running AI Extraction Pipeline for DANGCEM ---")
    initial_state = GraphState(
        ticker="DANGCEM",
        company_name="Dangote Cement Plc",
        financial_year=2026,
    )
    
    async for event in app.astream(initial_state):
        for node_name, node_state in event.items():
            print(f"Completed Node: {node_name}")
            if "raw_pdf_extraction" in node_state:
                print("\n[Raw Gemini Extraction]")
                for k, v in node_state["raw_pdf_extraction"].items():
                    print(f"  {k}: {v}")
            if "final_chosen_values" in node_state:
                print("\n[Normalized Values (Absolute NGN)]")
                for k, v in node_state["final_chosen_values"].items():
                    print(f"  {k}: {v}")
            if "secondary_source_data" in node_state:
                print("\n[Secondary API Validation Data]")
                for src, data in node_state["secondary_source_data"].items():
                    print(f"  --- {src.upper()} ---")
                    # Just print a summary if it's too long
                    print(f"  Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            if "calculation_results" in node_state:
                print("\n[AAOIFI Results]")
                for k, v in node_state["calculation_results"].items():
                    print(f"  {k}: {v}")

if __name__ == "__main__":
    asyncio.run(main())
