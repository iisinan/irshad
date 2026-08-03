<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneAudits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:prune-audits';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune NGXPulse audit logs older than 30 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Pruning NGXPulse audit logs older than 30 days...');
        
        $deleted = DB::table('ngxpulse_audit_logs')
            ->where('created_at', '<', now()->subDays(30))
            ->delete();

        $this->info("Deleted {$deleted} old audit logs.");
        return 0;
    }
}
