import pandas as pd
import json
import time
import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.environ.get("GEMINI_API_KEY")

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)
results = []

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
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts":[{"text": prompt}]}]
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
            response.raise_for_status()
            data = response.json()
            rephrased = data['candidates'][0]['content']['parts'][0]['text'].strip()
            break
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                time.sleep(10) # wait extra time on 429
                if attempt == max_retries - 1:
                    rephrased = excel_rationale
                    print(f"Failed after retries for {ticker}")
            else:
                print(f"Error for {ticker}: {e}")
                rephrased = excel_rationale
                break
        except Exception as e:
            print(f"Error for {ticker}: {e}")
            rephrased = excel_rationale
            break
        
    results.append({
        'ticker': ticker,
        'business_status': excel_status,
        'business_reasoning': rephrased
    })
    
    time.sleep(4.5)
    print(f"Processed {ticker}")

with open('backend/rephrased_stage1.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done.")
