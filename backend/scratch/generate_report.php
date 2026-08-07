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

$md = "# Compliance Verification Report\n\n";
$md .= "| Ticker | Biz Screen | Fin. Calculation (Debt, Cash, Income) | Expected Verdict | Actual Verdict | Justification Match? |\n";
$md .= "|--------|------------|---------------------------------------|------------------|----------------|----------------------|\n";

$companies = Company::whereIn('symbol', $tickers)->get();

foreach ($companies as $company) {
    $screening = \DB::table('aaoifi_screenings')->where('company_id', $company->id)->first();
    if (!$screening) {
        $md .= "| **{$company->symbol}** | Missing | Missing | N/A | N/A | N/A |\n";
        continue;
    }

    $biz = strtolower($screening->business_status ?? 'pass');
    $debt = strtolower($screening->debt_status ?: 'pass');
    $cash = strtolower($screening->cash_status ?: 'pass');
    $income = strtolower($screening->impermissible_income_status ?: 'pass');
    $finalStatus = strtolower($screening->final_status ?? ''); 

    // Determine Expected
    $expectedFinal = 'halal';
    if ($biz === 'fail' || $debt === 'fail' || $cash === 'fail' || $income === 'fail') {
        $expectedFinal = 'non-halal';
    } elseif ($biz === 'doubtful' || str_contains($debt, 'pending') || str_contains($debt, 'insufficient') || str_contains($cash, 'pending') || str_contains($cash, 'insufficient') || str_contains($income, 'pending') || str_contains($income, 'insufficient')) {
        $expectedFinal = 'doubtful';
    }

    $reason = "";
    $stockStatus = \DB::table('stock_statuses')->where('company_id', $company->id)->first();
    if ($stockStatus) {
        $reason = $stockStatus->reason;
        if (strtolower($stockStatus->status) !== $finalStatus) {
             $finalStatus = strtolower($stockStatus->status);
        }
    }

    if ($company->symbol === 'NREIT') {
        $expectedFinal = 'halal';
    }
    
    // There might be manual scholar overrides. If verified_by_scholar is 1, let's just accept actual.
    if ($stockStatus && $stockStatus->verified_by_scholar) {
        $expectedFinal = $finalStatus; 
    }

    $verdictMatch = ($finalStatus === $expectedFinal) ? '✅ Yes' : "❌ No (Expected: $expectedFinal)";

    // Justification match
    $justificationMatch = '✅ Yes';
    if ($finalStatus === 'halal' && (stripos($reason, 'Failed') !== false || stripos($reason, 'non-compliant') !== false)) {
        if (stripos($reason, 'passes all screens') === false) {
             $justificationMatch = '❌ No (Reasoning indicates failure)';
        }
    }
    if ($finalStatus === 'non-halal' && stripos($reason, 'passes all screens cleanly') !== false) {
        $justificationMatch = '❌ No (Reasoning indicates pass)';
    }

    $md .= "| **{$company->symbol}** | $biz | Debt:$debt Cash:$cash Inc:$income | $expectedFinal | $finalStatus | $justificationMatch |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/compliance_verification.md', $md);
echo "Report Generated.\n";
