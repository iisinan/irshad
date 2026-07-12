<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Company;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class FetchCompanyMetadataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $company;

    public function __construct(Company $company)
    {
        $this->company = $company;
    }

    public function handle(): void
    {
        $symbol = $this->company->symbol;
        Log::info("Fetching SimplyWallSt metadata for {$symbol}");

        $scriptPath = base_path('scripts/fetch_sws_data.py');
        $pythonPath = base_path('venv/bin/python3');

        $process = new Process([$pythonPath, $scriptPath, $symbol]);
        $process->run();
        
        if ($process->isSuccessful()) {
            $result = json_decode($process->getOutput(), true);
            if ($result && isset($result['status']) && $result['status'] === 'success') {
                $updateData = [];
                if (isset($result['industry']) && $result['industry'] !== 'Unknown') {
                    $updateData['sector'] = $result['industry'];
                }
                if (isset($result['overview'])) $updateData['overview'] = $result['overview'];
                if (isset($result['analysts_target'])) $updateData['analysts_target'] = $result['analysts_target'];
                if (isset($result['valuation_info'])) $updateData['valuation_info'] = $result['valuation_info'];
                if (isset($result['growth_info'])) $updateData['growth_info'] = $result['growth_info'];
                if (isset($result['div_yield'])) $updateData['div_yield'] = $result['div_yield'];
                
                if (!empty($updateData)) {
                    $this->company->update($updateData);
                    Log::info("Updated SWS metadata for {$symbol}");
                }
            } else {
                Log::warning("SWS fetch returned error for {$symbol}");
            }
        } else {
            Log::error("SWS python script failed for {$symbol}: " . $process->getErrorOutput());
        }
    }
}
