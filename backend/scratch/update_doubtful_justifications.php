<?php

$data = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/doubtful_data.json'), true);

foreach ($data as $row) {
    $symbol = $row['symbol'];
    $reason = $row['reason'];
    
    // Find the company
    $company = App\Models\Company::where('symbol', $symbol)->first();
    if (!$company) {
        continue;
    }
    
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening && $screening->final_status === 'doubtful') {
        // Format reason by replacing optional punctuation + "Concerns" with " ||| Concerns"
        $formattedReason = preg_replace('/[:;\.]?\s*(Concerns\s.*)/i', ' ||| $1', $reason);
        
        $reasonObj = json_decode($screening->business_reasoning, true);
        if (!$reasonObj) {
            $reasonObj = [];
        }
        $reasonObj['summary'] = $formattedReason;
        
        $screening->business_reasoning = json_encode($reasonObj);
        $screening->save();
        echo "Updated $symbol\n";
    }
}
