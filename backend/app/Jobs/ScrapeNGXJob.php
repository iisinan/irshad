<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use GuzzleHttp\Client;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Financial;
use App\Models\CorporateDisclosure;
use App\Models\PriceAlert;
use App\Services\AaoifiComplianceService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ScrapeNGXJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes

    public function __construct()
    {
        //
    }

    public function handle(AaoifiComplianceService $complianceService, \App\Services\NotificationService $notificationService): void
    {
        Log::info('Starting Dual NGX Scraping Job');
        
        $this->scrapeNews($complianceService);
        $this->scrapeFinancials($complianceService, $notificationService);

        Log::info('Completed Dual NGX Scraping Job successfully.');
    }

    private function scrapeNews(AaoifiComplianceService $complianceService): void
    {
        Log::info('Scraping NGX Corporate Disclosures...');
        
        $client = new Client(['timeout' => 30]);
        $scriptPath = base_path('scripts/extract_pdf_financials.py');
        $pythonPath = base_path('venv/bin/python3');
        
        try {
            $response = $client->request('GET', "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items/?\$select=URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission&\$orderby=Created%20desc&\$Top=2000", [
                'headers' => [
                    'Accept' => 'application/json;odata=verbose',
                    'User-Agent' => 'Mozilla/5.0'
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            $items = $data['d']['results'] ?? [];

            foreach ($items as $item) {
                $symbol = $item['CompanySymbol'] ?? 'UNKNOWN';
                $pdfUrl = $item['URL']['Url'] ?? null;
                
                $disclosure = CorporateDisclosure::updateOrCreate(
                    [
                        'company_symbol' => $symbol,
                        'title' => $item['URL']['Description'] ?? 'No Title',
                    ],
                    [
                        'company_name' => $item['CompanyName'] ?? null,
                        'pdf_url' => $pdfUrl,
                        'submission_type' => $item['Type_of_Submission'] ?? null,
                        'published_at' => isset($item['Created']) ? Carbon::parse($item['Created']) : now(),
                    ]
                );
                
                // If this is a new disclosure with a PDF, extract financials
                if ($disclosure->wasRecentlyCreated && $pdfUrl && str_contains(strtolower($pdfUrl), '.pdf')) {
                    
                    // First ensure company exists
                    $company = Company::firstOrCreate(
                        ['symbol' => $symbol],
                        ['name' => $item['CompanyName'] ?? $symbol, 'sector' => 'Unknown', 'business_type' => 'Equities']
                    );
                    // Fetch Simply Wall St Industry & Market Cap
                    $swsScriptPath = base_path('scripts/fetch_sws_data.py');
                    $swsProcess = new Process([$pythonPath, $swsScriptPath, $symbol]);
                    $swsProcess->run();
                    
                    $swsIndustry = 'Unknown';
                    $marketCap = 0;
                    
                    if ($swsProcess->isSuccessful()) {
                        $swsResult = json_decode($swsProcess->getOutput(), true);
                        if ($swsResult && isset($swsResult['status']) && $swsResult['status'] === 'success') {
                            $swsIndustry = $swsResult['industry'] ?? 'Unknown';
                            $marketCap = $swsResult['market_cap'] ?? 0;
                            
                            $updateData = [];
                            if ($swsIndustry !== 'Unknown') {
                                $updateData['sector'] = $swsIndustry;
                            }
                            if (isset($swsResult['overview'])) $updateData['overview'] = $swsResult['overview'];
                            if (isset($swsResult['analysts_target'])) $updateData['analysts_target'] = $swsResult['analysts_target'];
                            if (isset($swsResult['valuation_info'])) $updateData['valuation_info'] = $swsResult['valuation_info'];
                            if (isset($swsResult['growth_info'])) $updateData['growth_info'] = $swsResult['growth_info'];
                            if (isset($swsResult['div_yield'])) $updateData['div_yield'] = $swsResult['div_yield'];
                            
                            if (!empty($updateData)) {
                                $company->update($updateData);
                            }
                        }
                    }

                    // Extract PDF Financials
                    $process = new Process([$pythonPath, $scriptPath, $pdfUrl]);
                    $process->setTimeout(60);
                    $process->run();
                    
                    if ($process->isSuccessful()) {
                        $result = json_decode($process->getOutput(), true);
                        if ($result && isset($result['status']) && $result['status'] === 'success') {
                            
                            $financials = Financial::updateOrCreate(
                                [
                                    'company_id' => $company->id,
                                    'reporting_period' => now()->year . '-Q' . ceil(now()->month / 3),
                                ],
                                [
                                    'total_assets' => $result['total_assets'] ?? 0,
                                    'total_debt' => $result['total_debt'] ?? 0,
                                    'total_revenue' => $result['total_revenue'] ?? 1,
                                    'market_cap' => $marketCap,
                                    'interest_income' => $result['interest_income'] ?? 0,
                                    'non_halal_income' => $result['interest_income'] ?? 0,
                                ]
                            );
                            
                            $complianceService->evaluateCompliance($company, $financials, $swsIndustry);
                            Log::info("Extracted financials for $symbol from PDF.");
                        }
                    }
                }
            }
            Log::info('Corporate Disclosures scraped and parsed successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to scrape NGX News: ' . $e->getMessage());
        }
    }

    private function scrapeFinancials(AaoifiComplianceService $complianceService, \App\Services\NotificationService $notificationService): void
    {
        Log::info('Executing Yahoo Finance Python Scraper...');
        
        // Execute the python script
        $scriptPath = base_path('scripts/scrape_yahoo.py');
        $pythonPath = base_path('venv/bin/python3');
        
        $process = new Process([$pythonPath, $scriptPath]);
        $process->setTimeout(120);

        try {
            $process->mustRun();
            $output = $process->getOutput();
            $data = json_decode($output, true);

            if (!$data) {
                throw new \Exception("Invalid JSON output from python script.");
            }

            foreach ($data as $item) {
                if (isset($item['error']) && $item['error']) {
                    Log::warning("Skipping {$item['symbol']} due to error: {$item['error']}");
                    continue;
                }

                $symbol = $item['symbol'];
                $name = $item['name'];
                $sector = $item['sector'];
                $price = $item['price'] ?? 0;
                $volume = $item['volume'] ?? 0;
                
                // 1. Ensure Company exists
                $company = Company::firstOrCreate(
                    ['symbol' => $symbol],
                    [
                        'name' => $name,
                        'sector' => $sector,
                        'business_type' => 'Equities'
                    ]
                );
                
                // Fetch Simply Wall St Data
                $swsScriptPath = base_path('scripts/fetch_sws_data.py');
                $swsProcess = new Process([$pythonPath, $swsScriptPath, $symbol]);
                $swsProcess->run();
                if ($swsProcess->isSuccessful()) {
                    $swsResult = json_decode($swsProcess->getOutput(), true);
                    if ($swsResult && isset($swsResult['status']) && $swsResult['status'] === 'success') {
                        $updateData = [];
                        if (isset($swsResult['industry']) && $swsResult['industry'] !== 'Unknown') $updateData['sector'] = $swsResult['industry'];
                        if (isset($swsResult['overview'])) $updateData['overview'] = $swsResult['overview'];
                        if (isset($swsResult['analysts_target'])) $updateData['analysts_target'] = $swsResult['analysts_target'];
                        if (isset($swsResult['valuation_info'])) $updateData['valuation_info'] = $swsResult['valuation_info'];
                        if (isset($swsResult['growth_info'])) $updateData['growth_info'] = $swsResult['growth_info'];
                        if (isset($swsResult['div_yield'])) $updateData['div_yield'] = $swsResult['div_yield'];
                        
                        if (!empty($updateData)) {
                            $company->update($updateData);
                        }
                        
                        if (isset($swsResult['market_cap'])) {
                            $item['market_cap'] = $swsResult['market_cap']; // Use SWS market cap if available
                        }
                    }
                }

                // 2. Save Daily Price
                DailyPrice::updateOrCreate(
                    [
                        'company_id' => $company->id,
                        'date' => now()->toDateString(),
                    ],
                    [
                        'price' => $price,
                        'volume' => $volume,
                    ]
                );

                // 3. Save Financials
                // Yahoo finance may not have interest_income directly, we default to 0 if not found.
                // total_debt and total_assets or market_cap
                // For AAOIFI: Debt ratio = Total Debt / Total Assets (or Market Cap).
                // We'll store what we have.
                $financials = Financial::updateOrCreate(
                    [
                        'company_id' => $company->id,
                        'reporting_period' => now()->year . '-Q' . ceil(now()->month / 3),
                    ],
                    [
                        'total_assets' => $item['total_assets'] ?: $item['market_cap'], // Fallback to market cap if total assets is 0
                        'total_debt' => $item['total_debt'] ?? 0,
                        'total_revenue' => $item['total_revenue'] ?? 1, // Avoid division by zero
                        'interest_income' => $item['interest_income'] ?? 0,
                        'non_halal_income' => $item['interest_income'] ?? 0, // Assume interest is non-halal
                    ]
                );

                // 4. Run Compliance Service
                $complianceService->evaluateCompliance($company, $financials);

                // 5. Check Price Alerts
                $activeAlerts = PriceAlert::where('company_id', $company->id)
                    ->where('is_active', true)
                    ->with('user')
                    ->get();

                foreach ($activeAlerts as $alert) {
                    $hit = false;
                    if ($alert->condition === 'above' && $price >= $alert->target_price) {
                        $hit = true;
                    } elseif ($alert->condition === 'below' && $price <= $alert->target_price) {
                        $hit = true;
                    }

                    if ($hit) {
                        $alert->update(['is_active' => false]);

                        if ($alert->user->fcm_token) {
                            $title = "Price Alert: {$symbol} hit ₦{$alert->target_price}";
                            $body = "{$symbol} is currently trading at ₦{$price}.";
                            $notificationService->sendPushNotification($alert->user->fcm_token, $title, $body);
                        }
                    }
                }
                
                // Clear individual stock cache
                \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");
            }

            // Clear global lists caches
            \Illuminate\Support\Facades\Cache::forget('stocks.index');
            \Illuminate\Support\Facades\Cache::forget('stocks.ngx');

            Log::info('Yahoo Finance Scraping completed.');

        } catch (ProcessFailedException $exception) {
            Log::error('Python Scraper failed: ' . $exception->getMessage());
        } catch (\Exception $e) {
            Log::error('Financial Scraper failed: ' . $e->getMessage());
        }
    }
}
