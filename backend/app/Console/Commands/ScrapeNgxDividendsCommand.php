<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\Company;
use App\Models\Dividend;
use Exception;

class ScrapeNgxDividendsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dividends:update';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape dividend data from NGX Pulse SSR JSON and update the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting NGX Pulse Dividend Scrape...");
        $startTime = microtime(true);
        $url = 'https://ngxpulse.ng/ngx-dividend-calendar';
        
        $newFound = 0;
        $updated = 0;
        $errors = [];

        try {
            // Attempt 1 & 2: Laravel HTTP
            $response = Http::withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
                ->withOptions(['verify' => false])
                ->retry(2, 5000)
                ->timeout(15)
                ->get($url);

            if (!$response->successful()) {
                throw new Exception("HTTP request failed with status: " . $response->status());
            }

            $html = $response->body();

            // Extract SSR JSON
            if (preg_match('/window\.__SSR_DIVIDEND_CALENDAR__\s*=\s*(\{.*?\});/s', $html, $matches)) {
                $json = $matches[1];
                $data = json_decode($json, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception("JSON Decode Error: " . json_last_error_msg());
                }

                if (!isset($data['rows']) || !is_array($data['rows'])) {
                    throw new Exception("Invalid JSON structure: missing 'rows'.");
                }

                foreach ($data['rows'] as $row) {
                    $ticker = trim($row['symbol']);
                    $company = Company::where('symbol', $ticker)->first();

                    if (!$company) {
                        // Skip if we don't track this company
                        continue;
                    }

                    // Parse dates safely
                    $exDate = !empty($row['exDate']) ? $row['exDate'] : null;
                    $recordDate = !empty($row['recordDate']) ? $row['recordDate'] : null;
                    $payDate = !empty($row['payDate']) ? $row['payDate'] : null;
                    $amount = floatval($row['amount']);
                    $type = trim($row['type'] ?? '');
                    $status = trim(strtolower($row['status'] ?? 'tbd'));
                    $currency = trim($row['currency'] ?? 'NGN');
                    $yield = isset($row['yield']) ? floatval($row['yield']) : null;

                    // updateOrCreate to prevent duplicates based on our unique constraint
                    $dividend = Dividend::updateOrCreate(
                        [
                            'company_id' => $company->id,
                            'ticker' => $ticker,
                            'ex_date' => $exDate,
                            'dividend_type' => $type,
                            'amount' => $amount,
                        ],
                        [
                            'record_date' => $recordDate,
                            'pay_date' => $payDate,
                            'status' => $status,
                            'currency' => $currency,
                            'yield' => $yield,
                        ]
                    );

                    if ($dividend->wasRecentlyCreated) {
                        $newFound++;
                    } else if ($dividend->wasChanged()) {
                        $updated++;
                    }
                }
            } else {
                throw new Exception("Could not find window.__SSR_DIVIDEND_CALENDAR__ in the HTML.");
            }
        } catch (Exception $e) {
            $errors[] = $e->getMessage();
            Log::error("Dividend Scrape Error: " . $e->getMessage());
        }

        $duration = round(microtime(true) - $startTime, 2);
        
        $this->info("Finished in {$duration}s. New: {$newFound}, Updated: {$updated}");

        // Send Email Notification
        $this->sendEmailNotification($newFound, $updated, $errors, $duration);
    }

    private function sendEmailNotification($newFound, $updated, $errors, $duration)
    {
        $to = 'sinanismailaidris@gmail.com';
        $subject = 'NGX Pulse Dividend Scrape Summary';
        
        $body = "NGX Pulse Dividend Scrape Summary\n";
        $body .= "---------------------------------\n";
        $body .= "Duration: {$duration}s\n";
        $body .= "New Dividends Found: {$newFound}\n";
        $body .= "Existing Dividends Updated: {$updated}\n\n";

        if (!empty($errors)) {
            $body .= "ERRORS ENCOUNTERED:\n";
            foreach ($errors as $error) {
                $body .= "- {$error}\n";
            }
        } else {
            $body .= "Status: SUCCESS\n";
        }

        try {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
            $this->info("Email summary sent to {$to}.");
        } catch (Exception $e) {
            Log::error("Failed to send dividend scrape email: " . $e->getMessage());
            $this->error("Failed to send email: " . $e->getMessage());
        }
    }
}
