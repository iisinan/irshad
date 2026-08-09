<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$db_companies = \App\Models\Company::all(['symbol', 'current_status'])->keyBy('symbol')->toArray();
$excel_data = json_decode(file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/all_excel.json'), true);

$discrepancies = [];

foreach ($excel_data as $row) {
    $symbol = strtoupper($row['Ticker'] ?? '');
    if (empty($symbol)) continue;
    
    if (!isset($db_companies[$symbol])) {
        // missing in DB entirely? Maybe we skip this for now or record it
        continue;
    }
    
    $db_status = strtolower(trim($db_companies[$symbol]['current_status'] ?? 'pending'));
    
    $biz_status = strtolower(trim($row['Business Activity Screen'] ?? ''));
    $fin_status = strtolower(trim($row['Financial Screen'] ?? ''));
    
    // Derived excel status based on strict rules:
    $excel_derived = 'pending';
    if ($biz_status === 'fail' || $fin_status === 'fail') {
        $excel_derived = 'non-halal';
    } elseif ($biz_status === 'doubtful' || $fin_status === 'doubtful') {
        $excel_derived = 'doubtful';
    } elseif ($biz_status === 'pass' && $fin_status === 'pass') {
        $excel_derived = 'halal';
    } elseif ($biz_status === 'pass' && (str_contains($fin_status, 'needs data') || $fin_status === '')) {
        $excel_derived = 'pending';
    }
    
    // We already know from OANDO/CONOIL that DB might have 'non-halal' while excel has 'pending' (Needs data). 
    // Let's record mismatches where excel and db disagree, especially if Excel is PASS/FAIL/DOUBTFUL and DB is something else.
    
    if ($db_status !== $excel_derived) {
        $discrepancies[] = [
            'symbol' => $symbol,
            'db_status' => $db_status,
            'excel_derived' => $excel_derived,
            'excel_biz' => $row['Business Activity Screen'] ?? '',
            'excel_fin' => $row['Financial Screen'] ?? ''
        ];
    }
}

echo json_encode($discrepancies, JSON_PRETTY_PRINT);

