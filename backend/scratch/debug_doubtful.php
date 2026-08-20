<?php

$data = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/doubtful_data.json'), true);

foreach ($data as $row) {
    $symbol = $row['symbol'];
    
    // Find the company
    $company = App\Models\Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "$symbol: Company not found\n";
        continue;
    }
    
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if (!$screening) {
        echo "$symbol: No screening\n";
        continue;
    }
    
    echo "$symbol: " . $screening->final_status . "\n";
}
