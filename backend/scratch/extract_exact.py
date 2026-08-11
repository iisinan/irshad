import pandas as pd
import re

df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='Doubtful Stocks')
updates = {}
for index, row in df.iterrows():
    if 'DOUBTFUL' in str(row.values):
        symbol = str(row.iloc[0]).strip()
        rationale = str(row.iloc[3]).strip()
        
        # Split off the last sentence that starts with "Concerns", "This is", "This raises", "thus constituent", "but concerns", "so concerns"
        match = re.search(r'(.*?)(Concerns with.*|This is a .* concern\.|This raises concerns.*|thus constituent weights raise concerns.*|but concerns with.*|so concerns are with.*)$', rationale, re.IGNORECASE | re.DOTALL)
        
        if match:
            main_text = match.group(1).strip()
            tag_text = match.group(2).strip()
            
            # Clean up trailing dashes or spaces
            main_text = re.sub(r'[-\s]+$', '', main_text)
            
            # Basic grammar fixes
            main_text = main_text.replace('buisness', 'business')
            main_text = main_text.replace('jutification', 'justification')
            
            updates[symbol] = f"{main_text} ||| {tag_text}"
        else:
            updates[symbol] = rationale

import json
print(json.dumps(updates, indent=4))
