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
Schedule::command('irshad:market-data')->twiceDaily(0, 12);

// New AI Engine sweep exclusively for Business Intelligence (News)
Schedule::command('irshad:update-business')->twiceDaily(0, 12);

// Updates section: detect Halal ↔ Non-Halal changes and push inbox notifications
Schedule::command('irshad:detect-compliance-changes')->hourly();

// Send weekly updates digest
Schedule::command('irshad:send-updates-digest')->weeklyOn(5, '15:00');

// Enforce strict AAOIFI math on Company status
Schedule::command('compliance:enforce-math')->dailyAt('01:00');
