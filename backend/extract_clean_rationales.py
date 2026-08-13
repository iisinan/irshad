import pandas as pd
import google.generativeai as genai
import os
import json
import time

# Configure Gemini
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not set.")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

# Load Excel
excel_path = "/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx"
df = pd.read_excel(excel_path, header=3)

# Filter for FAIL
failed_stocks = df[df['Business Activity Screen'] == 'FAIL']

print(f"Found {len(failed_stocks)} stocks that failed the business activity screen.")

prompt_template = """
You are a professional financial editor. Please clean the following text.
Remove any typographical errors, fix grammar, and remove unwanted or weird punctuation. 
Do not change the core meaning or the facts. Just make it read professionally as a justification summary for why a stock failed a Shariah compliance screen.
Output ONLY the cleaned text, without quotes or conversational filler.

Text to clean:
{text}
"""

results = {}

for index, row in failed_stocks.iterrows():
    ticker = row['Ticker']
    rationale = row['Rationale']
    
    if pd.isna(ticker) or pd.isna(rationale):
        continue
        
    ticker = str(ticker).strip()
    rationale = str(rationale).strip()
    
    if not rationale:
        continue
        
    print(f"Processing {ticker}...")
    
    retries = 3
    cleaned_text = rationale
    for i in range(retries):
        try:
            response = model.generate_content(prompt_template.format(text=rationale))
            cleaned_text = response.text.strip()
            # Basic sanity check
            if len(cleaned_text) < 10:
                raise Exception("Response too short")
            break
        except Exception as e:
            print(f"  Attempt {i+1} failed: {e}")
            time.sleep(2)
            
    results[ticker] = cleaned_text

output_path = "/Users/sinan/Herd/irshad/backend/cleaned_rationales.json"
with open(output_path, "w") as f:
    json.dump(results, f, indent=4)
    
print(f"Successfully processed {len(results)} rationales and saved to {output_path}")
