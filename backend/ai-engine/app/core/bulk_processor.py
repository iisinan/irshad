import os
import json
import asyncio
from app.graph.state import GraphState
from app.graph.builder import build_graph

# We need the compiled graph
graph_app = build_graph()

class BulkProcessor:
    def __init__(self):
        # We look for the JSON file containing all NGX companies
        self.tickers_file = os.path.join(os.path.dirname(__file__), "../../../database/data/ngx_companies.json")
    
    async def process_all_tickers(self, financial_year: int = 2026, phase: int = None):
        """
        Iterates over all tickers and triggers the LangGraph pipeline for each.
        If phase is provided (1-5), it processes a specific slice of the tickers.
        """
        if not os.path.exists(self.tickers_file):
            print(f"Tickers file not found at {self.tickers_file}")
            return
            
        with open(self.tickers_file, "r") as f:
            data = json.load(f)
            
        tickers = []
        for company in data:
            if company.get("symbol"):
                tickers.append(company.get("symbol"))
                
        print(f"Found {len(tickers)} tickers total.")
        
        if phase is not None:
            chunk_size = 30
            start_idx = (phase - 1) * chunk_size
            end_idx = start_idx + chunk_size
            tickers = tickers[start_idx:end_idx]
            print(f"Running Phase {phase}: processing {len(tickers)} tickers from index {start_idx} to {end_idx}.")
        
        # Reduce batch size from 5 to 1 to prevent Out-Of-Memory (OOM) errors on small cloud instances (like Render)
        batch_size = 1
        for i in range(0, len(tickers), batch_size):
            batch = tickers[i:i+batch_size]
            tasks = []
            for ticker in batch:
                if not ticker: continue
                # Trigger the graph
                initial_state = GraphState(
                    ticker=ticker,
                    financial_year=financial_year
                )
                tasks.append(graph_app.ainvoke(initial_state))
                
            print(f"Processing batch {i//batch_size + 1} ({batch})...")
            # We use gather with return_exceptions to prevent one failure from stopping the whole batch
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Save results to DB
            from app.core.database import AsyncSessionLocal
            from app.core.db_saver import save_graph_result_to_db
            
            async with AsyncSessionLocal() as db:
                for idx, res in enumerate(results):
                    ticker = batch[idx]
                    if isinstance(res, Exception):
                        print(f"Error processing ticker {ticker}: {res}")
                    elif isinstance(res, dict):
                        try:
                            await save_graph_result_to_db(db, ticker, financial_year, res)
                            print(f"Successfully saved {ticker} to database.")
                        except Exception as db_e:
                            print(f"Error saving {ticker} to database: {db_e}")
            
            # Sleep between batches to respect rate limits
            await asyncio.sleep(5)
            
        print("Bulk processing complete.")
