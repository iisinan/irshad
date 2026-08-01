import requests
import json
import os
import asyncio
from app.tools.pdf_extractor import PDFExtractor

async def main():
    headers = {'Referer': 'https://ngxpulse.ng/disclosures'}
    url = "https://ngxpulse.ng/api/ngxdata/disclosures?limit=50"
    print("Fetching disclosures...")
    response = requests.get(url, headers=headers)
    data = response.json().get("data", [])

    target_pdf_url = None
    target_symbol = None
    for item in data:
        if item.get("type") == "Financial Statements" and item.get("url"):
            target_pdf_url = item.get("url")
            target_symbol = item.get("symbol")
            break

    if not target_pdf_url:
        print("No Financial Statements found.")
        return

    print(f"Found Financial Statement for {target_symbol}: {target_pdf_url}")
    
    # Download PDF
    pdf_path = f"/tmp/{target_symbol}_financials.pdf"
    print(f"Downloading PDF to {pdf_path}...")
    pdf_response = requests.get(target_pdf_url)
    with open(pdf_path, 'wb') as f:
        f.write(pdf_response.content)

    print("Extracting via Gemini (PDFExtractor)...")
    extractor = PDFExtractor()
    result = await extractor.extract_financials(pdf_path, 2026)
    
    print("\n--- EXTRACTION RESULTS ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
