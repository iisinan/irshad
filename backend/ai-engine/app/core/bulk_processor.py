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
        self.tickers_file = os.path.join(os.path.dirname(__file__), "../../../backend/database/data/ngx_companies.json")
    
    async def process_all_tickers(self, financial_year: int = 2024):
        """
        Iterates over all tickers and triggers the LangGraph pipeline for each.
        """
        if not os.path.exists(self.tickers_file):
            print(f"Tickers file not found at {self.tickers_file}")
            return
            
        with open(self.tickers_file, "r") as f:
            data = json.load(f)
            
        # In a real production scenario, this should be dispatched to a task queue (like Celery)
        # For this prototype, we'll process them asynchronously in batches of 5 to avoid API rate limits
        
        tickers = []
        for company in data:
            if company.get("symbol"):
                tickers.append(company.get("symbol"))
                
        print(f"Found {len(tickers)} tickers to process.")
        
        batch_size = 5
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
            for res in results:
                if isinstance(res, Exception):
                    print(f"Error processing ticker: {res}")
            
            # Sleep between batches to respect rate limits
            await asyncio.sleep(5)
            
        print("Bulk processing complete.")
