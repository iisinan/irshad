import os
import json
from google import genai
from google.genai import types as genai_types
from typing import Dict, Any, Optional

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key, http_options=genai_types.HttpOptions(api_version='v1'))
        else:
            self.client = None

    async def extract_financial_data(self, pdf_text: str, company_name: str, financial_year: int) -> Dict[str, Any]:
        """
        Extracts financial figures from the provided Annual Report text using Gemini.
        Returns a structured dictionary matching the required extraction schema.
        """
        if not self.client:
            print("Gemini API key not configured.")
            return {}

        prompt = f"""
You are an expert financial auditor extracting data from the official {financial_year} Audited Annual Report of {company_name}.
Your strict instructions are to extract the following exact figures from the financial statements (Statement of Profit or Loss, Statement of Financial Position, Statement of Cash Flows).

CRITICAL RULES - NO HALLUCINATION ALLOWED:
1. ONLY extract data if it clearly represents the FULL YEAR {financial_year} (FY {financial_year}) results.
2. DO NOT perform any calculations. Extract the raw figures exactly as printed.
3. If a value is not explicitly found, return 0 and set confidence to 0.
4. You MUST include the page number and the exact quote from the document where you found the number.
5. If the document uses a unit multiplier (e.g. "in thousands of NGN" or "N'000"), specify it in unit_multiplier (e.g. 1000).
6. Return ONLY valid JSON matching the schema below. No markdown wrappers.

SCHEMA:
{{
  "total_revenue": {{"value": 0, "page": 0, "quote": "string", "confidence": 90}},
  "total_assets": {{"value": 0, "page": 0, "quote": "string", "confidence": 90}},
  "total_debt": {{"value": 0, "page": 0, "quote": "string", "confidence": 90}},
  "cash_and_equivalents": {{"value": 0, "page": 0, "quote": "string", "confidence": 90}},
  "interest_income": {{"value": 0, "page": 0, "quote": "string", "confidence": 90}},
  "reporting_currency": "NGN",
  "unit_multiplier": 1000000,
  "financial_year_end_date": "YYYY-MM-DD",
  "reporting_period": "FY",
  "published_date": "YYYY-MM-DD",
  "auditor": "string"
}}

Here is the document text (this might be truncated, do your best):
---
{pdf_text[:1000000]} 
---
"""
        
        try:
            import asyncio
            def _generate():
                return self.client.models.generate_content(
                    model='models/gemini-3.1-flash-lite',
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        temperature=0.1,
                        response_mime_type="application/json",
                    )
                )
            response = await asyncio.to_thread(_generate)
            
            content = response.text.strip()
            return json.loads(content)
        except Exception as e:
            print(f"Gemini Extraction Failed: {e}")
            return {}
