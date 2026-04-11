<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\NotificationService;

class ProductObserver
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        if ($product->isDirty('status')) {
            $this->notificationService->notifyStatusChange(
                'product',
                $product,
                $product->getOriginal('status'),
                $product->status
            );
        }
    }
}
