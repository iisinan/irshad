<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DailyNgxScan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:daily-scan';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pings the AI Engine to kick off the daily NGX market sweep for new Annual Reports';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Pinging AI Engine for daily NGX scan...');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)->post('http://localhost:8000/cron/daily-ngx-scan');
            
            if ($response->successful()) {
                $this->info('Success: ' . $response->json('message', 'Scan initiated'));
            } else {
                $this->error('Failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            $this->error('Connection to AI Engine failed: ' . $e->getMessage());
        }
    }
}
