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
        Uses Apify to find a direct PDF link to the company's latest financial report (Q1, Q2, H1, or Annual).
        If direct PDF links are not found, deep-crawls the HTML pages returned by Google
        (e.g., Company Website, NGX, African Financials) to extract PDF links.
        """
        import asyncio
        from urllib.parse import urljoin
        import re

        if not self.client:
            print("Apify token not provided. Skipping web scraping.")
            return {"ngx": None, "official": None}

        print(f"Searching for {company_name} FY{financial_year} latest financial report PDF...")

        # Stage 1: Broad search queries to find both direct PDFs and HTML pages
        base_query = (
            f'"{company_name}" ("financial statements" OR "quarterly report" OR '
            f'"audited financial statements" OR "unaudited financial statements" OR '
            f'"interim financial statements" OR "annual report" OR "commercial papers") '
            f'"{financial_year}" '
            f'-"Investor Presentation" -"Earnings Call" -Factsheet -ESG -Sustainability'
        )
        
        queries = [
            f'{base_query} inurl:africanfinancials.com',
            f'{base_query} inurl:ngxgroup.com',
            f'{base_query} inurl:sec.gov.ng',
            base_query # Official sites usually surface here
        ]
        
        run_input = {
            "queries": "\n".join(queries),
            "resultsPerPage": 10,
            "maxPagesPerQuery": 1,
            "languageCode": "en",
        }

        results = {"ngx": None, "official": None, "african_financials": None, "sec": None}
        html_pages_to_crawl = []
        found_docs = [] # Will store both PDFs and HTML fallbacks
        
        EXCLUDE_KEYWORDS = ["sustainability", "esg", "proxy", "notice", "agenda", "dividend", "presentation"]

        def is_valid_document(url_str, text_str=""):
            # Check year
            if str(financial_year) not in text_str and str(financial_year) not in url_str:
                return False
                
            # Check company name (first word)
            company_first = company_name.split()[0].lower().replace(",", "").replace(".", "")
            if company_first not in url_str.lower() and company_first not in text_str.lower():
                return False
                
            # Check for non-financial reports
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
                is_sec = "inurl:sec.gov.ng" in query
                
                # First word of company name to check for official domain match
                company_first_word = company_name.split()[0].lower().replace(",", "").replace(".", "")

                for organic_result in item.get("organicResults", []):
                    url = organic_result.get("url", "")
                    title = organic_result.get("title", "")
                    snippet = organic_result.get("description", "")
                    
                    if "proshare" in url.lower() or "nairametrics" in url.lower() or "businessday" in url.lower():
                        continue # Skip news sites
                        
                    source_type = "other"
                    if is_sec or "sec.gov.ng" in url.lower():
                        source_type = "sec"
                    elif is_ngx or "ngxgroup.com" in url.lower():
                        source_type = "ngx"
                    elif is_af or "africanfinancials.com" in url.lower():
                        source_type = "african_financials"
                    elif company_first_word in url.lower():
                        source_type = "official"
                        
                    if source_type == "other":
                        continue # Skip random domains that don't match any criteria
                    
                    if is_valid_document(url, title + snippet):
                        if url.lower().endswith(".pdf"):
                            found_docs.append({"url": url, "source_type": source_type, "text": title + snippet, "is_pdf": True})
                        else:
                            # Collect HTML links for deep crawling and as potential fallback documents
                            html_pages_to_crawl.append({"url": url, "source_type": source_type})
                            found_docs.append({"url": url, "source_type": source_type, "text": title + snippet, "is_pdf": False})

            # 2. Deep Crawl HTML Pages using Puppeteer Scraper if necessary
            
            # Always add NGX profile as a guaranteed fallback source
            ngx_profile_url = f"https://ngxgroup.com/exchange/data/company-profile/?symbol={ticker}&directory=companydirectory"
            if not any(page["url"] == ngx_profile_url for page in html_pages_to_crawl):
                html_pages_to_crawl.append({"url": ngx_profile_url, "source_type": "ngx"})

            if html_pages_to_crawl:
                print(f"Deep crawling {len(html_pages_to_crawl)} HTML pages for hidden PDFs using Puppeteer...")
                
                puppeteer_input = {
                    "startUrls": [{"url": page["url"], "userData": {"source_type": page["source_type"]}} for page in html_pages_to_crawl[:10]], # Limit to top 10
                    "pageFunction": """async ({ page, request }) => {
                        try {
                            await new Promise(r => setTimeout(r, 3000)); // Wait for dynamic content/AJAX
                        } catch (e) {
                            console.log("Wait timeout", e);
                        }
                        const links = await page.$$eval('a', els => 
                            els.filter(a => a.href && (a.href.toLowerCase().endsWith('.pdf') || (a.innerText && a.innerText.toLowerCase().includes('pdf'))))
                               .map(a => ({ text: a.innerText.trim(), url: a.href }))
                        );
                        return { links: links, sourceType: request.userData.source_type, sourceUrl: request.url };
                    }""",
                    "proxyConfiguration": { "useApifyProxy": True }
                }
                
                def _run_puppeteer():
                    return self.client.actor("apify/puppeteer-scraper").call(run_input=puppeteer_input)
                    
                scraper_run = await asyncio.to_thread(_run_puppeteer)
                
                for item in self.client.dataset(scraper_run["defaultDatasetId"]).iterate_items():
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
                            
                        if is_valid_document(full_url, text):
                            found_docs.append({"url": full_url, "source_type": source_type, "text": text, "is_pdf": True})

            # 3. Filter and Sort the most recent/best PDFs and HTML fallbacks
            if found_docs:
                print(f"DEBUG found_docs: {found_docs}")
                print(f"Found {len(found_docs)} valid documents. Selecting best..."); 
                
                # Priority: Official (4) > NGX (3) > African Financials (2) > SEC (1)
                priority = {"official": 4, "ngx": 3, "african_financials": 2, "sec": 1}
                
                def extract_recency_score(url_str, text_str, is_pdf):
                    score = 0
                    combined = (url_str + text_str).lower()
                    
                    # 1. Extract years
                    # Prioritize year from URL, take the minimum year as it's usually the report year 
                    # (e.g. 2025 report published in 2026 -> min is 2025).
                    url_years = [int(y) for y in set(re.findall(r'(20\d{2})', url_str))]
                    text_years = [int(y) for y in set(re.findall(r'(20\d{2})', text_str))]
                    
                    primary_year = 0
                    if url_years:
                        primary_year = min(url_years)
                    elif text_years:
                        primary_year = min(text_years)
                    else:
                        primary_year = financial_year
                        
                    score += primary_year * 100
                        
                    # 2. Add bonus for later periods within the same year (Q4 > Q3 > Q2 > Q1)
                    if "q4" in combined or "annual" in combined or "full year" in combined or "year end" in combined or "yearend" in combined:
                        score += 40
                    elif "q3" in combined or "nine month" in combined or "9m" in combined or "third quarter" in combined:
                        score += 30
                    elif "q2" in combined or "h1" in combined or "half year" in combined or "six month" in combined or "6m" in combined or "second quarter" in combined:
                        score += 20
                    elif "q1" in combined or "first quarter" in combined or "3m" in combined or "quarter 1" in combined:
                        score += 10
                    
                    # 3. Massive bonus for PDF so they always outrank HTML pages if they exist
                    if is_pdf:
                        score += 10000000
                        
                    return score

                found_docs.sort(key=lambda x: (priority.get(x["source_type"], 0), extract_recency_score(x["url"], x["text"], x["is_pdf"])), reverse=True)
                
                # Assign to results
                for doc in found_docs:
                    stype = doc["source_type"]
                    if stype in results and not results[stype]:
                        results[stype] = doc["url"]
                        
                # Priority Fallback if Official is missing
                if not results["official"]:
                    if results["ngx"]:
                        results["official"] = results["ngx"]
                    elif results["african_financials"]:
                        results["official"] = results["african_financials"]
                    elif results["sec"]:
                        results["official"] = results["sec"]
                    
            return results

        except Exception as e:
            error_msg = str(e)
            print(f"Apify Scraper failed: {error_msg}")
            if "approvePermissions=true" in error_msg:
                print(f"⚠️ ACTION REQUIRED: You must approve Apify Puppeteer Scraper permissions here: https://console.apify.com/actors/YJCnS9qogi9XxDgLB?approvePermissions=true")
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
