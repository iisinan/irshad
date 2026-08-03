<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\StockStatus;
use App\Observers\ProductObserver;
use App\Observers\StockStatusObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Product::observe(ProductObserver::class);
        StockStatus::observe(StockStatusObserver::class);

        \Illuminate\Support\Facades\RateLimiter::for('gemini-api', function ($job) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(12);
        });
    }
}
