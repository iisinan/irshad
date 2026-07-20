<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Financial;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

/**
 * Scrapes NGX Group company profile pages to populate:
 *   - sector, industry (sub-sector), market_cap, shares_outstanding
 *   - website → logo via Clearbit
 *   - nature_of_business, date_listed
 *
 * URL format: https://ngxgroup.com/exchange/data/company-profile/?symbol=SYMBOL&directory=companydirectory
 */
class ScrapeNgxProfiles extends Command
{
    protected $signature   = 'ngx:scrape-profiles {--batch=10 : Companies per batch} {--logos : Fetch logos too} {--skip-existing : Skip companies that already have sector data}';
    protected $description = 'Scrape NGX company profile pages for sector, market cap, industry, website and logos';

    public function handle()
    {
        $batchSize    = (int) $this->option('batch');
        $fetchLogos   = $this->option('logos');
        $skipExisting = $this->option('skip-existing');

        $query = Company::query();
        if ($skipExisting) {
            $query->where(function ($q) {
                $q->whereNull('sector')->orWhere('sector', '')->orWhere('sector', 'Unknown');
            });
        }

        $companies = $query->get();
        $total     = $companies->count();
        $this->info("Scraping NGX profiles for {$total} companies...");

        $batches   = $companies->chunk($batchSize);
        $done      = 0;
        $errors    = 0;

        foreach ($batches as $bIdx => $batch) {
            $batchNum = $bIdx + 1;
            $this->info("--- Batch {$batchNum} / " . $batches->count() . " ---");

            $scraped = [];

            // ── Scrape each profile page ──
            foreach ($batch as $company) {
                try {
                    $data = $this->scrapeProfile($company->symbol);
                    $scraped[] = ['company' => $company, 'data' => $data];

                    if ($data) {
                        $this->line("  ✓ {$company->symbol} — {$data['sector']} / {$data['industry']} | MCap: " . number_format($data['market_cap'] / 1e9, 1) . 'B');
                    } else {
                        $this->line("  — {$company->symbol} (no data returned)");
                    }
                } catch (Exception $e) {
                    $this->warn("  ✗ {$company->symbol}: " . $e->getMessage());
                    $errors++;
                }

                usleep(500000); // 500ms between profile page requests to be polite
            }

            // ── Commit batch to DB ──
            try {
                DB::reconnect();
                DB::beginTransaction();

                foreach ($scraped as $item) {
                    $company = $item['company'];
                    $data    = $item['data'];

                    if (!$data) continue;

                    // Update Company row
                    $companyUpdate = [];
                    if (!empty($data['sector']))   $companyUpdate['sector']   = $data['sector'];
                    if (!empty($data['industry']))  $companyUpdate['industry'] = $data['industry'];
                    if (!empty($data['website']))   $companyUpdate['website']  = $data['website'];
                    if (!empty($companyUpdate))     $company->update($companyUpdate);

                    // Upsert Financial row with market cap
                    if ($data['market_cap'] > 0) {
                        Financial::updateOrCreate(
                            ['company_id' => $company->id],
                            ['market_cap' => $data['market_cap']]
                        );
                    }

                    $done++;
                }

                DB::commit();
                $this->info("  ✓ Batch {$batchNum} saved.");

            } catch (Exception $e) {
                DB::rollBack();
                $this->error("  ✗ Batch {$batchNum} DB save failed: " . $e->getMessage());
                Log::error("NGX profile batch {$batchNum} failed: " . $e->getMessage());
                $errors++;
            }

            // ── Fetch logos for this batch if requested ──
            if ($fetchLogos) {
                $this->fetchLogos($scraped);
            }

            sleep(1); // Brief pause between batches
        }

        $this->info('');
        $this->info('════════════════════════════════════');
        $this->info("Profile scrape complete!");
        $this->info("  Processed : {$done}");
        $this->info("  Errors    : {$errors}");
        $this->info('════════════════════════════════════');

        return Command::SUCCESS;
    }

    /**
     * Scrape a single NGX company profile page.
     */
    private function scrapeProfile(string $symbol): ?array
    {
        $url = "https://ngxgroup.com/exchange/data/company-profile/?symbol={$symbol}&directory=companydirectory";

        $response  = null;
        $delays    = [2, 5, 10]; // seconds between retries
        foreach ([0, 1, 2] as $attempt) {
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'     => 'text/html,application/xhtml+xml,*/*',
                    'Referer'    => 'https://ngxgroup.com/',
                ])->timeout(20)->get($url);

                if ($response && $response->successful()) break;
            } catch (\Exception $e) {
                if ($attempt < 2) {
                    sleep($delays[$attempt]);
                    continue;
                }
                throw $e;
            }
            if ($attempt < 2) sleep($delays[$attempt]);
        }

        if (!$response || !$response->successful()) {
            return null;
        }

        $html = $response->body();

        // Extract all <strong class="FieldName">value</strong> fields
        preg_match_all('/<strong class="([^"]+)">(.*?)<\/strong>/s', $html, $matches, PREG_SET_ORDER);

        $fields = [];
        foreach ($matches as $m) {
            $key   = trim($m[1]);
            $value = trim(preg_replace('/<[^>]+>/', '', $m[2]));
            $value = preg_replace('/\s+/', ' ', $value);
            $fields[$key] = $value;
        }

        if (empty($fields)) return null;

        // Also extract table rows for website and other fields
        preg_match_all(
            '/<td[^>]*>\s*([\w\s\/]+):\s*<\/td>\s*<td[^>]*>\s*<strong[^>]*>(.*?)<\/strong>/s',
            $html,
            $rowMatches,
            PREG_SET_ORDER
        );

        $rows = [];
        foreach ($rowMatches as $m) {
            $key   = trim(preg_replace('/\s+/', ' ', $m[1]));
            $value = trim(preg_replace('/<[^>]+>/', '', $m[2]));
            $value = preg_replace('/\s+/', ' ', $value);
            $rows[$key] = $value;
        }

        // Market cap: stored as "17,666,616,535,797.00" — convert to float
        $marketCapRaw = $fields['MarketCap'] ?? '';
        $marketCap    = (float) str_replace([',', ' '], '', $marketCapRaw);

        // Shares outstanding
        $sharesRaw = $fields['SharesOutstanding'] ?? '';
        $shares    = (float) str_replace([',', ' '], '', $sharesRaw);

        // Website — clean it up
        $website = $rows['Website'] ?? '';
        if ($website && !str_starts_with($website, 'http')) {
            $website = 'https://' . ltrim($website, '/');
        }

        return [
            'symbol'             => $fields['Symbol']             ?? $symbol,
            'sector'             => $this->formatTitle($fields['Sector'] ?? ''),
            'industry'           => $this->formatTitle($fields['SubSector'] ?? $rows['Sub Sector'] ?? ''),
            'market_cap'         => $marketCap,
            'shares_outstanding' => $shares,
            'website'            => $website,
            'nature_of_business' => $rows['Nature of Business']  ?? '',
            'date_listed'        => $rows['Date Listed']         ?? '',
            'address'            => $rows['Company Address']     ?? '',
        ];
    }

    /**
     * Convert "INDUSTRIAL GOODS" → "Industrial Goods"
     */
    private function formatTitle(string $str): string
    {
        if (!$str) return '';
        return ucwords(strtolower($str));
    }

    /**
     * Fetch and store logo for each company using Clearbit (free, no API key).
     */
    private function fetchLogos(array $items): void
    {
        foreach ($items as $item) {
            $company = $item['company'];
            $data    = $item['data'];

            if ($company->logo_url || empty($data['website'])) continue;

            try {
                $domain = parse_url($data['website'], PHP_URL_HOST);
                if (!$domain) {
                    // Try without scheme
                    $domain = preg_replace('/^www\./', '', trim($data['website'], '/'));
                    $domain = explode('/', $domain)[0];
                }

                if (!$domain) continue;

                $imgRes = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0',
                ])->timeout(8)->get("https://logo.clearbit.com/{$domain}");

                if ($imgRes && $imgRes->successful() && str_contains($imgRes->header('Content-Type') ?? '', 'image')) {
                    $filename = 'logos/' . strtolower($company->symbol) . '.png';
                    Storage::disk('public')->put($filename, $imgRes->body());
                    DB::reconnect();
                    $company->update(['logo_url' => '/storage/' . $filename]);
                    $this->line("  🖼  Logo saved: {$company->symbol} ({$domain})");
                } else {
                    $this->line("  — No logo: {$company->symbol} ({$domain})");
                }

                usleep(400000); // 400ms between logo requests
            } catch (Exception $e) {
                Log::warning("Logo fetch failed for {$company->symbol}: " . $e->getMessage());
            }
        }
    }
}
