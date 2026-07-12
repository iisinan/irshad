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
        Log::info('Starting NGX Corporate Disclosures Job');
        
        $this->scrapeNews();

        Log::info('Dispatching Market Data Sync...');
        \Illuminate\Support\Facades\Artisan::call('ngx:sync');

        Log::info('Completed ScrapeNGXJob successfully.');
    }

    private function scrapeNews(): void
    {
        Log::info('Scraping NGX Corporate Disclosures...');
        
        $client = new Client(['timeout' => 30]);
        
        try {
            $response = $client->request('GET', "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items/?\$select=URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission&\$orderby=Created%20desc&\$Top=200", [
                'headers' => [
                    'Accept' => 'application/json;odata=verbose',
                    'User-Agent' => 'Mozilla/5.0'
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            $items = $data['d']['results'] ?? [];

            foreach ($items as $item) {
                // Dispatch a job for each item to process in the background if it is a new PDF
                \App\Jobs\ExtractFinancialPdfJob::dispatch($item);
            }
            Log::info('Corporate Disclosures dispatched to queue successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to scrape NGX News: ' . $e->getMessage());
        }
    }
}
