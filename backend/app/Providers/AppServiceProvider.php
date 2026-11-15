<?php

namespace App\Providers;

use App\Models\Company;
use App\Models\Financial;
use App\Models\Product;
use App\Models\StockStatus;
use App\Models\Dividend;
use App\Observers\CompanyObserver;
use App\Observers\FinancialObserver;
use App\Observers\ProductObserver;
use App\Observers\StockStatusObserver;
use App\Observers\DividendObserver;
use Illuminate\Support\Facades\DB;
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

        // Verdict lock — prevents automated scripts from overwriting
        // halal/non-halal verdicts without admin approval
        Company::observe(CompanyObserver::class);
        Financial::observe(FinancialObserver::class);
        Dividend::observe(DividendObserver::class);

        \Illuminate\Support\Facades\RateLimiter::for('gemini-api', function ($job) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(12);
        });

        $defaultConn = (string) config('database.default');
        $dbUrl = (string) config("database.connections.{$defaultConn}.url", '');
        $dbHost = (string) (parse_url($dbUrl, PHP_URL_HOST) ?: config("database.connections.{$defaultConn}.host", ''));
        $isRemoteDb = $defaultConn !== 'sqlite'
            && $dbHost !== ''
            && ! in_array($dbHost, ['127.0.0.1', 'localhost', '::1'], true);

        DB::prohibitDestructiveCommands(
            ! $this->app->environment('testing') && ($this->app->isProduction() || $isRemoteDb)
        );
    }
}
