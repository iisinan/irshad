import os
from apify_client import ApifyClient
from typing import Optional

class FinancialScraper:
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.client = ApifyClient(self.token) if self.token else None

    async def search_annual_report_pdfs(self, company_name: str, financial_year: int) -> dict:
        """
        Uses Apify to find a direct PDF link to the Annual Report.
        Searches both NGX and general web to compare.
        """
        import asyncio
        if not self.client:
            print("Apify token not provided. Skipping web scraping.")
            return {"ngx": None, "official": None}
            
        print(f"Searching web for {company_name} {financial_year} Annual Report PDFs...")
        
        # Prepare two queries: one targeted at NGX, one general
        queries = f"{company_name} {financial_year} Annual Report filetype:pdf site:ngxgroup.com\n{company_name} {financial_year} Annual Report filetype:pdf"
        
        run_input = {
            "queries": queries,
            "resultsPerPage": 3,
            "maxPagesPerQuery": 1,
            "languageCode": "en",
            "mobileResults": False,
        }

        results = {"ngx": None, "official": None}
        try:
            def _run():
                return self.client.actor("apify/google-search-scraper").call(run_input=run_input)
            
            run = await asyncio.to_thread(_run)
            
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                query = item.get("searchQuery", {}).get("term", "")
                is_ngx_query = "site:ngxgroup.com" in query
                
                for organic_result in item.get("organicResults", []):
                    url = organic_result.get("url", "")
                    if url.lower().endswith(".pdf"):
                        if is_ngx_query and not results["ngx"]:
                            results["ngx"] = url
                        elif not is_ngx_query and not results["official"]:
                            results["official"] = url
            
            return results

        except Exception as e:
            print(f"Apify Scraper failed: {str(e)}")
            return results

    async def fetch_validation_data(self, ticker: str) -> Optional[dict]:
        """
        Uses Apify to scrape financial validation data (e.g. Yahoo Finance).
        We will use a basic Google search to extract the summary for validation.
        """
        import asyncio
        if not self.client:
            return None
            
        print(f"Fetching validation data for {ticker}...")
        run_input = {
            "queries": f"{ticker} total revenue total debt site:finance.yahoo.com",
            "resultsPerPage": 1,
            "maxPagesPerQuery": 1
        }
        try:
            def _run():
                return self.client.actor("apify/google-search-scraper").call(run_input=run_input)
            
            run = await asyncio.to_thread(_run)
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                for organic_result in item.get("organicResults", []):
                    # For MVP, just return the snippet which we can feed to Gemini for validation
                    return {"snippet": organic_result.get("description", "")}
            return None
        except Exception as e:
            print(f"Apify Validation Scraper failed: {str(e)}")
            return None
