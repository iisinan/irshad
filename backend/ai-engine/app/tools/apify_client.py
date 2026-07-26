import os
from apify_client import ApifyClient
from typing import Optional

class FinancialScraper:
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.client = ApifyClient(self.token) if self.token else None

    async def search_latest_financial_report_pdfs(
        self, ticker: str, company_name: str, financial_year: int
    ) -> dict:
        """
        Uses Apify to navigate directly to the NGX stock profile page,
        extracts the financial report PDFs, and selects the most recent one
        based on the uploaded date.
        """
        import asyncio
        import re
        from datetime import datetime
        
        if not self.client:
            print("Apify token not provided. Skipping web scraping.")
            return {"ngx": None, "official": None}
            
        print(f"Direct NGX Scraping for {ticker} FY{financial_year} latest financial report PDF...")
        
        ngx_profile_url = f"https://ngxgroup.com/exchange/data/company-profile/?symbol={ticker}&directory=companydirectory"
        
        puppeteer_input = {
            "startUrls": [{"url": ngx_profile_url}],
            "pageFunction": """async ({ page, request }) => {
                try {
                    await new Promise(r => setTimeout(r, 5000)); // wait for ajax to load table
                } catch (e) {}
                
                const data = await page.$$eval('a', els => {
                    return els.filter(a => a.href && a.href.toLowerCase().endsWith('.pdf'))
                              .map(a => {
                                  return {
                                      text: a.innerText.trim(),
                                      url: a.href,
                                      parentText: a.parentElement ? a.parentElement.innerText.trim() : ''
                                  };
                              });
                });
                return { data: data };
            }""",
            "proxyConfiguration": { "useApifyProxy": True }
        }
        
        results = {"ngx": None, "official": None}
        
        try:
            def _run_puppeteer():
                return self.client.actor("apify/puppeteer-scraper").call(run_input=puppeteer_input)
                
            run = await asyncio.to_thread(_run_puppeteer)
            
            extracted_docs = []
            
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                for doc in item.get("data", []):
                    url = str(doc.get("url") or "")
                    text = str(doc.get("text") or "")
                    parent_text = str(doc.get("parentText") or "")
                    
                    # Ensure it's for the requested financial year
                    if str(financial_year) not in url and str(financial_year) not in text and str(financial_year) not in parent_text:
                        continue
                        
                    # Ensure it's a financial report document
                    combined = (url + text + parent_text).lower()
                    if not any(kw in combined for kw in ["financial statement", "audited", "quarter", "earnings", "annual report", "financial"]):
                        continue
                        
                    # Skip irrelevant documents
                    if any(kw in combined for kw in ["insider", "dividend", "notice", "agenda", "proxy", "agm", "dealings", "resolution"]):
                        # Unless it explicitly says financial statement
                        if "financial statement" not in combined and "audited" not in combined and "earnings" not in combined:
                            continue
                    
                    # Parse the date e.g. "[Uploaded on: April 29th 2026]"
                    date_match = re.search(r'\[Uploaded on:\s+([a-zA-Z]+)\s+(\d+)[a-z]{2}\s+(\d{4})\]', parent_text, re.IGNORECASE)
                    
                    doc_date = datetime.min
                    if date_match:
                        month_str, day_str, year_str = date_match.groups()
                        try:
                            date_str_clean = f"{month_str} {day_str} {year_str}"
                            doc_date = datetime.strptime(date_str_clean, "%B %d %Y")
                        except ValueError:
                            pass
                            
                    extracted_docs.append({
                        "url": url,
                        "date": doc_date,
                        "text": text
                    })
                    
            if extracted_docs:
                # Sort by newest date first
                extracted_docs.sort(key=lambda x: x["date"], reverse=True)
                
                print(f"DEBUG: Found {len(extracted_docs)} PDFs for {ticker}. Newest: {extracted_docs[0]['date']} -> {extracted_docs[0]['url']}")
                best_doc = extracted_docs[0]
                results["official"] = best_doc["url"]
                results["ngx"] = best_doc["url"]
                
        except Exception as e:
            print(f"NGX Direct Scraper failed: {str(e)}")
            
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
