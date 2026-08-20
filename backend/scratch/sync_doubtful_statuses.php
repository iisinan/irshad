<?php

$json = file_get_contents(__DIR__ . '/doubtful_data.json');
$data = json_decode($json, true);

foreach ($data as $row) {
    $symbol = $row['symbol'];
    $reason = $row['reason'];
    
    $company = \App\Models\Company::where('symbol', $symbol)->first();
    if (!$company) {
        continue;
    }
    
    $status = $company->status;
    if ($status && $status->status === 'doubtful') {
        $formattedReason = preg_replace('/[:;\.]?\s*(Concerns\s.*)/i', ' ||| $1', $reason);
        $status->reason = $formattedReason;
        $status->save();
        echo "Updated $symbol status reason.\n";
    }
}
