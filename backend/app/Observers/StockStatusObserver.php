<?php

namespace App\Observers;

use App\Models\StockStatus;
use App\Services\NotificationService;

class StockStatusObserver
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Handle the StockStatus "updated" event.
     */
    public function updated(StockStatus $stockStatus): void
    {
        if ($stockStatus->isDirty('status')) {
            $this->notificationService->notifyStatusChange(
                'stock',
                $stockStatus->company, // Assuming relationship exists
                $stockStatus->getOriginal('status'),
                $stockStatus->status
            );
        }
    }
}
