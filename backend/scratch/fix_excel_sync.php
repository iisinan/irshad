<?php
$file = '/Users/sinan/Herd/irshad/backend/app/Console/Commands/SyncExcelStage1Command.php';
$content = file_get_contents($file);

$replacement = <<<'PHP'
            $tag = 'Requires Further Review';
            $mainText = $reasoning;
            
            if ($status === 'doubtful') {
                if (preg_match('/(Concerns with.*?|This is a disclosed.*?|raises concerns.*?|This raises concerns.*?|thus constituent weights raise concerns.*?|but concerns with regards.*?|so concerns are with regards.*?|concerns are with regards.*?)$/i', $reasoning, $matches)) {
                    $tag = trim($matches[1]);
                    $mainText = trim(str_replace($matches[1], '', $reasoning));
                }
                $mainText = rtrim($mainText, '. -');
                $reasoning = $mainText . '. ||| ' . $tag;
                
                // Also update stock_statuses reason if it exists
                $stockStatus = \App\Models\StockStatus::where('company_id', $company->id)->first();
                if ($stockStatus && $stockStatus->verified_by_scholar) {
                    $stockStatus->reason = 'Scholar Override: ' . $reasoning;
                    $stockStatus->save();
                }
            }

            $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
            $screening->business_status = $status;
            $screening->business_reasoning = json_encode(['summary' => $reasoning]);
PHP;

$content = str_replace(
    '$screening = AaoifiScreening::firstOrNew([\'company_id\' => $company->id]);
            $screening->business_status = $status;
            $screening->business_reasoning = $reasoning;',
    $replacement,
    $content
);

file_put_contents($file, $content);
echo "Updated SyncExcelStage1Command.php\n";
