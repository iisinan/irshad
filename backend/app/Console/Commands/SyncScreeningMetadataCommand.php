<?php

namespace App\Console\Commands;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\Financial;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class SyncScreeningMetadataCommand extends Command
{
    protected $signature = 'irshad:sync-screening-metadata {--symbol= : Specific stock symbol to sync}';

    protected $description = 'Synchronize published_date, reporting_period, and reporting_year across all screenings and financials';

    public function handle(): int
    {
        $symbol = $this->option('symbol');
        $query = Company::with(['aaoifiScreening', 'financials' => function ($q) {
            $q->orderBy('id', 'desc');
        }]);

        if ($symbol) {
            $query->where('symbol', strtoupper($symbol));
        }

        $companies = $query->get();
        $this->info("Scanning {$companies->count()} companies for screening metadata synchronization...");

        $updatedCount = 0;

        foreach ($companies as $company) {
            $screening = $company->aaoifiScreening;
            if (!$screening) {
                continue;
            }

            $financial = $company->financials->first();
            $finData = is_string($screening->financial_data_used)
                ? json_decode($screening->financial_data_used, true)
                : ($screening->financial_data_used ?? []);

            $changed = false;

            // 1. Published Date
            $bestPublishedDate = null;
            if ($financial && !empty($financial->published_date)) {
                $bestPublishedDate = Carbon::parse($financial->published_date)->toDateString();
            } elseif (!empty($finData['published_date'])) {
                $bestPublishedDate = Carbon::parse($finData['published_date'])->toDateString();
            } elseif (!empty($screening->published_date)) {
                $bestPublishedDate = Carbon::parse($screening->published_date)->toDateString();
            }

            if ($bestPublishedDate) {
                $currentScreeningDate = $screening->published_date ? Carbon::parse($screening->published_date)->toDateString() : null;
                if ($currentScreeningDate !== $bestPublishedDate) {
                    $screening->published_date = $bestPublishedDate;
                    $finData['published_date'] = $bestPublishedDate;
                    $changed = true;
                }
                if ($financial && (empty($financial->published_date) || Carbon::parse($financial->published_date)->toDateString() !== $bestPublishedDate)) {
                    $financial->published_date = $bestPublishedDate;
                    $financial->save();
                }
            }

            // 2. Reporting Period
            $bestPeriod = null;
            if ($financial && !empty($financial->reporting_period)) {
                $bestPeriod = $financial->reporting_period;
            } elseif (!empty($finData['reporting_period'])) {
                $bestPeriod = $finData['reporting_period'];
            } elseif (!empty($screening->reporting_period)) {
                $bestPeriod = $screening->reporting_period;
            }

            if ($bestPeriod) {
                if (preg_match('/^(Q[1-4]|H[1-2]|FY|9M)/i', $bestPeriod, $pMatches)) {
                    $cleanPeriod = strtoupper($pMatches[1]);
                } else {
                    $cleanPeriod = $bestPeriod;
                }

                if ($screening->reporting_period !== $cleanPeriod) {
                    $screening->reporting_period = $cleanPeriod;
                    $finData['reporting_period'] = $cleanPeriod;
                    $changed = true;
                }
                if ($financial && $financial->reporting_period !== $cleanPeriod) {
                    $financial->reporting_period = $cleanPeriod;
                    $financial->save();
                }
            }

            // 3. Reporting Year
            $bestYear = null;
            if (!empty($screening->reporting_year)) {
                $bestYear = (int) $screening->reporting_year;
            } elseif (!empty($finData['financial_year'])) {
                $bestYear = (int) $finData['financial_year'];
            } elseif ($bestPeriod && preg_match('/20\d{2}/', $bestPeriod, $yMatches)) {
                $bestYear = (int) $yMatches[0];
            } elseif ($bestPublishedDate && preg_match('/^(20\d{2})/', $bestPublishedDate, $yMatches)) {
                $bestYear = (int) $yMatches[1];
            } else {
                $bestYear = 2026;
            }

            if ($bestYear && (int)$screening->reporting_year !== (int)$bestYear) {
                $screening->reporting_year = $bestYear;
                $finData['financial_year'] = $bestYear;
                $changed = true;
            }

            // 4. Source URL
            $bestSourceUrl = null;
            if ($financial && !empty($financial->source_url)) {
                $bestSourceUrl = $financial->source_url;
            } elseif (!empty($finData['source_url'])) {
                $bestSourceUrl = $finData['source_url'];
            }

            if ($bestSourceUrl) {
                if (($finData['source_url'] ?? null) !== $bestSourceUrl) {
                    $finData['source_url'] = $bestSourceUrl;
                    $changed = true;
                }
                if ($financial && empty($financial->source_url)) {
                    $financial->source_url = $bestSourceUrl;
                    $financial->save();
                }
            }

            if ($changed) {
                $screening->financial_data_used = json_encode($finData);
                $screening->save();
                $updatedCount++;
                $this->line("  [UPDATED] {$company->symbol}: Period={$screening->reporting_period}, Year={$screening->reporting_year}, Published={$screening->published_date}");
            }
        }

        Cache::flush();
        $this->info("\nSuccessfully synchronized {$updatedCount} companies. Application cache flushed.");

        return self::SUCCESS;
    }
}
