<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ImportBusinessExcel extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:import-business-excel';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ingest the NGX_Shariah_Screen (1).xlsx file and rewrite rationales via Gemini.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Business Activity Excel Import (Stage 1)...");

        $aiEnginePath = base_path('ai-engine');
        $scriptPath = $aiEnginePath . '/app/scripts/ingest_business_excel.py';

        if (!file_exists($scriptPath)) {
            $this->error("Python script not found at {$scriptPath}");
            return 1;
        }

        // Run the python script using the ai-engine virtual environment
        $process = Process::fromShellCommandline("source venv/bin/activate && set -a && source .env && set +a && python3 app/scripts/ingest_business_excel.py", $aiEnginePath);
        
        $process->setTimeout(null); // It might take a while to hit Gemini for every ticker
        $process->run(function ($type, $buffer) {
            if (Process::ERR === $type) {
                $this->error($buffer);
            } else {
                $this->line($buffer);
            }
        });

        if (!$process->isSuccessful()) {
            $this->error("Business Activity Import Failed.");
            return 1;
        }

        $this->info("Business Activity Import Completed.");
        return 0;
    }
}
