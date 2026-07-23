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

        print(f"Mocking upload of {pdf_path} to Gemini...")
        time.sleep(1)
        
        print("Mocking extraction of data...")
        time.sleep(2)
        
        # Hardcoded mock data based on the user's earlier prompt for Aradel
        mock_data = {
            "total_revenue": 728500000000.0,
            "total_debt": 1780000000000.0,
            "cash_and_equivalents": 1659370000000.0, # Cash + Short term investments
            "interest_expense": 15000000000.0, # Made up for test
            "interest_income": 12750000000.0,
            "total_assets": 5500000000000.0, # Made up for test, we will use market cap anyway
            "published_date": "2025-05-01T00:00:00Z", # New metadata
            "reporting_period": "FY", # New metadata
            "principal_activities": "Exploration, production, and refining of petroleum products.",
            "business_segments": ["Oil & Gas Production", "Refining", "Exploration"]
        }
        
        return mock_data
