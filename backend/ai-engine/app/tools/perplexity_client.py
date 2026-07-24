import os
import json
import httpx
from typing import Dict, Any, Optional

class PerplexityClient:
    def __init__(self):
        self.api_key = os.getenv("PERPLEXITY_API_KEY")
        self.base_url = "https://api.perplexity.ai/chat/completions"

    async def fetch_comprehensive_data(self, company_name: str, financial_year: int) -> Dict[str, Any]:
        """
        Uses Perplexity's sonar-pro model to deep search the live web for financial numbers, business activities,
        halal verdict, and latest news, including sources.
        Returns data matching a comprehensive schema for the AI engine pipeline.
        """
        if not self.api_key:
            print("Perplexity API key not set. Skipping.")
            return {}

        prompt = (
            f"You are a strict financial extraction AI. Your job is to search the live web for the {financial_year} "
            f"financial statements, business activities, and latest news of '{company_name}', a stock traded on the NGX.\n\n"
            f"CRITICAL RULES:\n"
            f"1. Search the web for their latest {financial_year} financial results (Annual or Q1/Q2/Q3 if Annual is missing).\n"
            f"2. Return the figures as RAW numbers printed in the document/news (do NOT pre-scale them). If the news says '5.2 billion NGN', return 5.2 and set unit_multiplier to 1000000000.\n"
            f"3. BANK DEBT: If this is a bank, total_debt = only interest-bearing borrowings (bonds, loans). Do NOT include customer deposits in total_debt.\n"
            f"4. Provide business activity details and a Halal screening verdict (Compliant, Non-Compliant, or Questionable based on AAOIFI Shariah standards regarding their business lines, e.g., alcohol, gambling, conventional finance).\n"
            f"5. Provide the latest news regarding the stock.\n"
            f"6. SOURCE URLs: You MUST provide the URLs where you found this information in the 'source_urls' object.\n"
            f"7. You MUST return ONLY a valid JSON object matching the exact schema below. Do not include markdown formatting like ```json or any conversational text. Just the raw JSON.\n\n"
            f"SCHEMA:\n"
            f"{{\n"
            f"  \"financials\": {{\n"
            f"    \"financial_year\": {financial_year},\n"
            f"    \"reporting_period\": \"FY\" or \"Q1\",\n"
            f"    \"financial_year_end_date\": \"YYYY-MM-DD\",\n"
            f"    \"published_date\": \"YYYY-MM-DD\",\n"
            f"    \"reporting_currency\": \"NGN\" or \"USD\",\n"
            f"    \"unit_multiplier\": 1 or 1000 or 1000000,\n"
            f"    \"total_revenue\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}},\n"
            f"    \"total_debt\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}},\n"
            f"    \"cash_and_equivalents\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}},\n"
            f"    \"interest_income\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}},\n"
            f"    \"total_assets\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}},\n"
            f"    \"market_cap\": {{\"value\": 0, \"page\": 0, \"quote\": \"string\", \"confidence\": 90}}\n"
            f"  }},\n"
            f"  \"business_activities\": {{\n"
            f"    \"principal_activities\": \"string\",\n"
            f"    \"business_segments\": [\"string\"],\n"
            f"    \"is_bank_or_financial\": true/false,\n"
            f"    \"verdict\": \"Compliant\" or \"Non-Compliant\" or \"Questionable\",\n"
            f"    \"verdict_reasoning\": \"string\"\n"
            f"  }},\n"
            f"  \"latest_news\": [\n"
            f"    {{\"title\": \"string\", \"summary\": \"string\", \"url\": \"string\", \"date\": \"YYYY-MM-DD\"}}\n"
            f"  ],\n"
            f"  \"source_urls\": {{\n"
            f"    \"financials_source\": \"string URL\",\n"
            f"    \"business_info_source\": \"string URL\"\n"
            f"  }}\n"
            f"}}\n"
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": "You are an expert financial data extraction agent. You must output ONLY valid JSON without markdown wrapping."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }

        print(f"Querying Perplexity Comprehensive for {company_name} {financial_year}...")
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(self.base_url, json=payload, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                content = content.strip()
                
                return json.loads(content)
        except Exception as e:
            print(f"Perplexity Comprehensive Failed: {e}")
            if 'response' in locals() and hasattr(response, 'text'):
                print(f"Response: {response.text}")
            return {}
