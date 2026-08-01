import pandas as pd
import json

df = pd.read_excel('/Users/sinan/Downloads/NGX_Shariah_Screen_all.xlsx', header=2)
results = []

for idx, row in df.iterrows():
    ticker = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or ticker == 'nan' or ticker == 'Ticker':
        continue
        
    excel_status = str(row.iloc[2]).strip().lower()
    if excel_status == 'doubtful':
        excel_status = 'doubtful'
    
    raw_rationale = str(row.iloc[3]).strip()
    
    # Clean up and rephrase
    rephrased = raw_rationale
    lower_rat = raw_rationale.lower()
    
    if not raw_rationale or raw_rationale == 'nan':
        rephrased = "No rationale provided."
    elif "conventional bank" in lower_rat and "riba" in lower_rat:
        rephrased = "The company operates as a conventional bank, engaging in interest-based lending and deposits which are not permissible."
    elif "conventional insurance" in lower_rat:
        rephrased = "The company operates as a conventional insurance provider, which involves structural elements of Riba and Gharar."
    elif "piggery" in lower_rat and "zichis" in lower_rat:
        rephrased = "Although core activities are permissible, the company's stated business lines include swine farming, which is categorically excluded. Further verification of revenue materiality is required, alongside governance risks related to recent stock investigations."
    elif "doubtful revenue" in lower_rat or "non-permissible" in lower_rat:
        rephrased = "The company's revenue from non-permissible or doubtful activities exceeds the acceptable 5% threshold."
    elif "core activity permissible" in lower_rat or "halal" in lower_rat:
        rephrased = "The company's core business operations are permissible and compliant with Shariah guidelines."
    elif "alcohol" in lower_rat or "brewery" in lower_rat:
        rephrased = "The company's core activities involve the production or distribution of alcohol, which is strictly prohibited."
    else:
        # Generic capitalization and cleanup for any remaining
        sentences = [s.strip().capitalize() for s in raw_rationale.split('.') if s.strip()]
        if sentences:
            rephrased = '. '.join(sentences) + '.'

    results.append({
        'ticker': ticker,
        'business_status': excel_status,
        'business_reasoning': rephrased
    })

with open('backend/rephrased_stage1_clean.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Done. Wrote to backend/rephrased_stage1_clean.json")
