<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DataAuditCommand extends Command
{
    protected $signature = 'data:audit';
    protected $description = 'Audit data completeness';

    public function handle()
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*)                                                                          AS total,
                COUNT(logo_url)                                                                   AS logos,
                COUNT(NULLIF(TRIM(overview), ''))                                                 AS overviews,
                COUNT(NULLIF(TRIM(description), ''))                                              AS descriptions,
                COUNT(CASE WHEN sector IS NOT NULL AND sector NOT IN ('', 'Unknown') THEN 1 END)  AS sectors,
                COUNT(CASE WHEN industry IS NOT NULL AND industry NOT IN ('', 'Unknown') THEN 1 END) AS industries,
                COUNT(CASE WHEN latest_price > 0 THEN 1 END)                                     AS prices,
                COUNT(CASE WHEN market_cap > 0   THEN 1 END)                                     AS market_caps,
                COUNT(NULLIF(pe_ratio::TEXT, ''))                                                 AS pe_ratios,
                COUNT(NULLIF(div_yield::TEXT, ''))                                                AS div_yields
            FROM companies
        ");

        // is_active column only exists after migration runs
        $active = $inactive = '(pending migration)';
        try {
            $activeRow = DB::selectOne("SELECT COUNT(CASE WHEN is_active = true THEN 1 END) AS active, COUNT(CASE WHEN is_active = false THEN 1 END) AS inactive FROM companies");
            $active   = (int) $activeRow->active;
            $inactive = (int) $activeRow->inactive;
        } catch (\Exception $e) {
            // migration not yet run
        }

        $financialsRow = DB::selectOne("
            SELECT
                COUNT(DISTINCT company_id)                                                        AS has_financials,
                COUNT(DISTINCT CASE WHEN roe IS NOT NULL THEN company_id END)                    AS has_roe,
                COUNT(DISTINCT CASE WHEN pe_ratio IS NOT NULL THEN company_id END)               AS has_pe,
                COUNT(DISTINCT CASE WHEN dividend_yield IS NOT NULL THEN company_id END)         AS has_dividend_yield,
                COUNT(DISTINCT CASE WHEN total_assets > 0 THEN company_id END)                  AS has_total_assets
            FROM financials
        ");

        $aaoifiRow = DB::selectOne("
            SELECT COUNT(DISTINCT company_id) AS has_aaoifi FROM aaoifi_screenings
        ");

        $total = (int) $row->total;

        $metrics = [
            ['Logos',              $row->logos,                   $total],
            ['Overviews',          $row->overviews,               $total],
            ['Descriptions',       $row->descriptions,            $total],
            ['Sectors',            $row->sectors,                 $total],
            ['Industries',         $row->industries,              $total],
            ['Live Prices',        $row->prices,                  $total],
            ['Market Cap',         $row->market_caps,             $total],
            ['P/E Ratio (company)',$row->pe_ratios,               $total],
            ['Div Yield (company)',$row->div_yields,              $total],
            ['Financials record',  $financialsRow->has_financials,$total],
            ['ROE',                $financialsRow->has_roe,       $total],
            ['P/E (financials)',   $financialsRow->has_pe,        $total],
            ['Dividend Yield',     $financialsRow->has_dividend_yield, $total],
            ['Total Assets',       $financialsRow->has_total_assets,   $total],
            ['AAOIFI Screened',    $aaoifiRow->has_aaoifi,        $total],
            ['Active (priced)',    $active,                       $total],
            ['Inactive/Hidden',    $inactive,                     $total],
        ];

        $this->info("=================================================================");
        $this->info("  IRSHAD STOCK DATA AUDIT — Total Companies: {$total}");
        $this->info("=================================================================");
        $this->line(str_pad('Metric', 22) . ' | ' . str_pad('Has', 5) . ' | ' . str_pad('Missing', 7) . ' | Coverage');
        $this->line(str_repeat('-', 60));

        foreach ($metrics as [$label, $count, $tot]) {
            $count   = (int) $count;
            $missing = $tot - $count;
            $pct     = $tot > 0 ? round(($count / $tot) * 100, 1) : 0;
            $bar     = str_repeat('█', (int) ($pct / 5)) . str_repeat('░', 20 - (int) ($pct / 5));
            $this->line(
                str_pad($label, 22) . ' | '
                . str_pad($count, 5) . ' | '
                . str_pad($missing, 7) . ' | '
                . "{$pct}%  {$bar}"
            );
        }

        $this->info("=================================================================");
    }
}
