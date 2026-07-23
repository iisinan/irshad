import os
from apify_client import ApifyClient
from typing import Optional

class FinancialScraper:
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.client = ApifyClient(self.token) if self.token else None

    async def search_annual_report_pdfs(
        self, company_name: str, financial_year: int, annual_only: bool = True
    ) -> dict:
        """
        Uses Apify to find a direct PDF link to the company's FULL YEAR annual report.
        When annual_only=True (default), restricts search to annual reports only (not interim/H1/Q reports).
        """
        import asyncio
        if not self.client:
            print("Apify token not provided. Skipping web scraping.")
            return {"ngx": None, "official": None}

        print(f"Searching for {company_name} FY{financial_year} annual report PDF...")

        # Build targeted queries for full-year annual reports
        if annual_only:
            # New improved query logic for finding exactly the right audited annual documents
            base_query = (
                f'"{company_name}" ("annual report" OR "annual report and accounts" OR '
                f'"audited financial statements" OR "annual financial statements" OR '
                f'"integrated report" OR "consolidated financial statements") '
                f'"{financial_year}" filetype:pdf '
                f'-Q1 -Q2 -Q3 -"Half Year" -H1 -Interim -Unaudited -"Investor Presentation" -"Earnings Call" -Factsheet'
            )
            african_fin_query = f'{base_query} site:africanfinancials.com'
            ngx_query = f'{base_query} site:ngxgroup.com'
            sec_query = f'{base_query} site:sec.gov'
            general_query = base_query
        else:
            african_fin_query = (
                f"{company_name} financial statements {financial_year} filetype:pdf site:africanfinancials.com"
            )
            ngx_query = (
                f"{company_name} financial statements {financial_year} filetype:pdf site:ngxgroup.com"
            )
            sec_query = (
                f"{company_name} financial statements {financial_year} filetype:pdf site:sec.gov"
            )
            general_query = (
                f"{company_name} financial statements {financial_year} filetype:pdf"
            )

        queries = f"{african_fin_query}\n{ngx_query}\n{sec_query}\n{general_query}"

        run_input = {
            "queries": queries,
            "resultsPerPage": 5,
            "maxPagesPerQuery": 1,
            "languageCode": "en",
            "mobileResults": False,
        }

        results = {"ngx": None, "official": None}
        try:
            def _run():
                return self.client.actor("apify/google-search-scraper").call(run_input=run_input)

            run = await asyncio.to_thread(_run)

            # Keywords that indicate an interim / partial-year report — skip these if annual_only
            INTERIM_KEYWORDS = ["interim", "half-year", "half year", "h1", "q1", "q2", "q3", "quarter"]

            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                query = item.get("searchQuery", {}).get("term", "")
                is_ngx_query = "site:ngxgroup.com" in query

                for organic_result in item.get("organicResults", []):
                    url   = organic_result.get("url", "").lower()
                    title = organic_result.get("title", "").lower()
                    snippet = organic_result.get("description", "").lower()

                    if not url.endswith(".pdf"):
                        continue

                    # Skip interim reports when annual_only is requested
                    if annual_only:
                        combined = url + title + snippet
                        if any(kw in combined for kw in INTERIM_KEYWORDS):
                            print(f"  Skipping interim report: {url}")
                            continue

                    if is_ngx_query and not results["ngx"]:
                        results["ngx"] = organic_result.get("url", "")
                    elif not is_ngx_query and not results["official"]:
                        results["official"] = organic_result.get("url", "")

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

import httpx

class AlphaVantageClient:
    def __init__(self):
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")

    async def fetch_financials(self, ticker: str) -> Optional[dict]:
        if not self.api_key:
            return None
            
        print(f"Fetching Alpha Vantage data for {ticker}...")
        url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={ticker}&apikey={self.api_key}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Alpha Vantage fetch failed: {e}")
        return None

class FMPClient:
    def __init__(self):
        self.api_key = os.getenv("FMP_API_KEY")

    async def fetch_financials(self, ticker: str) -> Optional[dict]:
        if not self.api_key:
            return None
            
        print(f"Fetching FMP data for {ticker}...")
        url = f"https://financialmodelingprep.com/api/v3/income-statement/{ticker}?limit=1&apikey={self.api_key}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return {"income_statement": response.json()}
        except Exception as e:
            print(f"FMP fetch failed: {e}")
        return None
