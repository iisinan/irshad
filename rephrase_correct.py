import pandas as pd
import json
import re

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)
results = []

def clean_text(text):
    text = str(text).strip()
    if not text or text.lower() == 'nan':
        return "No justification provided."
    
    # Simple dictionary for common phrases to make them full sentences
    mappings = {
        "conventional bank - interest-based lending/deposits (riba).": "The company operates as a conventional bank engaging in interest-based lending and deposits, which constitutes Riba.",
        "conventional insurance - riba/gharar in contract structure.": "The company operates as a conventional insurance provider, which contains structural elements of Riba and Gharar.",
        "transport/logistics services - permissible core activity.": "The company provides transport and logistics services, which is a permissible core activity.",
        "education services - permissible core activity.": "The company provides education services, which is a permissible core activity.",
        "building materials/manufacturing - permissible core activity.": "The company is engaged in building materials and manufacturing, which is a permissible core activity.",
        "fmcg/food - permissible core activity.": "The company is engaged in the fast-moving consumer goods (FMCG) and food sector, which is a permissible core activity.",
        "oil & gas (downstream) - permissible core activity.": "The company operates in the downstream oil and gas sector, which is a permissible core activity.",
        "real estate/property - permissible core activity.": "The company operates in the real estate and property sector, which is a permissible core activity.",
        "agriculture/plantation - permissible core activity.": "The company is engaged in agriculture and plantation operations, which is a permissible core activity.",
        "ict/software - permissible core activity.": "The company operates in the Information and Communication Technology (ICT) and software sector, which is a permissible core activity.",
        "healthcare/pharmaceuticals - permissible core activity.": "The company operates in the healthcare and pharmaceutical sector, which is a permissible core activity.",
        "aviation/handling - permissible core activity.": "The company provides aviation and handling services, which is a permissible core activity.",
        "hotel/hospitality - check alcohol/pork revenue share.": "The company operates in the hospitality sector; further verification is required regarding the revenue share from non-permissible sources such as alcohol or pork.",
        "outdoor advertising/media - check client mix (alcohol/betting ad revenue share).": "The company is involved in outdoor advertising and media; further verification of its client mix is required to ensure revenue from non-permissible ads (e.g., alcohol or betting) does not exceed limits.",
        "financial services (holding co) - mixed subsidiaries. check overall non-permissible revenue share.": "The company is a financial services holding company with mixed subsidiaries. A detailed review is required to ensure the overall non-permissible revenue share remains within acceptable limits."
    }
    
    lower_text = text.lower()
    if lower_text in mappings:
        return mappings[lower_text]
        
    # General cleanup for things not in the exact map
    if "conventional bank" in lower_text:
        return "The company operates as a conventional bank engaging in interest-based lending and deposits, which constitutes Riba."
    if "conventional insurance" in lower_text:
        return "The company operates as a conventional insurance provider, which contains structural elements of Riba and Gharar."
    
    # Capitalize first letter, ensure ends with period
    cleaned = text[0].upper() + text[1:]
    if not cleaned.endswith('.'):
        cleaned += '.'
        
    return cleaned

for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or ticker == 'nan' or ticker == 'Ticker':
        continue
        
    excel_status = str(row.iloc[2]).strip().lower()
    if excel_status == 'doubtful':
        excel_status = 'doubtful'
    
    raw_rationale = row.iloc[3]
    rephrased = clean_text(raw_rationale)

    results.append({
        'ticker': ticker,
        'business_status': excel_status,
        'business_reasoning': rephrased
    })

with open('backend/rephrased_stage1_correct.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done. Wrote to backend/rephrased_stage1_correct.json")
