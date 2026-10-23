<?php

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\ComplianceReview;
use App\Models\Financial;
use App\Models\StockStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations to stage and sync the latest October 2026 financial filings.
     */
    public function up(): void
    {
        $filings = [
            'TRANSPOWER' => [
                'company_status' => 'halal',
                'financial' => [
                    'reporting_period' => 'Q3',
                    'total_assets' => 629523953000.00,
                    'total_debt' => 73445052000.00,
                    'interest_income' => 2487824000.00,
                    'total_revenue' => 266140326000.00,
                    'cash_and_equivalents' => 10314271000.00,
                    'interest_bearing_securities' => 44244341000.00,
                    'interest_income_ratio' => 0.93,
                    'non_compliant_income_ratio' => 0.93,
                    'published_date' => '2026-10-20',
                    'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48128_TRANSCORP_POWER_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    'extraction_schema_version' => 'v1.0',
                ],
                'screening' => [
                    'business_status' => 'pass',
                    'business_reasoning' => [
                        'summary' => 'Permissible core activity in electric power generation.',
                        'details' => 'Permissible core activity in electric power generation.',
                    ],
                    'debt_ratio' => 5.5015,
                    'debt_status' => 'pass',
                    'cash_ratio' => 4.0868,
                    'cash_status' => 'pass',
                    'impermissible_income_ratio' => 0.9348,
                    'impermissible_income_status' => 'pass',
                    'final_status' => 'halal',
                    'financial_data_used' => [
                        'total_assets' => 629523953000.00,
                        'total_debt' => 73445052000.00,
                        'cash_and_equivalents' => 10314271000.00,
                        'interest_bearing_securities' => 44244341000.00,
                        'total_revenue' => 266140326000.00,
                        'interest_income' => 2487824000.00,
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48128_TRANSCORP_POWER_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    ],
                ],
                'review' => [
                    'status' => 'pending',
                    'new_status' => 'halal',
                    'reason' => 'Stock passes all screens. Status is Halal with an active dividend purification factor of 0.9348%. Notes: Permissible core activity in electric power generation.',
                    'payload' => [
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48128_TRANSCORP_POWER_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                        'debt_ratio' => 5.5015,
                        'cash_ratio' => 4.0868,
                        'purification_ratio' => 0.9348,
                    ],
                ],
            ],
            'TOTAL' => [
                'company_status' => 'non-compliant',
                'financial' => [
                    'reporting_period' => 'Q3',
                    'total_assets' => 426308495000.00,
                    'total_debt' => 198026723000.00,
                    'interest_income' => 1205937000.00,
                    'total_revenue' => 689849202000.00,
                    'cash_and_equivalents' => 135780517000.00,
                    'interest_bearing_securities' => 0.00,
                    'interest_income_ratio' => 0.17,
                    'non_compliant_income_ratio' => 0.17,
                    'published_date' => '2026-10-23',
                    'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48149_TOTALENERGIES_MARKETING_NIGERIA_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    'extraction_schema_version' => 'v1.0',
                ],
                'screening' => [
                    'business_status' => 'pass',
                    'business_reasoning' => [
                        'summary' => 'Permissible core activity in marketing of petroleum products.',
                        'details' => 'Permissible core activity in marketing of petroleum products.',
                    ],
                    'debt_ratio' => 46.4515,
                    'debt_status' => 'fail',
                    'cash_ratio' => 31.8504,
                    'cash_status' => 'pass',
                    'impermissible_income_ratio' => 0.1748,
                    'impermissible_income_status' => 'pass',
                    'final_status' => 'non-compliant',
                    'financial_data_used' => [
                        'total_assets' => 426308495000.00,
                        'total_debt' => 198026723000.00,
                        'cash_and_equivalents' => 135780517000.00,
                        'interest_bearing_securities' => 0.00,
                        'total_revenue' => 689849202000.00,
                        'interest_income' => 1205937000.00,
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48149_TOTALENERGIES_MARKETING_NIGERIA_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    ],
                ],
                'review' => [
                    'status' => 'pending',
                    'new_status' => 'non-compliant',
                    'reason' => 'Failed Rule 2: Debt Limit Check based on recent financial disclosure. Interest-bearing debt ratio is 46.4515% (Max permitted threshold is 30.00%).',
                    'payload' => [
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48149_TOTALENERGIES_MARKETING_NIGERIA_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                        'debt_ratio' => 46.4515,
                        'cash_ratio' => 31.8504,
                        'purification_ratio' => 0.1748,
                    ],
                ],
            ],
            'FTNCOCOA' => [
                'company_status' => 'non-compliant',
                'financial' => [
                    'reporting_period' => 'Q3',
                    'total_assets' => 23574664000.00,
                    'total_debt' => 17345638000.00,
                    'interest_income' => 0.00,
                    'total_revenue' => 0.00,
                    'cash_and_equivalents' => 1418146000.00,
                    'interest_bearing_securities' => 0.00,
                    'interest_income_ratio' => 0.00,
                    'non_compliant_income_ratio' => 0.00,
                    'published_date' => '2026-10-23',
                    'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48141_FTN_COCOA_PROCESSORS_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    'extraction_schema_version' => 'v1.0',
                ],
                'screening' => [
                    'business_status' => 'pass',
                    'business_reasoning' => [
                        'summary' => 'Permissible core activity in cocoa processing and agriculture.',
                        'details' => 'Permissible core activity in cocoa processing and agriculture.',
                    ],
                    'debt_ratio' => 73.5763,
                    'debt_status' => 'fail',
                    'cash_ratio' => 6.0156,
                    'cash_status' => 'pass',
                    'impermissible_income_ratio' => 0.0000,
                    'impermissible_income_status' => 'pass',
                    'final_status' => 'non-compliant',
                    'financial_data_used' => [
                        'total_assets' => 23574664000.00,
                        'total_debt' => 17345638000.00,
                        'cash_and_equivalents' => 1418146000.00,
                        'interest_bearing_securities' => 0.00,
                        'total_revenue' => 0.00,
                        'interest_income' => 0.00,
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48141_FTN_COCOA_PROCESSORS_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    ],
                ],
                'review' => [
                    'status' => 'pending',
                    'new_status' => 'non-compliant',
                    'reason' => 'Failed Rule 2: Debt Limit Check based on Q3 2026 financial disclosure. Interest-bearing debt ratio is 73.5763% (Max permitted threshold is 30.00%).',
                    'payload' => [
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48141_FTN_COCOA_PROCESSORS_PLC-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                        'debt_ratio' => 73.5763,
                        'cash_ratio' => 6.0156,
                        'purification_ratio' => 0.0,
                    ],
                ],
            ],
            'UNILEVER' => [
                'company_status' => 'halal',
                'financial' => [
                    'reporting_period' => 'Q3',
                    'total_assets' => 179387617000.00,
                    'total_debt' => 559938000.00,
                    'interest_income' => 6954201000.00,
                    'total_revenue' => 139593256000.00,
                    'cash_and_equivalents' => 26165581000.00,
                    'interest_bearing_securities' => 0.00,
                    'interest_income_ratio' => 4.98,
                    'non_compliant_income_ratio' => 4.98,
                    'published_date' => '2026-10-23',
                    'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48139_UNILEVER_NIGERIA_PLC.-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    'extraction_schema_version' => 'v1.0',
                ],
                'screening' => [
                    'business_status' => 'pass',
                    'business_reasoning' => [
                        'summary' => 'Permissible core activity in manufacturing and marketing of consumer goods (foods & refreshments, home care, beauty & personal care products).',
                        'details' => 'Permissible core activity in manufacturing and marketing of consumer goods (foods & refreshments, home care, beauty & personal care products).',
                    ],
                    'debt_ratio' => 0.3121,
                    'debt_status' => 'pass',
                    'cash_ratio' => 14.5861,
                    'cash_status' => 'pass',
                    'impermissible_income_ratio' => 4.9818,
                    'impermissible_income_status' => 'pass',
                    'final_status' => 'halal',
                    'financial_data_used' => [
                        'total_assets' => 179387617000.00,
                        'total_debt' => 559938000.00,
                        'cash_and_equivalents' => 26165581000.00,
                        'interest_bearing_securities' => 0.00,
                        'total_revenue' => 139593256000.00,
                        'interest_income' => 6954201000.00,
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48139_UNILEVER_NIGERIA_PLC.-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                    ],
                ],
                'review' => [
                    'status' => 'approved',
                    'new_status' => 'halal',
                    'reason' => 'Stock passes all screens. Status is Halal with an active dividend purification factor of 4.9818%. Notes: Permissible core activity in manufacturing and marketing of consumer goods (foods & refreshments, home care, beauty & personal care products).',
                    'payload' => [
                        'period' => 'Q3 2026',
                        'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/48139_UNILEVER_NIGERIA_PLC.-_QUARTER_3_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_OCTOBER_2026.pdf',
                        'debt_ratio' => 0.3121,
                        'cash_ratio' => 14.5861,
                        'purification_ratio' => 4.9818,
                    ],
                ],
            ],
        ];

        foreach ($filings as $symbol => $data) {
            $company = Company::where('symbol', $symbol)->first();
            if (! $company) {
                Log::warning("Migration: Company symbol {$symbol} not found. Skipping.");
                continue;
            }

            // 1. Update or create Financial record
            $finData = $data['financial'];
            $finData['company_id'] = $company->id;
            Financial::updateOrCreate(
                ['company_id' => $company->id, 'source_url' => $finData['source_url']],
                $finData
            );

            // 2. Update or create AAOIFI Screening record
            $scrData = $data['screening'];
            $scrData['company_id'] = $company->id;
            $scrData['business_reasoning'] = json_encode($scrData['business_reasoning']);
            $scrData['financial_data_used'] = json_encode($scrData['financial_data_used']);
            AaoifiScreening::updateOrCreate(
                ['company_id' => $company->id],
                $scrData
            );

            // 3. For UNILEVER (Approved): Update Company and StockStatus, create history
            if ($symbol === 'UNILEVER') {
                $company->update(['current_status' => 'halal']);
                StockStatus::updateOrCreate(
                    ['company_id' => $company->id],
                    [
                        'status' => 'halal',
                        'reason' => $data['review']['reason'],
                        'verified_by_scholar' => false,
                        'last_updated' => now(),
                    ]
                );

                ComplianceHistory::create([
                    'company_id' => $company->id,
                    'old_status' => 'unknown',
                    'new_status' => 'halal',
                    'reason' => $data['review']['reason'],
                    'changed_at' => now(),
                ]);

                // Create approved review
                ComplianceReview::updateOrCreate(
                    ['company_id' => $company->id, 'new_status' => 'halal', 'status' => 'approved'],
                    [
                        'old_status' => 'unknown',
                        'reason' => $data['review']['reason'],
                        'payload' => $data['review']['payload'],
                        'reviewed_at' => now(),
                    ]
                );
            } else {
                // 4. For TRANSPOWER, TOTAL, FTNCOCOA (Pending Admin Review):
                // Create or update pending review so it shows on Overview dashboard
                $existingReview = ComplianceReview::where('company_id', $company->id)
                    ->where('status', 'pending')
                    ->first();

                if ($existingReview) {
                    $existingReview->update([
                        'new_status' => $data['review']['new_status'],
                        'reason' => $data['review']['reason'],
                        'payload' => $data['review']['payload'],
                        'updated_at' => now(),
                    ]);
                } else {
                    ComplianceReview::create([
                        'company_id' => $company->id,
                        'old_status' => $company->current_status ?? 'unknown',
                        'new_status' => $data['review']['new_status'],
                        'reason' => $data['review']['reason'],
                        'status' => 'pending',
                        'payload' => $data['review']['payload'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Flush all application caches
        try {
            Artisan::call('cache:clear');
            Cache::flush();
            try { Cache::tags(['stocks'])->flush(); } catch (\Throwable $e) {}
            try { Cache::tags(['aaoifi'])->flush(); } catch (\Throwable $e) {}
        } catch (\Throwable $e) {
            Log::info('Migration cache flush note: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op
    }
};
