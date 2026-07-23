import os
import json
import time
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

class PDFExtractor:
    def __init__(self):
        # We assume GEMINI_API_KEY is in the environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
            
        # Initialize the official google-genai client
        self.client = genai.Client(api_key=api_key)

    async def extract_financials(self, pdf_path: str, financial_year: int) -> Dict[str, Any]:
        """
        Extracts financial data from a PDF report using Gemini 2.5.
        """
        import asyncio
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found at {pdf_path}")

        print(f"Uploading {pdf_path} to Gemini...")
        # Upload the file to Gemini in a separate thread
        gemini_file = await asyncio.to_thread(self.client.files.upload, file=pdf_path)

        try:
            schema = {
                "type": "OBJECT",
                "properties": {
                    "financial_year": {"type": "INTEGER", "description": "The financial year this report corresponds to (e.g. 2024, 2025, 2026)."},
                    "total_revenue": {"type": "NUMBER", "description": "Total revenue for the period."},
                    "total_debt": {"type": "NUMBER", "description": "Total interest-bearing debt (short term + long term)."},
                    "cash_and_equivalents": {"type": "NUMBER", "description": "Cash and cash equivalents plus short-term investments."},
                    "interest_expense": {"type": "NUMBER", "description": "Interest expense on debt."},
                    "interest_income": {"type": "NUMBER", "description": "Interest income or non-permissible income."},
                    "total_assets": {"type": "NUMBER", "description": "Total assets."},
                    "published_date": {"type": "STRING", "description": "The date the report was published (ISO 8601)."},
                    "reporting_period": {"type": "STRING", "description": "The reporting period (e.g. FY, Q1, Q2, Q3, Q4)."},
                    "principal_activities": {"type": "STRING", "description": "A description of the company's principal activities."},
                    "business_segments": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                        "description": "List of the company's business segments."
                    }
                },
                "required": ["financial_year", "total_revenue", "total_debt", "cash_and_equivalents", "interest_expense", "interest_income", "total_assets", "principal_activities"]
            }

            prompt = f"Extract the financial data and business activities from the attached financial report (which could be an Annual Report, Interim, Q1, Q2, Q3, etc.). Return the exact values requested in the schema, accurately identifying the financial year and reporting period."
            
            print("Extracting data with Gemini...")
            def _generate():
                return self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[gemini_file, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                    ),
                )
                
            response = await asyncio.to_thread(_generate)
            
            try:
                return json.loads(response.text)
            except Exception as e:
                print(f"Failed to parse Gemini response: {e}")
                return {}
        finally:
            print(f"Cleaning up Gemini file: {gemini_file.name}...")
            try:
                await asyncio.to_thread(self.client.files.delete, name=gemini_file.name)
            except Exception as cleanup_error:
                print(f"Failed to clean up Gemini file: {cleanup_error}")
