<?php
/**
 * correct_financial_data.php
 * Overwrites incorrect financial records with Quadratic-verified FY2024 data (absolute NGN).
 * Then re-computes AAOIFI ratios for each corrected stock.
 * Run: php scripts/correct_financial_data.php
 */
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Models\AaoifiScreening;

// -------------------------------------------------------------------
// Quadratic-verified FY2024 figures (absolute NGN)
// interest_income = null means not separately disclosed (set to 0)
// company_type = "bank" | "standard" for AAOIFI debt classification
// -------------------------------------------------------------------
$verified = [
    'DANGCEM' => [
        'name'             => 'Dangote Cement PLC',
        'total_revenue'    => 3_580_600_000_000,
        'total_debt'       => 745_115_000_000,
        'interest_income'  => 0,                  // not disclosed
        'cash'             => 449_831_000_000,
        'market_cap'       => 17_670_000_000_000,
        'total_assets'     => null,               // derive later if needed
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'MTNN' => [
        'name'             => 'MTN Nigeria Communications PLC',
        'total_revenue'    => 3_360_000_000_000,
        'total_debt'       => 972_920_000_000,
        'interest_income'  => 23_304_000_000,
        'cash'             => 303_680_000_000,
        'market_cap'       => 17_500_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'GTCO' => [
        'name'             => 'Guaranty Trust Holding Company PLC',
        'total_revenue'    => 1_670_000_000_000,
        'total_debt'       => 40_200_000_000,
        'interest_income'  => 0,                  // not disclosed separately
        'cash'             => 6_160_000_000_000,
        'market_cap'       => 4_720_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'ZENITHBANK' => [
        'name'             => 'Zenith Bank PLC',
        'total_revenue'    => 2_210_000_000_000,
        'total_debt'       => 554_070_000_000,
        'interest_income'  => 1_730_000_000_000,
        'cash'             => 3_770_000_000_000,
        'market_cap'       => 4_840_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'SEPLAT' => [
        'name'             => 'Seplat Petroleum Development Company PLC',
        'total_revenue'    => 1_729_800_000_000,  // USD converted @1550
        'total_debt'       => 1_391_900_000_000,
        'interest_income'  => 6_200_000_000,
        'cash'             => 932_402_500_000,
        'market_cap'       => 6_820_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'BUACEMENT' => [
        'name'             => 'BUA Cement PLC',
        'total_revenue'    => 876_470_000_000,
        'total_debt'       => 502_010_000_000,
        'interest_income'  => 18_190_000_000,
        'cash'             => 404_050_000_000,
        'market_cap'       => 9_330_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'NESTLE' => [
        'name'             => 'Nestlé Nigeria PLC',
        'total_revenue'    => 979_200_000_000,
        'total_debt'       => 693_574_000_000,
        'interest_income'  => 0,
        'cash'             => 107_358_000_000,
        'market_cap'       => 2_480_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'ACCESS' => [  // ACCESSCORP stored as ACCESS
        'name'             => 'Access Holdings PLC',
        'total_revenue'    => 4_878_000_000_000,
        'total_debt'       => 3_260_000_000_000,
        'interest_income'  => 3_480_000_000_000,
        'cash'             => 5_221_000_000_000,
        'market_cap'       => 1_400_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'UBA' => [
        'name'             => 'United Bank for Africa PLC',
        'total_revenue'    => 1_850_000_000_000,
        'total_debt'       => 1_050_000_000_000,
        'interest_income'  => 0,
        'cash'             => 5_350_000_000_000,
        'market_cap'       => 2_080_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'FBNH' => [  // FIRSTHOLDCO stored as FBNH
        'name'             => 'FBN Holdings PLC',
        'total_revenue'    => 3_330_000_000_000,
        'total_debt'       => 1_802_520_000_000,
        'interest_income'  => 1_391_000_000_000,
        'cash'             => 3_489_197_000_000,
        'market_cap'       => 4_770_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'STANBIC' => [
        'name'             => 'Stanbic IBTC Holdings PLC',
        'total_revenue'    => 547_490_000_000,
        'total_debt'       => 727_150_000_000,
        'interest_income'  => 0,
        'cash'             => 4_050_000_000_000,
        'market_cap'       => 2_590_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'bank',
        'period'           => 'FY2024',
    ],
    'WAPCO' => [
        'name'             => 'Lafarge Africa PLC',
        'total_revenue'    => 696_760_000_000,
        'total_debt'       => 3_496_886_000,
        'interest_income'  => 629_008_000,
        'cash'             => 226_344_316_000,
        'market_cap'       => 5_430_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'UACN' => [
        'name'             => 'UAC of Nigeria PLC',
        'total_revenue'    => 475_690_000_000,
        'total_debt'       => 346_730_000_000,
        'interest_income'  => 0,
        'cash'             => 77_560_000_000,
        'market_cap'       => 585_080_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'TTM',
    ],
    'TRANSCORP' => [
        'name'             => 'Transnational Corporation of Nigeria PLC',
        'total_revenue'    => 407_920_000_000,
        'total_debt'       => 75_570_000_000,
        'interest_income'  => 0,
        'cash'             => 31_420_000_000,
        'market_cap'       => 433_410_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'AIRTELAFRI' => [
        'name'             => 'Airtel Africa PLC',
        'total_revenue'    => 7_750_000_000_000,
        'total_debt'       => 9_574_200_000_000,
        'interest_income'  => 0,
        'cash'             => 1_275_575_000_000,
        'market_cap'       => 21_800_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'GEREGU' => [
        'name'             => 'Geregu Power PLC',
        'total_revenue'    => 137_130_000_000,
        'total_debt'       => 58_680_000_000,
        'interest_income'  => 8_540_000_000,
        'cash'             => 29_370_000_000,
        'market_cap'       => 2_875_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'BUAFOODS' => [
        'name'             => 'BUA Foods PLC',
        'total_revenue'    => 1_530_000_000_000,
        'total_debt'       => 377_800_500_000,
        'interest_income'  => 10_197_473_000,
        'cash'             => 31_310_000_000,
        'market_cap'       => 16_900_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'OKOMUOIL' => [
        'name'             => 'Okomu Oil Palm PLC',
        'total_revenue'    => 130_680_000_000,
        'total_debt'       => 24_900_000_000,
        'interest_income'  => 0,
        'cash'             => 31_830_000_000,
        'market_cap'       => 1_350_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
    'PRESCO' => [
        'name'             => 'Presco PLC',
        'total_revenue'    => 207_500_000_000,
        'total_debt'       => 138_860_000_000,
        'interest_income'  => 0,
        'cash'             => 136_540_000_000,
        'market_cap'       => 2_680_000_000_000,
        'total_assets'     => null,
        'company_type'     => 'standard',
        'period'           => 'FY2024',
    ],
];

// AAOIFI thresholds
const DEBT_THRESHOLD   = 0.30;
const INCOME_THRESHOLD = 0.05;
const CASH_THRESHOLD   = 0.33;

function aaoifiStatus(float $ratio, float $threshold, bool $mustBeBelow = true): string {
    return ($mustBeBelow ? $ratio < $threshold : $ratio > $threshold) ? 'pass' : 'fail';
}

$corrected = 0;
$added     = 0;
$skipped   = 0;

foreach ($verified as $symbol => $data) {
    $company = Company::where('symbol', $symbol)->first();

    if (!$company) {
        // Try to create if missing
        $company = Company::create([
            'symbol'       => $symbol,
            'name'         => $data['name'],
            'sector'       => 'Unknown',
            'description'  => $data['name'] . ' is a publicly listed company on the Nigerian Exchange (NGX).',
            'latest_price' => 0,
            'current_status' => 'pending',
        ]);
        echo "  [NEW]  Created company $symbol\n";
        $added++;
    }

    // Update market cap on company row
    if ($data['market_cap']) {
        $company->market_cap = $data['market_cap'];
        $company->save();
    }

    // Upsert financial record
    $financial = Financial::where('company_id', $company->id)->first()
        ?? new Financial(['company_id' => $company->id]);

    $financial->total_revenue   = $data['total_revenue'];
    $financial->total_debt      = $data['total_debt'];
    $financial->interest_income = $data['interest_income'];
    $financial->cash_and_equivalents = $data['cash'];
    $financial->market_cap      = $data['market_cap'];
    $financial->reporting_period = $data['period'];
    $financial->save();

    // Re-compute AAOIFI ratios
    $mcap    = $data['market_cap'] ?? 1;
    $rev     = $data['total_revenue'];
    $debt    = $data['total_debt'];
    $income  = $data['interest_income'];
    $cash    = $data['cash'];

    // For banks: debt ratio uses borrowings vs total assets (not customer deposits vs market cap)
    // Since we don't have total_assets in Quadratic data for most, we use market cap as denominator
    // but cap the bank debt ratio at market_cap denominator like standard AAOIFI
    $debtRatio   = $mcap > 0 ? round($debt / $mcap, 6) : 0;
    $incomeRatio = $rev  > 0 ? round($income / $rev, 6) : 0;
    $cashRatio   = $mcap > 0 ? round($cash / $mcap, 6) : 0;

    $debtStatus   = aaoifiStatus($debtRatio, DEBT_THRESHOLD);
    $incomeStatus = aaoifiStatus($incomeRatio, INCOME_THRESHOLD);
    $cashStatus   = aaoifiStatus($cashRatio, CASH_THRESHOLD);

    // Banks always fail income screen (interest-based business)
    if ($data['company_type'] === 'bank') {
        $incomeStatus = 'fail';
        $incomeRatio  = 1.0; // representative: 100% interest-based
    }

    $finalPass = ($debtStatus === 'pass' && $incomeStatus === 'pass' && $cashStatus === 'pass');
    $finalStatus = $finalPass ? 'halal' : 'non-halal';

    // Upsert AAOIFI screening
    $aaoifi = AaoifiScreening::where('company_id', $company->id)->first()
        ?? new AaoifiScreening(['company_id' => $company->id]);

    // Only set business fields when creating a brand-new record (not-null constraint)
    if (!$aaoifi->exists) {
        $isBank = $data['company_type'] === 'bank';
        $aaoifi->business_status = $isBank ? 'fail' : 'pass';
        $aaoifi->business_reasoning = [
            'source'            => 'Quadratic HQ verified FY2024',
            'principal_business'=> $data['name'],
            'confidence_score'  => 80,
            'reasoning'         => $isBank
                ? 'Conventional bank/financial institution — core business involves interest (riba). Business screen fails under AAOIFI Standard No. 21.'
                : 'No prohibited business activity identified based on available data.',
        ];
    }

    $aaoifi->debt_ratio                  = round($debtRatio * 100, 4);
    $aaoifi->debt_status                 = $debtStatus;
    $aaoifi->impermissible_income_ratio  = round($incomeRatio * 100, 4);
    $aaoifi->impermissible_income_status = $incomeStatus;
    $aaoifi->cash_ratio                  = round($cashRatio * 100, 4);
    $aaoifi->cash_status                 = $cashStatus;
    $aaoifi->final_status                = $finalStatus;
    $aaoifi->financial_data_used         = [
        'source'          => 'Quadratic HQ verified FY2024',
        'market_cap'      => $mcap,
        'total_revenue'   => $rev,
        'total_debt'      => $debt,
        'interest_income' => $income,
        'cash'            => $cash,
        'company_type'    => $data['company_type'],
    ];
    $aaoifi->save();

    // Update company status
    $company->current_status = $finalStatus;
    $company->save();

    $corrected++;
    $verdict = strtoupper($finalStatus);
    echo "  [OK]   $symbol → debt={$debtStatus} income={$incomeStatus} cash={$cashStatus} → $verdict\n";
}

echo "\n✅ Done! Corrected: $corrected | New companies added: $added | Skipped: $skipped\n";
