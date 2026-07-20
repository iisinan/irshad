<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Financial;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImportNgxProfiles extends Command
{
    protected $signature   = 'ngx:import-profiles {--logos : Also fetch logos via Clearbit}';
    protected $description = 'Import scraped NGX company profiles from /tmp/ngx_profiles.json into the database';

    public function handle()
    {
        $jsonFile = '/tmp/ngx_profiles.json';

        if (!file_exists($jsonFile)) {
            $this->error("File not found: {$jsonFile}. Run the Python scraper first.");
            return Command::FAILURE;
        }

        $raw  = file_get_contents($jsonFile);
        $data = json_decode($raw, true);

        if (!$data) {
            $this->error("Failed to parse JSON from {$jsonFile}");
            return Command::FAILURE;
        }

        $total   = count($data);
        $ok      = 0;
        $skipped = 0;
        $errors  = 0;

        $this->info("Importing {$total} company profiles...");

        $batchSize = 20;
        $chunks    = array_chunk($data, $batchSize, true);

        foreach ($chunks as $chunkIdx => $chunk) {
            try {
                DB::reconnect();
                DB::beginTransaction();

                foreach ($chunk as $symbol => $info) {
                    if (!empty($info['error']) && empty($info['sector'])) {
                        $skipped++;
                        continue;
                    }

                    $company = Company::where('symbol', $symbol)->first();
                    if (!$company) {
                        $skipped++;
                        continue;
                    }

                    $sector    = $info['sector']   ?? '';
                    $industry  = $info['industry'] ?? '';
                    $marketCap = (float) ($info['market_cap'] ?? 0);
                    $website   = $info['website']  ?? '';

                    // Only update sector/industry if currently missing
                    $update = [];
                    if ($sector && (empty($company->sector) || $company->sector === 'Unknown')) {
                        $update['sector'] = $sector;
                    }
                    if ($industry && empty($company->industry)) {
                        $update['industry'] = $industry;
                    }
                    if ($website && empty($company->website)) {
                        $update['website'] = $website;
                    }
                    if (!empty($update)) {
                        $company->update($update);
                    }

                    // Upsert market cap into financials — include defaults for NOT NULL cols
                    if ($marketCap > 0) {
                        $existing = Financial::where('company_id', $company->id)->first();
                        if ($existing) {
                            // Just update market cap — don't overwrite real financial data
                            $existing->update(['market_cap' => $marketCap]);
                        } else {
                            // New record — must provide defaults for NOT NULL columns
                            Financial::create([
                                'company_id'      => $company->id,
                                'market_cap'      => $marketCap,
                                'total_assets'    => 0,
                                'total_debt'      => 0,
                                'total_revenue'   => 0,
                                'interest_income' => 0,
                            ]);
                        }
                    }

                    $ok++;
                }

                DB::commit();
                $this->line("  ✓ Chunk " . ($chunkIdx + 1) . " committed ({$ok} imported so far)");

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("  ✗ Chunk " . ($chunkIdx + 1) . " failed: " . $e->getMessage());
                $errors++;
            }
        }

        // Optionally fetch logos for companies that now have a website
        if ($this->option('logos')) {
            $this->info('');
            $this->info('Fetching logos via Clearbit...');
            $this->fetchLogos();
        }

        $this->info('');
        $this->info('════════════════════════════════════');
        $this->info("Import complete!");
        $this->info("  Imported : {$ok}");
        $this->info("  Skipped  : {$skipped}");
        $this->info("  Errors   : {$errors}");
        $this->info('════════════════════════════════════');

        return Command::SUCCESS;
    }

    private function fetchLogos(): void
    {
        $companies = Company::whereNotNull('website')
            ->where('website', '!=', '')
            ->whereNull('logo_url')
            ->get();

        $this->info("  " . $companies->count() . " companies with website but no logo.");

        foreach ($companies as $company) {
            try {
                $domain = parse_url($company->website, PHP_URL_HOST);
                if (!$domain) continue;

                $r = Http::withHeaders(['User-Agent' => 'Mozilla/5.0'])->timeout(8)
                    ->get("https://logo.clearbit.com/{$domain}");

                if ($r && $r->successful() && str_contains($r->header('Content-Type') ?? '', 'image')) {
                    $filename = 'logos/' . strtolower(trim($company->symbol)) . '.png';
                    Storage::disk('public')->put($filename, $r->body());
                    DB::reconnect();
                    $company->update(['logo_url' => '/storage/' . $filename]);
                    $this->line("  🖼  {$company->symbol} ({$domain})");
                } else {
                    $this->line("  — {$company->symbol}: no Clearbit logo");
                }

                usleep(400000);
            } catch (\Exception $e) {
                Log::warning("Logo fetch failed for {$company->symbol}: " . $e->getMessage());
            }
        }
    }
}
