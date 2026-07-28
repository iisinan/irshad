<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Stock;

class CompareExcelRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:compare-excel-records';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Compare Excel sheet to DB records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $json = file_get_contents(base_path('scratch/output.json'));
        $data = json_decode($json, true);
        $records = $data['NGX Screen'] ?? [];

        $discrepancies = [];
        $missingInDb = [];
        $matched = 0;

        foreach ($records as $index => $row) {
            if ($index < 2) continue;

            $ticker = $row['NGX Listed Companies — Shariah (Halal) Business-Activity Screen'] ?? null;
            if (!$ticker) continue;

            $statusText = $row['__EMPTY_1'] ?? null;
            if (!$statusText) continue;

            $excelIsHalal = strtoupper($statusText) === 'PASS';

            $company = \App\Models\Company::with('status')->where('symbol', $ticker)->first();

            if (!$company) {
                $missingInDb[] = $ticker;
                continue;
            }
            
            $dbStatus = $company->status ? $company->status->status : 'Unknown';
            $dbIsHalal = strtolower($dbStatus) === 'halal';

            if ($dbIsHalal !== $excelIsHalal) {
                $discrepancies[] = [
                    'ticker' => $ticker,
                    'db_halal' => $dbIsHalal,
                    'excel_halal' => $excelIsHalal,
                    'excel_rationale' => $row['__EMPTY_2'] ?? '',
                    'db_rationale' => $company->status ? $company->status->reason : '',
                ];
            } else {
                $matched++;
            }
        }

        $this->info("Matched records: $matched");
        
        if (count($missingInDb) > 0) {
            $this->warn("Missing in DB: " . implode(', ', $missingInDb));
        }

        if (count($discrepancies) > 0) {
            $this->error("Discrepancies found: " . count($discrepancies));
            
            $markdown = "# Excel vs Database Discrepancies\n\n";
            $markdown .= "| Ticker | DB Status | Excel Status | Excel Rationale | DB Rationale |\n";
            $markdown .= "|---|---|---|---|---|\n";
            foreach ($discrepancies as $d) {
                $dbHalal = $d['db_halal'] ? 'Pass' : 'Fail';
                $excelHalal = $d['excel_halal'] ? 'Pass' : 'Fail';
                $markdown .= "| {$d['ticker']} | $dbHalal | $excelHalal | {$d['excel_rationale']} | {$d['db_rationale']} |\n";
            }

            file_put_contents(base_path('scratch/discrepancies.md'), $markdown);
            $this->info("Discrepancies written to scratch/discrepancies.md");
        } else {
            $this->info("No discrepancies found!");
        }
    }
}
