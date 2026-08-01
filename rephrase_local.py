import pandas as pd
import json

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)

def rephrase(text):
    text = str(text).strip()
    if not text or text.lower() == 'nan':
        return 'Business activity status is pending review.'
        
    original = text.lower()
    
    # Common fail reasons
    if 'conventional bank' in original:
        return "The company operates as a conventional bank engaged in interest-based lending and deposit-taking."
    if 'conventional insurance' in original or 'gharar' in original:
        return "The company operates in conventional insurance, which involves prohibited elements such as Riba and Gharar."
    if 'brewery' in original or 'alcohol' in original:
        return "The company is involved in the production or distribution of alcohol."
    if 'mortgage bank' in original:
        return "The company operates as a mortgage bank engaged in interest-based lending."
    if 'microfinance' in original:
        return "The company operates as a microfinance institution engaged in interest-based lending."
    
    # Specific edge cases
    if 'piggery' in original:
        return "The company's operations include prohibited activities such as pork production (piggery)."
    if 'corrected from' in original:
        text = text.split('.', 1)[-1].strip() # Remove the 'CORRECTED from...' prefix
        
    # General cleanup
    text = text.replace(' - permissible core activity', '. The core business activities are permissible')
    text = text.replace('- permissible core activity', '. The core business activities are permissible')
    text = text.replace('permissible core activity', 'The core business activities are permissible')
    
    # Ensure it ends with a period
    if not text.endswith('.'):
        text += '.'
        
    # Capitalize first letter properly
    return text[0].upper() + text[1:] if text else text

results = []

for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or ticker == 'nan' or ticker == 'Ticker':
        continue
        
    excel_status = str(row.iloc[2]).strip().lower()
    if excel_status == 'doubtful':
        excel_status = 'doubtful' 
    
    excel_rationale = str(row.iloc[3]).strip()
    rephrased = rephrase(excel_rationale)
    
    results.append({
        'ticker': ticker,
        'business_status': excel_status,
        'business_reasoning': rephrased
    })

with open('backend/rephrased_stage1.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done generating JSON.")
