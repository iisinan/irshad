<?php

require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\DB;

$csvFile = './stocks_financial_data.csv';
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle);

function parseVal($val) {
    if ($val === null || $val === '') return 0;
    return (float) str_replace(',', '', $val);
}

try {
    app()->instance('verdict.unlock', true);

    Company::unsetEventDispatcher();
    Financial::unsetEventDispatcher();
    AaoifiScreening::unsetEventDispatcher();
    StockStatus::unsetEventDispatcher();

    $count = 0;
    while (($row = fgetcsv($handle)) !== false) {
        $data = array_combine($header, $row);
        $symbol = $data['Symbol'];
        
        $company = Company::where('symbol', $symbol)->first();
        if (!$company) {
            echo "Skipping $symbol (not found)\n";
            continue;
        }

        echo "Updating $symbol...\n";

        // UPDATE COMPANY
        $company->market_cap = parseVal($data['Market Cap']);
        $company->save();

        // 1. Update Financials
        $financial = $company->financials()->latest()->first();
        if (!$financial) {
            $financial = new Financial();
            $financial->company_id = $company->id;
            $financial->reporting_period = 'Q2 2026';
        }
        $financial->total_assets = parseVal($data['Total Assets']);
        $financial->total_debt = parseVal($data['Total Debt']);
        $financial->cash_and_equivalents = parseVal($data['Cash']);
        $financial->interest_income = parseVal($data['Interest Income']);
        $financial->total_revenue = parseVal($data['Total Revenue']);
        $financial->save();

        // 2. Update AAOIFI Screening
        $aaoifi = $company->aaoifiScreening()->first();
        if (!$aaoifi) {
            $aaoifi = new AaoifiScreening();
            $aaoifi->company_id = $company->id;
        }
        // MULTIPLY BY 100 TO STORE AS PERCENTAGE IN DB
        $aaoifi->debt_ratio = parseVal($data['Debt Ratio']) * 100;
        $aaoifi->cash_ratio = parseVal($data['Cash Ratio']) * 100;
        $aaoifi->impermissible_income_ratio = parseVal($data['Impure Ratio']) * 100;
        
        $finalStatus = strtolower($data['Final Status']) === 'non-halal' ? 'non-compliant' : strtolower($data['Final Status']);
        $aaoifi->final_status = $finalStatus;
        $aaoifi->save();

        // 3. Update Company current_status
        $company->update(['current_status' => $finalStatus]);

        // 4. Update StockStatus
        $stockStatus = $company->status()->first();
        if (!$stockStatus) {
            $stockStatus = new StockStatus();
            $stockStatus->company_id = $company->id;
        }
        $stockStatus->status = $finalStatus;
        $stockStatus->reason = $data['Business Reasoning / Justification'];
        $stockStatus->save();

        $count++;
    }
    fclose($handle);

    app()->instance('verdict.unlock', false);
    echo "Successfully updated $count companies from CSV.\n";
} catch (\Throwable $e) {
    app()->instance('verdict.unlock', false);
    echo "ERROR: " . $e->getMessage() . "\n";
}
