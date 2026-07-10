import sys
import json
import re
import io
import requests
from pypdf import PdfReader

def clean_number(num_str):
    """Clean a string representation of a number and convert to float."""
    try:
        num_str = re.sub(r'[,\s]', '', num_str)
        if '(' in num_str and ')' in num_str:
            num_str = '-' + num_str.replace('(', '').replace(')', '')
        return float(num_str)
    except ValueError:
        return 0.0

def extract_financials(pdf_url):
    result = {
        "total_assets": 0.0,
        "total_debt": 0.0,
        "total_revenue": 0.0,
        "interest_income": 0.0,
        "status": "success",
        "error": None
    }
    
    try:
        response = requests.get(pdf_url, timeout=30, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        
        pdf_file = io.BytesIO(response.content)
        reader = PdfReader(pdf_file)
        
        pages_to_scan = min(15, len(reader.pages))
        full_text = ""
        for i in range(pages_to_scan):
            text = reader.pages[i].extract_text()
            if text:
                full_text += text + "\n"
                
        lines = full_text.split('\n')
        
        for line in lines:
            line_lower = line.lower()
            numbers = re.findall(r'-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\(\d{1,3}(?:,\d{3})*(?:\.\d+)?\)', line)
            
            if numbers:
                first_num_str = numbers[0] 
                val = clean_number(first_num_str)
                
                if "total assets" in line_lower and result["total_assets"] == 0:
                    result["total_assets"] = val
                elif ("total debt" in line_lower or "borrowings" in line_lower or "total liabilities" in line_lower) and result["total_debt"] == 0:
                    result["total_debt"] = val
                elif ("revenue" in line_lower or "turnover" in line_lower) and result["total_revenue"] == 0:
                    result["total_revenue"] = val
                elif ("interest income" in line_lower or "finance income" in line_lower) and result["interest_income"] == 0:
                    result["interest_income"] = val

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No PDF URL provided"}))
        sys.exit(1)
        
    pdf_url = sys.argv[1]
    data = extract_financials(pdf_url)
    print(json.dumps(data))
