<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\NgxService;
use Illuminate\Support\Collection;

class SyncNgxChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $companies;

    /**
     * Create a new job instance.
     */
    public function __construct(Collection $companies)
    {
        $this->companies = $companies;
    }

    /**
     * Execute the job.
     */
    public function handle(NgxService $ngxService): void
    {
        foreach ($this->companies as $company) {
            $ngxService->syncCompany($company);
            // Sleep briefly to avoid aggressive rate limiting
            usleep(200000); // 200ms
        }
    }
}
