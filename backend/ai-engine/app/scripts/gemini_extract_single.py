"""
Standalone Gemini extractor - called as a subprocess with hard OS timeout.
Usage: python3 -m app.scripts.gemini_extract_single <pdf_path> <financial_year>
Outputs JSON to stdout.
"""
import os, sys, json
import fitz # PyMuPDF
from google import genai
from google.genai import types as genai_types

def main():
    if len(sys.argv) < 3:
        print(json.dumps({}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    financial_year = int(sys.argv[2])

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "No API key"}), file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1beta'))

    upload_path = pdf_path

    print(f"Uploading {upload_path}...", file=sys.stderr)
    gemini_file = client.files.upload(file=upload_path)

    def field(desc):
        return {
            "type": "OBJECT",
            "properties": {
                "value": {"type": "NUMBER", "description": desc},
                "page": {"type": "INTEGER", "description": "Page number where found."},
                "quote": {"type": "STRING", "description": "Short exact quote from document."},
                "confidence": {"type": "INTEGER", "description": "0–100 confidence."}
            },
            "required": ["value", "page", "quote", "confidence"]
        }

    schema = {
        "type": "OBJECT",
        "properties": {
            "financial_year": {"type": "INTEGER"},
            "reporting_period": {"type": "STRING"},
            "financial_year_end_date": {"type": "STRING"},
            "published_date": {"type": "STRING"},
            "reporting_currency": {"type": "STRING"},
            "unit_multiplier": {"type": "NUMBER", "description": "1=absolute, 1000=NGN'000, 1000000=NGN millions"},
            "total_revenue": field("Total revenue / turnover / gross earnings"),
            "interest_income": field("Interest income / finance income / investment income from interest-bearing instruments"),
            "total_debt": field("Total interest-bearing debt: borrowings, loans, bonds. Exclude customer deposits for banks."),
            "cash_and_equivalents": field("Cash and cash equivalents"),
            "total_assets": field("Total assets"),
            "accounts_receivable": field("Trade receivables / accounts receivable"),
            "illiquid_assets": field("Fixed/non-current assets: property, plant, equipment, intangibles"),
            "principal_activities": {"type": "STRING", "description": "Brief description of company's principal business activities."},
            "is_bank_or_financial": {"type": "BOOLEAN", "description": "True if this is a bank, insurance company, or financial institution."}
        },
        "required": ["financial_year", "reporting_period", "reporting_currency", "unit_multiplier", "total_revenue", "total_debt", "cash_and_equivalents", "total_assets", "is_bank_or_financial"]
    }

    prompt = (
        f"You are extracting financial data from a corporate financial report for AAOIFI Islamic finance screening.\n\n"
        f"TARGET FINANCIAL YEAR: {financial_year}\n\n"
        f"CRITICAL RULES:\n"
        f"1. UNITS: Read the report header/notes carefully. Identify if figures are in full Naira, NGN'000, NGN millions, USD, or GBP.\n"
        f"   Return the EXACT unit_multiplier (1000 if NGN'000, 1000000 if NGN millions, 1 if absolute).\n"
        f"   Return figures as RAW numbers as printed in the document — do NOT pre-scale them.\n"
        f"2. BANK DEBT: If this is a bank, total_debt = only interest-bearing borrowings. Do NOT include customer deposits.\n"
        f"3. EVIDENCE: For every monetary value, return the exact page number and a short quote proving the number.\n\n"
        f"Extract all fields from the attached financial report now."
    )

    MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-001']
    result = {}
    for model in MODELS:
        try:
            print(f"Trying {model}...", file=sys.stderr, flush=True)
            response = client.models.generate_content(
                model=model,
                contents=[gemini_file, prompt],
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            result = json.loads(response.text)
            print(f"Success with {model}!", file=sys.stderr, flush=True)
            break
        except Exception as e:
            print(f"Error with {model}: {e}", file=sys.stderr, flush=True)
            if '404' in str(e) or 'NOT_FOUND' in str(e):
                continue  # Try next model
            continue

    try:
        client.files.delete(name=gemini_file.name)
    except:
        pass

    print(json.dumps(result))

if __name__ == "__main__":
    main()
