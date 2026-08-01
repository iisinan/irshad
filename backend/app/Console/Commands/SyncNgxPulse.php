<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class SyncNgxPulse extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:sync-ngxpulse';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync daily disclosures from NGXPulse and calculate AAOIFI compliance.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting NGXPulse Daily Delta Sync...");

        $aiEnginePath = base_path('ai-engine');
        $scriptPath = $aiEnginePath . '/app/scripts/ngxpulse_scraper.py';

        if (!file_exists($scriptPath)) {
            $this->error("Python script not found at {$scriptPath}");
            return 1;
        }

        // Run the python script
        $process = Process::fromShellCommandline("source venv/bin/activate && set -a && source .env && set +a && python3 app/scripts/ngxpulse_scraper.py", $aiEnginePath);
        
        $process->setTimeout(3600); // Allow up to 1 hour for large syncs
        $process->run(function ($type, $buffer) {
            if (Process::ERR === $type) {
                $this->error($buffer);
            } else {
                $this->line($buffer);
            }
        });

        if (!$process->isSuccessful()) {
            $this->error("NGXPulse Delta Sync Failed.");
            return 1;
        }

        $this->info("NGXPulse Sync Completed.");
        
        // Trigger AAOIFI Recalculation
        $this->info("Enforcing AAOIFI Mathematics on new data...");
        $this->call('compliance:enforce-math');

        return 0;
    }
}
