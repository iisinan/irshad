import pandas as pd
import json
import time
import os
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError

load_dotenv('backend/.env')
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)
results = []
output_file = 'backend/rephrased_stage1.json'

print("Starting to process...")
for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or ticker == 'nan' or ticker == 'Ticker':
        continue
        
    excel_status = str(row.iloc[2]).strip().lower()
    if excel_status == 'doubtful':
        excel_status = 'doubtful'
    
    excel_rationale = str(row.iloc[3]).strip()
    if not excel_rationale or excel_rationale == 'nan':
        excel_rationale = "No rationale provided."
    
    prompt = f"""
    Rewrite the following business activity justification for a stock's Shariah compliance into clear, professional, and grammatically correct English. 
    It should sound like an objective financial report. Do not add any new information. Keep it concise (1-2 sentences).
    
    Original text: {excel_rationale}
    
    Rewritten text:
    """
    
    rephrased = excel_rationale
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        rephrased = response.text.strip()
    except Exception as e:
        print(f"Error for {ticker}: {e}")
        # fallback to basic
        
    results.append({
        'ticker': ticker,
        'business_status': excel_status,
        'business_reasoning': rephrased
    })
    
    # write incrementally
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
        
    time.sleep(4)
    print(f"Processed {ticker}")

print("Done.")
