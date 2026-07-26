import asyncio
from app.graph.state import GraphState
from app.graph.builder import build_graph
from app.core.database import AsyncSessionLocal
from app.core.db_saver import save_graph_result_to_db
import traceback

graph_app = build_graph()

async def main():
    failed = ['BERGER']
    financial_year = 2026
    
    for ticker in failed:
        print(f"Retrying ticker {ticker}...")
        initial_state = GraphState(ticker=ticker, financial_year=financial_year)
        
        try:
            res = await graph_app.ainvoke(initial_state)
            async with AsyncSessionLocal() as db:
                await save_graph_result_to_db(db, ticker, financial_year, res)
            print(f"Successfully saved {ticker} to database.")
        except Exception as e:
            print(f"Error processing/saving {ticker}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
