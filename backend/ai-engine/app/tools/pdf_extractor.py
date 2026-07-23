import os
import json
import time
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

class PDFExtractor:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        from google.genai import types as genai_types
        self.client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1'))

    async def extract_financials(self, pdf_path: str, financial_year: int) -> Dict[str, Any]:
        """
        Extracts financial data from a PDF report using Gemini.
        Always returns values in absolute NGN (handles NGN '000, USD, GBP automatically).
        """
        import asyncio
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found at {pdf_path}")

        print(f"Uploading {pdf_path} to Gemini...")
        gemini_file = await asyncio.to_thread(self.client.files.upload, file=pdf_path)

        try:
            def evidence_based_field(desc):
                return {
                    "type": "OBJECT",
                    "properties": {
                        "value": {"type": "NUMBER", "description": desc},
                        "page": {"type": "INTEGER", "description": "The exact page number where this value was found."},
                        "quote": {"type": "STRING", "description": "A short, exact quote from the document supporting this value."},
                        "confidence": {"type": "INTEGER", "description": "Confidence score from 0 to 100."}
                    },
                    "required": ["value", "page", "quote", "confidence"]
                }

            schema = {
                "type": "OBJECT",
                "properties": {
                    "financial_year": {
                        "type": "INTEGER",
                        "description": "The financial year this report corresponds to (e.g. 2026). Use the FULL YEAR end date, not interim period."
                    },
                    "reporting_period": {
                        "type": "STRING",
                        "description": "The reporting period: 'FY' for full year annual report, 'H1' for half-year, 'Q1/Q2/Q3' for quarterly. Prefer FY."
                    },
                    "financial_year_end_date": {
                        "type": "STRING",
                        "description": "The exact date the financial period ends, ISO 8601 (e.g. '2026-12-31')."
                    },
                    "published_date": {
                        "type": "STRING",
                        "description": "The date the report was published, ISO 8601."
                    },
                    "reporting_currency": {
                        "type": "STRING",
                        "description": "The currency used in the report: 'NGN', 'USD', or 'GBP'."
                    },
                    "unit_multiplier": {
                        "type": "NUMBER",
                        "description": (
                            "The scale factor of monetary values stated in this report. "
                            "If the report says 'All amounts in NGN thousands' → return 1000. "
                            "If 'NGN millions' → return 1000000. "
                            "If amounts are already in full Naira / USD / GBP → return 1. "
                            "IMPORTANT: Read the notes to the financial statements carefully for the unit disclosure."
                        )
                    },
                    "total_revenue": evidence_based_field(
                        "Total revenue / turnover / gross earnings for the FULL reporting period. "
                        "Return the RAW value as printed in the report (before applying unit_multiplier)."
                    ),
                    "total_debt": evidence_based_field(
                        "Total interest-bearing debt: sum of short-term and long-term borrowings, bonds, loans. "
                        "For banks: use only interest-bearing borrowings (NOT customer deposits). Raw value."
                    ),
                    "cash_and_equivalents": evidence_based_field(
                        "Cash and cash equivalents plus short-term liquid investments. Raw value."
                    ),
                    "interest_income": evidence_based_field(
                        "Non-permissible / interest income earned by the company. "
                        "For non-financial companies: look for 'finance income', 'interest income on deposits'. "
                        "For banks: this is the gross interest income line. If not separately disclosed, return 0. Raw value."
                    ),
                    "total_assets": evidence_based_field(
                        "Total assets from the balance sheet. Raw value."
                    ),
                    "principal_activities": {
                        "type": "STRING",
                        "description": "A description of the company's principal business activities from the report."
                    },
                    "business_segments": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                        "description": "List of the company's disclosed business segments."
                    },
                    "is_bank_or_financial": {
                        "type": "BOOLEAN",
                        "description": "True if this is a bank, insurance company, or financial services entity."
                    }
                },
                "required": [
                    "financial_year", "reporting_period", "reporting_currency",
                    "unit_multiplier", "total_revenue", "total_debt",
                    "cash_and_equivalents", "interest_income", "total_assets",
                    "principal_activities", "is_bank_or_financial"
                ]
            }

            prompt = (
                f"You are extracting financial data from a corporate financial report for AAOIFI Islamic finance screening.\n\n"
                f"TARGET FINANCIAL YEAR: {financial_year}\n\n"
                f"CRITICAL RULES:\n"
                f"1. UNITS: Read the 'Notes to Financial Statements' or report header carefully. "
                f"   Identify whether figures are in full Naira, NGN thousands (NGN'000), NGN millions, USD, or GBP. "
                f"   Return the EXACT unit_multiplier (e.g. 1000 if NGN'000, 1000000 if NGN millions, 1 if absolute). "
                f"   Return figures as RAW numbers printed in the document — do NOT pre-scale them.\n"
                f"2. FULL YEAR ONLY: Extract FULL YEAR (annual) figures only. "
                f"   If this is an interim report (H1, Q1–Q3), still extract the data but set reporting_period accordingly. "
                f"   Prefer audited full-year statements.\n"
                f"3. BANK DEBT: If this is a bank, total_debt = only interest-bearing borrowings (bonds, loans from other banks). "
                f"   Do NOT include customer deposits in total_debt for banks.\n"
                f"4. CURRENCY: Set reporting_currency to 'NGN', 'USD', or 'GBP' as stated in the report.\n"
                f"5. EVIDENCE: For every monetary value, you MUST return the exact page number and a short quotation "
                f"   from the document proving the number. This is for strict auditability.\n\n"
                f"Extract all fields from the attached financial report now."
            )

            print("Extracting data with Gemini (unit-aware)...")
            def _generate():
                return self.client.models.generate_content(
                    model='models/gemini-3.1-flash-lite',
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
