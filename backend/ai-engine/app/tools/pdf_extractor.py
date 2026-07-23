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

    def extract_financials(self, pdf_path: str, financial_year: int) -> Dict[str, Any]:
        """
        Mocks the Gemini extraction to bypass API billing issues for testing.
        Returns the data for Aradel Holdings based on the user's previous input.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found at {pdf_path}")

        print(f"Uploading {pdf_path} to Gemini...")
        # Upload the file to Gemini
        gemini_file = self.client.files.upload(file=pdf_path)

        schema = {
            "type": "OBJECT",
            "properties": {
                "total_revenue": {"type": "NUMBER", "description": "Total revenue for the year."},
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
            "required": ["total_revenue", "total_debt", "cash_and_equivalents", "interest_expense", "interest_income", "total_assets", "principal_activities"]
        }

        prompt = f"Extract the financial data and business activities for the financial year {financial_year} from the attached annual report. Return the exact values requested in the schema."
        
        print("Extracting data with Gemini...")
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[gemini_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        
        try:
            return json.loads(response.text)
        except Exception as e:
            print(f"Failed to parse Gemini response: {e}")
            return {}
