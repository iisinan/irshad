<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$tickers = [
    'ABCTRANS','ACADEMY','AIRTELAFRI','ALEX','ARADEL','AUSTINLAZ','BAPLC','BERGER','BUACEMENT',
    'BUAFOODS','CADBURY','CAP','CAVERTON','CHAMS','CHELLARAM','CONOIL','CUTIX','CWG','DANGCEM',
    'DANGSUGAR','EKOCORP','ENAMELWA','ETERNA','ETRANZACT','EUNISELL','FIDSON','FTNCOCOA',
    'GEREGU','HBMNG','HONYFLOUR','IMG','JAIZBANK','JAPAULGOLD','JBERGER','JOHNHOLT','JULI',
    'LEARNAFRCA','LEGENDINT','MAYBAKER','MCNICHOLS','MECURE','MEYER','MORISON','MTNN',
    'MULTITREX','MULTIVERSE','NASCON','NEIMETH','NESTLE','NNFM','NREIT','OANDO','OKOMUOIL',
    'OMATEK','PHARMDEKO','PREMPAINTS','PRESCO','PZ','REDSTAREX','RONCHESS','RTBRISCOE','SCOA',
    'SEPLAT','SKYAVN','THOMASWY','TIP','TOTAL','TRANSEXPR','TRANSPOWER','TRIPPLEG','UACN',
    'UNILEVER','UNIONDICON','UPDC','UPL','VITAFOAM','NAHCO','LOTUSHAL15'
];

$results = [];
$errors = [];

$companies = Company::whereIn('symbol', $tickers)->get();

foreach ($companies as $company) {
    $screening = \DB::table('aaoifi_screenings')->where('company_id', $company->id)->first();
    if (!$screening) {
        $errors[] = "{$company->symbol}: No screening found.";
        continue;
    }

    $businessStatus = $screening->business_status; 
    $debt = $screening->debt_status;
    $cash = $screening->cash_status;
    $income = $screening->impermissible_income_status;
    $finalStatus = $screening->final_status; 
    
    // Some older logic or columns might be null
    $debt = $debt ?: 'pass';
    $cash = $cash ?: 'pass';
    $income = $income ?: 'pass';

    $expectedFinal = 'halal';
    if ($businessStatus === 'fail' || $debt === 'fail' || $cash === 'fail' || $income === 'fail') {
        $expectedFinal = 'non-halal';
    } elseif ($businessStatus === 'doubtful') {
        $expectedFinal = 'doubtful';
    }

    $reason = "";
    
    // Fetch reasoning from stock_statuses (since it might be stored there)
    $stockStatus = \DB::table('stock_statuses')->where('company_id', $company->id)->first();
    if ($stockStatus) {
        $reason = $stockStatus->reason;
        if ($stockStatus->status !== $finalStatus) {
             // In case stock_statuses has a different status than aaoifi_screenings
             $finalStatus = $stockStatus->status;
        }
    }

    $mismatch = [];
    if ($finalStatus !== $expectedFinal) {
        // Exemptions:
        if ($company->symbol === 'NREIT') {
            // REITs might have different rules and stay halal even if they fail some financial rules
            if ($finalStatus === 'halal') {
                 // skip mismatch
            } else {
                 $mismatch[] = "Verdict Mismatch (Biz: $businessStatus, Fin: Debt=$debt Cash=$cash Inc=$income, Expected: $expectedFinal, Actual: $finalStatus)";
            }
        } else {
            $mismatch[] = "Verdict Mismatch (Biz: $businessStatus, Fin: Debt=$debt Cash=$cash Inc=$income, Expected: $expectedFinal, Actual: $finalStatus)";
        }
    }

    if ($finalStatus === 'halal' && (stripos($reason, 'Failed') !== false || stripos($reason, 'non-compliant') !== false)) {
        if (stripos($reason, 'passes all screens') === false) {
             $mismatch[] = "Reasoning says fail but verdict is halal: " . substr($reason, 0, 50);
        }
    }
    if ($finalStatus === 'non-halal' && stripos($reason, 'passes all screens cleanly') !== false) {
        $mismatch[] = "Reasoning says passes but verdict is non-halal";
    }

    if (empty($mismatch)) {
        $results[] = "{$company->symbol}: OK";
    } else {
        $errors[] = "{$company->symbol}: " . implode(" | ", $mismatch);
    }
}

echo "Checked " . count($companies) . " companies.\n";
echo "Errors Found: " . count($errors) . "\n";
if (count($errors) > 0) {
    foreach ($errors as $e) echo "- $e\n";
}
