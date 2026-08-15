<?php
$csvPath = '/Users/sinan/Herd/irshad/backend/scratch/stocks_financial_data.csv';
$fh = fopen($csvPath, 'r');

// read header
fgetcsv($fh);

$data = [];

while (($row = fgetcsv($fh)) !== false) {
    if (count($row) < 5) continue;
    $symbol = $row[0];
    $status = $row[3];
    $reason = $row[4];
    
    // We want companies that failed business screening
    // Actually, any company that has a non-permissible reason.
    // The user provided the image with 64 companies.
    // I can just read the scratch/db_status.json for the failed ones.
    $dbStatus = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/db_status.json'), true);
    $failed = $dbStatus['failed_business'];
    
    if (in_array($symbol, $failed)) {
        $data[$symbol] = $reason;
    }
}
fclose($fh);

file_put_contents('/Users/sinan/Herd/irshad/backend/scratch/fails_csv_reasoning.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Extracted reasoning from CSV for " . count($data) . " companies.\n";
