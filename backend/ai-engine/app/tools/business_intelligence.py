import os
from apify_client import ApifyClient
from google import genai
from typing import Dict, Any

class BusinessIntelligenceAgent:
    def __init__(self):
        apify_token = os.getenv("APIFY_TOKEN")
        self.apify = ApifyClient(apify_token) if apify_token else None
        
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            from google.genai import types as genai_types
            self.gemini = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1'))
        else:
            self.gemini = None

    async def run_business_screening(self, ticker: str, company_name: str, principal_activities: str, business_segments: list) -> Dict[str, Any]:
        """
        Uses Apify to find recent news about the company's activities, then uses Gemini to determine 
        if any non-compliant activities exist according to AAOIFI standards.
        """
        import asyncio
        # Fetch recent news and validation via Apify
        supporting_evidence = []
        source_urls = []
        
        if self.apify:
            try:
                print(f"Fetching business intelligence for {company_name}...")
                run_input = {
                    "queries": f"{company_name} business activities OR operations OR controversy",
                    "resultsPerPage": 3,
                    "maxPagesPerQuery": 1
                }
                
                def _run_apify():
                    return self.apify.actor("apify/google-search-scraper").call(run_input=run_input)
                    
                run = await asyncio.to_thread(_run_apify)
                for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                    for organic_result in item.get("organicResults", []):
                        supporting_evidence.append(organic_result.get("description", ""))
                        source_urls.append(organic_result.get("url", ""))
            except Exception as e:
                print(f"Apify failed in Business Intelligence: {e}")
        
        # Call Gemini for the final AAOIFI business screening
        if not self.gemini:
            return {}

        schema = {
            "type": "OBJECT",
            "properties": {
                "business_summary": {"type": "STRING"},
                "current_core_business": {"type": "STRING"},
                "detected_business_activities": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "detected_prohibited_activities": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "ai_explanation": {"type": "STRING"},
                "confidence_score": {"type": "NUMBER"},
                "business_compliance_status": {"type": "STRING", "enum": ["Halal", "Questionable", "Non-Compliant"]}
            },
            "required": ["business_summary", "current_core_business", "detected_business_activities", "detected_prohibited_activities", "ai_explanation", "business_compliance_status"]
        }
        
        from google.genai import types
        import json
        
        prompt = f"Company: {company_name} ({ticker})\n" \
                 f"Principal Activities (from Annual Report): {principal_activities}\n" \
                 f"Business Segments (from Annual Report): {business_segments}\n" \
                 f"Web Snippets (Recent): {supporting_evidence}\n\n" \
                 f"Based on AAOIFI Shariah standards, determine if this company engages in any non-permissible (haram) core business activities (e.g., conventional finance, alcohol, pork, gambling, adult entertainment, weapons). Return structured JSON."
                 
        print("Analyzing business compliance with Gemini...")
        try:
            def _generate():
                return self.gemini.models.generate_content(
                    model='models/gemini-3.1-flash-lite',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                    ),
                )
            response = await asyncio.to_thread(_generate)
            
            result = json.loads(response.text)
            result["supporting_evidence"] = supporting_evidence
            result["source_urls"] = source_urls
            result["source_publication_dates"] = [] # Can extract if needed
            from datetime import datetime, timezone
            result["last_analysed_timestamp"] = datetime.now(timezone.utc)
            return result
        except Exception as e:
            print(f"Failed to parse Gemini business intelligence response: {e}")
            return {}
