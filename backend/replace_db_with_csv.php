<?php

require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\DB;

$tickersToReplace = [
    "ABCTRANS", "ACADEMY", "AIRTELAFRI", "ALEX", "ARADEL", "AUSTINLAZ", "BAPLC", "BERGER",
    "BUACEMENT", "BUAFOODS", "CADBURY", "CAP", "CAVERTON", "CHAMS", "CHELLARAM", "CONOIL",
    "CUTIX", "CWG", "DANGCEM", "DANGSUGAR", "EKOCORP", "ENAMELWA", "ETERNA", "ETRANZACT",
    "EUNISELL", "FIDSON", "FTNCOCOA", "GEREGU", "HBMNG", "HONYFLOUR", "IMG", "JAIZBANK",
    "JAPAULGOLD", "JBERGER", "JOHNHOLT", "JULI", "LEARNAFRCA", "LEGENDINT", "MAYBAKER",
    "MCNICHOLS", "MECURE", "MEYER", "MORISON", "MTNN", "MULTITREX", "MULTIVERSE", "NASCON",
    "NEIMETH", "NESTLE", "NNFM", "NREIT", "OANDO", "OKOMUOIL", "OMATEK", "PHARMDEKO",
    "PREMPAINTS", "PRESCO", "PZ", "REDSTAREX", "RONCHESS", "RTBRISCOE", "SCOA", "SEPLAT",
    "SKYAVN", "THOMASWY", "TIP", "TOTAL", "TRANSEXPR", "TRANSPOWER", "TRIPPLEG", "UACN",
    "UNILEVER", "UNIONDICON", "UPDC", "UPL", "VITAFOAM", "NAHCO", "LOTUSHAL15"
];

$csvFile = '/Users/sinan/Desktop/stocks_financial_data.csv';
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle);

$csvData = [];
while (($row = fgetcsv($handle)) !== false) {
    $data = array_combine($header, $row);
    if (in_array($data['Symbol'], $tickersToReplace)) {
        $csvData[$data['Symbol']] = $data;
    }
}
fclose($handle);

function parseVal($val) {
    if ($val === null || $val === '') return 0;
    return (float) str_replace(',', '', $val);
}

DB::beginTransaction();
try {
    app()->instance('verdict.unlock', true);

    foreach ($tickersToReplace as $symbol) {
        if (!isset($csvData[$symbol])) {
            continue;
        }

        $row = $csvData[$symbol];
        $company = Company::where('symbol', $symbol)->first();

        if (!$company) {
            continue;
        }

        // UPDATE MARKET CAP
        $company->market_cap = parseVal($row['Market Cap']);
        $company->save();

        // 1. Update Financials
        $financial = $company->financials()->latest()->first();
        if (!$financial) {
            $financial = new Financial();
            $financial->company_id = $company->id;
            $financial->year = date('Y');
            $financial->quarter = 'Q4';
        }
        $financial->total_assets = parseVal($row['Total Assets']);
        $financial->total_debt = parseVal($row['Total Debt']);
        $financial->cash_and_equivalents = parseVal($row['Cash']);
        $financial->interest_income = parseVal($row['Interest Income']);
        $financial->total_revenue = parseVal($row['Total Revenue']);
        $financial->save();

        // 2. Update AAOIFI Screening
        $aaoifi = $company->aaoifiScreening()->first();
        if (!$aaoifi) {
            $aaoifi = new AaoifiScreening();
            $aaoifi->company_id = $company->id;
        }
        // MULTIPLY BY 100 TO STORE AS PERCENTAGE IN DB
        $aaoifi->debt_ratio = parseVal($row['Debt Ratio']) * 100;
        $aaoifi->cash_ratio = parseVal($row['Cash Ratio']) * 100;
        $aaoifi->impermissible_income_ratio = parseVal($row['Impure Ratio']) * 100;
        
        $aaoifi->final_status = strtolower($row['Final Status']) === 'non-halal' ? 'non-compliant' : strtolower($row['Final Status']);
        $aaoifi->save();

        // 3. Update Company current_status
        $finalStatus = $aaoifi->final_status;
        $company->update(['current_status' => $finalStatus]);

        // 4. Update StockStatus
        $stockStatus = $company->status()->first();
        if (!$stockStatus) {
            $stockStatus = new StockStatus();
            $stockStatus->company_id = $company->id;
        }
        $stockStatus->status = $finalStatus;
        $stockStatus->reason = "Overwritten with CSV Data.";
        $stockStatus->save();

    }

    DB::commit();
    app()->instance('verdict.unlock', false);
    echo "Successfully replaced DB data with CSV data and market caps.\n";
} catch (\Exception $e) {
    DB::rollBack();
    app()->instance('verdict.unlock', false);
    echo "ERROR: " . $e->getMessage() . "\n";
}
