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
        If direct PDF links are not found, deep-crawls the HTML pages returned by Google
        (e.g., Company Website, NGX, African Financials) to extract PDF links.
        """
        import asyncio
        from urllib.parse import urljoin
        import re

        if not self.client:
            print("Apify token not provided. Skipping web scraping.")
            return {"ngx": None, "official": None}

        print(f"Searching for {company_name} FY{financial_year} annual report PDF...")

        # Stage 1: Broad search queries to find both direct PDFs and HTML pages
        base_query = (
            f'"{company_name}" ("annual report" OR "annual report and accounts" OR '
            f'"audited financial statements" OR "annual financial statements" OR '
            f'"integrated report" OR "consolidated financial statements") '
            f'"{financial_year}" '
            f'-Q1 -Q2 -Q3 -"Half Year" -H1 -Interim -Unaudited -"Investor Presentation" -"Earnings Call" -Factsheet'
        )
        
        queries = [
            f'{base_query} inurl:africanfinancials.com',
            f'{base_query} inurl:ngxgroup.com',
            base_query # Official sites usually surface here
        ]
        
        run_input = {
            "queries": "\\n".join(queries),
            "resultsPerPage": 5,
            "maxPagesPerQuery": 1,
            "languageCode": "en",
        }

        results = {"ngx": None, "official": None, "african_financials": None}
        html_pages_to_crawl = []
        found_pdfs = []
        
        EXCLUDE_KEYWORDS = ["interim", "half-year", "half year", "h1", "q1", "q2", "q3", "quarter", "sustainability", "esg", "proxy", "notice", "agenda", "dividend", "presentation"]

        def is_valid_pdf(url_str, text_str=""):
            # Check year
            if str(financial_year) not in text_str and str(financial_year) not in url_str:
                return False
            # Check for interim or non-financial reports
            if annual_only:
                combined = (url_str + text_str).lower()
                if any(kw in combined for kw in EXCLUDE_KEYWORDS):
                    return False
            return True

        try:
            # 1. Fetch Google Search Results
            def _run_google():
                return self.client.actor("apify/google-search-scraper").call(run_input=run_input)

            run = await asyncio.to_thread(_run_google)

            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                query = item.get("searchQuery", {}).get("term", "")
                is_ngx = "inurl:ngxgroup.com" in query
                is_af = "inurl:africanfinancials.com" in query
                
                # First word of company name to check for official domain match
                company_first_word = company_name.split()[0].lower().replace(",", "").replace(".", "")

                for organic_result in item.get("organicResults", []):
                    url = organic_result.get("url", "")
                    title = organic_result.get("title", "")
                    snippet = organic_result.get("description", "")
                    
                    if "proshare" in url.lower() or "nairametrics" in url.lower() or "businessday" in url.lower():
                        continue # Skip news sites
                        
                    source_type = "other"
                    if is_ngx or "ngxgroup.com" in url.lower():
                        source_type = "ngx"
                    elif is_af or "africanfinancials.com" in url.lower():
                        source_type = "african_financials"
                    elif company_first_word in url.lower():
                        source_type = "official"
                        
                    if source_type == "other":
                        continue # Skip random domains that don't match any criteria
                    
                    if url.lower().endswith(".pdf"):
                        if is_valid_pdf(url, title + snippet):
                            found_pdfs.append({"url": url, "source_type": source_type, "text": title + snippet})
                    else:
                        # Collect HTML links for deep crawling
                        html_pages_to_crawl.append({"url": url, "source_type": source_type})

            # 2. Deep Crawl HTML Pages using Cheerio Scraper if necessary
            if html_pages_to_crawl:
                print(f"Deep crawling {len(html_pages_to_crawl)} HTML pages for hidden PDFs...")
                
                cheerio_input = {
                    "startUrls": [{"url": page["url"], "userData": {"source_type": page["source_type"]}} for page in html_pages_to_crawl[:10]], # Limit to top 10
                    "pageFunction": """async ({ $, request }) => {
                        const links = [];
                        $('a').each((i, el) => {
                            const href = $(el).attr('href');
                            const text = $(el).text();
                            if (href && (href.toLowerCase().endsWith('.pdf') || (text && text.toLowerCase().includes('pdf')))) {
                                links.push({ url: href, text: text });
                            }
                        });
                        return { links, sourceType: request.userData.source_type, sourceUrl: request.url };
                    }"""
                }
                
                def _run_cheerio():
                    return self.client.actor("apify/cheerio-scraper").call(run_input=cheerio_input)
                    
                cheerio_run = await asyncio.to_thread(_run_cheerio)
                
                for item in self.client.dataset(cheerio_run["defaultDatasetId"]).iterate_items():
                    base_url = item.get("sourceUrl", "")
                    source_type = item.get("sourceType", "official")
                    for link in item.get("links", []):
                        raw_href = link.get("url", "")
                        text = link.get("text", "")
                        
                        # Resolve relative URLs
                        try:
                            full_url = urljoin(base_url, raw_href)
                        except:
                            continue
                            
                        if not full_url.lower().endswith('.pdf'):
                            continue
                            
                        if is_valid_pdf(full_url, text):
                            found_pdfs.append({"url": full_url, "source_type": source_type, "text": text})

            # 3. Filter and Sort the most recent/best PDFs
            if found_pdfs:
                print(f"Found {len(found_pdfs)} valid PDFs. Selecting best..."); print("All PDFs:", found_pdfs)
                
                # We prioritize Official > African Financials > NGX
                priority = {"official": 3, "african_financials": 2, "ngx": 1}
                
                # Sort by Priority (Descending) and then attempt to extract dates from URL to get most recent
                def extract_year_month(url_str):
                    # Basic extraction for YYYY/MM or YYYY-MM
                    match = re.search(r'(20\d{2})[-/](0[1-9]|1[0-2])', url_str)
                    if match:
                        return int(match.group(1)) * 100 + int(match.group(2))
                    return 0

                found_pdfs.sort(key=lambda x: (priority.get(x["source_type"], 0), extract_year_month(x["url"])), reverse=True)
                
                # Assign to results
                for pdf in found_pdfs:
                    stype = pdf["source_type"]
                    if stype in results and not results[stype]:
                        results[stype] = pdf["url"]
                        
                # If official is missing but we have african_financials, we can use it as official fallback
                if not results["official"] and results["african_financials"]:
                    results["official"] = results["african_financials"]
                elif not results["official"] and results["ngx"]:
                    results["official"] = results["ngx"]
                    
            return results

        except Exception as e:
            error_msg = str(e)
            print(f"Apify Scraper failed: {error_msg}")
            if "approvePermissions=true" in error_msg:
                print(f"⚠️ ACTION REQUIRED: You must approve Apify Cheerio Scraper permissions here: https://console.apify.com/actors/YrQuEkowkNCLdk4j2?approvePermissions=true")
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
