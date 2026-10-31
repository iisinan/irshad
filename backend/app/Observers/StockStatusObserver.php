<?php

namespace App\Observers;

use App\Models\Company;
use App\Models\StockStatus;
use App\Services\NotificationService;

class StockStatusObserver
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Handle the StockStatus "created" event.
     */
    public function created(StockStatus $stockStatus): void
    {
        $company = $stockStatus->company ?? Company::find($stockStatus->company_id);
        if ($company && $stockStatus->status) {
            $this->notificationService->notifyStatusChange(
                'stock',
                $company,
                'unknown',
                $stockStatus->status
            );
        }
    }

    /**
     * Handle the StockStatus "updated" event.
     */
    public function updated(StockStatus $stockStatus): void
    {
        if ($stockStatus->isDirty('status')) {
            $company = $stockStatus->company ?? Company::find($stockStatus->company_id);
            if ($company) {
                $this->notificationService->notifyStatusChange(
                    'stock',
                    $company,
                    $stockStatus->getOriginal('status') ?? 'unknown',
                    $stockStatus->status
                );
            }
        }
    }
}
