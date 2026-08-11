import pandas as pd
import re
import json

df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', sheet_name='Doubtful Stocks')
updates = {}
for index, row in df.iterrows():
    if 'DOUBTFUL' in str(row.values):
        symbol = str(row.iloc[0]).strip()
        rationale = str(row.iloc[3]).strip()
        
        # Split off the last sentence
        match = re.search(r'(.*?)(Concerns with.*|This is a .* concern\.|This raises concerns.*|thus constituent weights raise concerns.*|but concerns with.*|so concerns are with.*|concerns are with.*)$', rationale, re.IGNORECASE | re.DOTALL)
        
        if match:
            main_text = match.group(1).strip()
            tag_text = match.group(2).strip()
            
            # Remove trailing dashes or spaces
            main_text = re.sub(r'[-\s;]+$', '', main_text).strip()
            
            # Very basic grammar/typo fixes ONLY
            main_text = main_text.replace('buisness', 'business')
            main_text = main_text.replace('jutification', 'justification')
            
            # Edge cases for split fixing
            if symbol == 'TANTALIZER':
                main_text += " create ambiguity."
                tag_text = "Concerns with revenue source mix."
                
            updates[symbol] = f"{main_text} ||| {tag_text}"
        else:
            updates[symbol] = rationale

# Add NAHCO manually from All Stocks, preserving exact wording
nahco_excel = "Core aviation ground/cargo/passenger handling and logistics lines (NAHCO FTZ, Commodities, Logistics, Power Solutions, Aviation Academy) are clean fee-for-service businesses. However, NAHCO Travel and Hospitality Limited (NHTL) now directly operates Sapphire Hotel, a 20-room in-terminal hotel at MMIA Terminal II (opened Feb 2026), with an on-site restaurant/lounge. No alcohol service confirmed either way in public disclosures - amenities described (breakfast, lunch/dinner, business office, gym, prayer area) suggest a business-transit orientation, but F&B/bar revenue at the hotel needs direct confirmation before treating as fully clean. Not comparable to Ikeja Hotel (no casino/nightclub indicated)."
updates['NAHCO'] = f"{nahco_excel} ||| Concerns with revenue source mix."

php_code = f"""<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

use App\\Models\\Company;
use App\\Models\\StockStatus;
use Illuminate\\Support\\Facades\\DB;

$json = {json.dumps(json.dumps(updates))};
$updates = json_decode($json, true);

foreach ($updates as $symbol => $new_reason) {{
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {{
        $statusRecord = StockStatus::where('company_id', $company->id)->first();
        if ($statusRecord) {{
            $statusRecord->reason = $new_reason;
            $statusRecord->save();
            echo "Updated reason for $symbol\\n";
        }}
    }}
}}
echo "Done updating reasons\\n";
"""

with open('scratch/update_doubtful_exact_grammar.php', 'w') as f:
    f.write(php_code)
