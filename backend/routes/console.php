<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:scrape-ngx-prices')->dailyAt('03:00');
Schedule::command('financials:fetch')->dailyAt('03:30');
Schedule::command('data:consolidate')->dailyAt('04:00');
Schedule::command('news:aggregate')->hourly();
Schedule::command('news:scrape-stocks')->everyTwoHours();
Schedule::command('app:snapshot-portfolios')->dailyAt('17:00');
Schedule::command('alerts:process')->everyMinute();

// Our new AI Engine sweep for Annual Reports
Schedule::command('irshad:daily-scan')->dailyAt('00:00');
