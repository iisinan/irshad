<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Company;

class CrossCheckData extends Command
{
    protected $signature = 'irshad:cross-check';
    protected $description = 'Cross check Excel data with DB and generate report';

    public function handle()
    {
        $jsonFile = base_path('excel_dump.json');
        if (!file_exists($jsonFile)) {
            $this->error("JSON dump file not found.");
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonFile), true);

        $report = "# Data Comparison Report: Excel vs DB\n\n";
        $report .= "This report compares the Business Activity status from your uploaded Excel file against the AI Engine's extraction in our database.\n\n";

        $report .= "## 1. Discrepancies (Conflict in Status)\n";
        $report .= "| Ticker | Excel Status | Our DB Status | Action Required |\n";
        $report .= "|---|---|---|---|\n";

        $discrepancies = [];
        $missingInDb = [];
        $missingDataToUpdate = [];
        $matches = [];
        $updatesCount = 0;

        $companies = DB::table('companies')->get()->keyBy('symbol');
        $allBus = DB::table('business_screenings')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('ticker');

        foreach ($jsonData as $row) {
            // Find the keys dynamically or use the known ones
            $tickerKey = "NGX Listed Companies — Shariah (Halal) Business-Activity Screen";
            if (!isset($row[$tickerKey])) {
                // Try fallback keys if Pandas changed something
                $keys = array_keys($row);
                $tickerKey = $keys[0];
            }
            
            $ticker = isset($row[$tickerKey]) ? trim($row[$tickerKey]) : null;
            $excelStatus = isset($row['Unnamed: 2']) ? strtoupper(trim($row['Unnamed: 2'])) : null;
            $rationale = isset($row['Unnamed: 3']) ? trim($row['Unnamed: 3']) : null;

            if (empty($ticker) || $ticker === 'Ticker' || $excelStatus === null) continue;

            $company = $companies->get($ticker);
            if (!$company) {
                $missingInDb[] = $ticker;
                continue;
            }

            $companyBusScreenings = $allBus->get($ticker);
            $bus = $companyBusScreenings ? $companyBusScreenings->last() : null;
            
            $ourStatus = 'MISSING/INSUFFICIENT_DATA';
            if ($bus) {
                if ($bus->business_compliance_status === 'Compliant') {
                    $ourStatus = 'PASS';
                } elseif ($bus->business_compliance_status === 'Non-Compliant') {
                    $ourStatus = 'FAIL';
                } else {
                    $ourStatus = 'REVIEW';
                }
            }

            if ($ourStatus === 'MISSING/INSUFFICIENT_DATA') {
                $missingDataToUpdate[] = [
                    'ticker' => $ticker,
                    'excel_status' => $excelStatus,
                    'rationale' => $rationale
                ];
                
                // BACKFILL DATA AS REQUESTED BY USER
                $mappedStatus = 'Warning';
                if ($excelStatus === 'PASS') $mappedStatus = 'Compliant';
                if ($excelStatus === 'FAIL') $mappedStatus = 'Non-Compliant';
                
                DB::table('business_screenings')->insert([
                    'company_id' => $company->id,
                    'ticker' => $ticker,
                    'business_compliance_status' => $mappedStatus,
                    'ai_explanation' => "Imported from Shariah Screen Excel: " . $rationale,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $updatesCount++;
                
            } elseif ($ourStatus !== $excelStatus) {
                if ($excelStatus === 'REVIEW' && $ourStatus === 'PASS') {
                    $discrepancies[] = "| **{$ticker}** | {$excelStatus} | {$ourStatus} | Review needed (Excel says Review, AI says Pass) |";
                } elseif ($excelStatus === 'FAIL' && $ourStatus === 'PASS') {
                    $discrepancies[] = "| **{$ticker}** | {$excelStatus} | {$ourStatus} | **CRITICAL: Excel says FAIL, AI says PASS** |";
                } elseif ($excelStatus === 'PASS' && $ourStatus === 'FAIL') {
                    $discrepancies[] = "| **{$ticker}** | {$excelStatus} | {$ourStatus} | **CRITICAL: Excel says PASS, AI says FAIL** |";
                } else {
                    $discrepancies[] = "| **{$ticker}** | {$excelStatus} | {$ourStatus} | General Mismatch |";
                }
            } else {
                $matches[] = $ticker;
            }
        }

        if (empty($discrepancies)) {
            $report .= "| No major conflicts found | | | |\n";
        } else {
            $report .= implode("\n", $discrepancies) . "\n";
        }

        $report .= "\n## 2. Missing Data Backfilled\n";
        $report .= "These companies had `insufficient_data` for Business Activity in our DB. As requested, we have seamlessly backfilled their records using the Excel data.\n\n";
        $report .= "| Ticker | Excel Status | Rationale Injected |\n";
        $report .= "|---|---|---|\n";
        if (empty($missingDataToUpdate)) {
            $report .= "| None | | |\n";
        } else {
            foreach ($missingDataToUpdate as $item) {
                $report .= "| {$item['ticker']} | {$item['excel_status']} | " . substr($item['rationale'], 0, 50) . "... |\n";
            }
        }

        $report .= "\n## 3. Stocks in Excel NOT found in our Database\n";
        if (empty($missingInDb)) {
            $report .= "None. All Excel tickers exist in our database.\n";
        } else {
            $report .= implode(", ", $missingInDb) . "\n";
        }

        $report .= "\n## Summary\n";
        $report .= "- **Exact Matches:** " . count($matches) . " companies\n";
        $report .= "- **Conflicts:** " . count($discrepancies) . " companies\n";
        $report .= "- **Data Injected (Backfilled):** {$updatesCount} records\n";

        file_put_contents('/Users/sinan/.gemini/antigravity/brain/85d90a85-ae79-4d59-a374-9860b7a4679d/data_comparison_report.md', $report);
        $this->info("Report generated successfully!");
    }
}
