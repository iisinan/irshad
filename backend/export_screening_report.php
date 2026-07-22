<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$screenedCompanyIds = AaoifiScreening::pluck('company_id')->unique()->toArray();
$companiesMissingScreening = Company::whereNotIn('id', $screenedCompanyIds)->get(['symbol', 'name', 'sector']);

$missingOutput = "### Stocks Missing AAOIFI Screening (" . $companiesMissingScreening->count() . ")\n";
$missingOutput .= "| Symbol | Name | Sector |\n|---|---|---|\n";
foreach ($companiesMissingScreening as $c) {
    $missingOutput .= "| {$c->symbol} | {$c->name} | {$c->sector} |\n";
}

$screenings = AaoifiScreening::with('company:id,symbol,name')->get();

$screeningsOutput = "### AAOIFI AI Business Activity Analysis (" . $screenings->count() . ")\n";
$screeningsOutput .= "This table shows the AI's breakdown of the primary business activities for screened stocks.\n\n";
$screeningsOutput .= "| Symbol | Business Status | Principal Activities | Prohibited Activities | Reasoning |\n|---|---|---|---|---|\n";

foreach ($screenings as $s) {
    $c = $s->company;
    $symbol = $c ? $c->symbol : 'Unknown';
    $reasoningObj = $s->business_reasoning;
    
    $principal = "N/A";
    $prohibited = "N/A";
    $reasoningTxt = "N/A";
    
    if (is_string($reasoningObj)) {
        $reasoningObj = json_decode($reasoningObj, true);
    }
    
    if (is_array($reasoningObj)) {
        $principal = $reasoningObj['principal_activities'] ?? 'N/A';
        if (is_array($principal)) $principal = implode(', ', $principal);
        
        $prohibited = $reasoningObj['prohibited_activities'] ?? 'N/A';
        if (is_array($prohibited)) $prohibited = implode(', ', $prohibited);
        if (empty($prohibited)) $prohibited = 'None';
        
        $reasoningTxt = $reasoningObj['reasoning'] ?? 'N/A';
    }
    
    if (strlen($reasoningTxt) > 200) {
        $reasoningTxt = substr($reasoningTxt, 0, 197) . '...';
    }
    
    // clean up newlines for markdown table
    $principal = str_replace("\n", " ", $principal);
    $prohibited = str_replace("\n", " ", $prohibited);
    $reasoningTxt = str_replace("\n", " ", $reasoningTxt);
    
    $screeningsOutput .= "| {$symbol} | {$s->business_status} | {$principal} | {$prohibited} | {$reasoningTxt} |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/85d90a85-ae79-4d59-a374-9860b7a4679d/aaoifi_data_report.md', $missingOutput . "\n\n" . $screeningsOutput);
echo "Report generated at aaoifi_data_report.md\n";
