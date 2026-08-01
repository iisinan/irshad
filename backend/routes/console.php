<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:scrape-ngx-prices')->dailyAt('03:00');
// DEACTIVATED: Schedule::command('financials:fetch')->dailyAt('03:30');
// DEACTIVATED: Schedule::command('data:consolidate')->dailyAt('04:00');
Schedule::command('news:aggregate')->hourly();
Schedule::command('news:scrape-stocks')->everyTwoHours();
Schedule::command('app:snapshot-portfolios')->dailyAt('17:00');
Schedule::command('alerts:process')->everyMinute();

// Our new AI Engine sweep for Annual Reports
Schedule::command('irshad:daily-scan')->dailyAt('00:00');
Schedule::command('irshad:market-data')->twiceDaily(0, 12);

// DEACTIVATED: Business Intelligence sweep (Perplexity + Gemini AI)
// Schedule::command('irshad:update-business')->twiceDaily(0, 12);

// Updates section: detect Halal ↔ Non-Halal changes and push inbox notifications
Schedule::command('irshad:detect-compliance-changes')->hourly();

// Send weekly updates digest
Schedule::command('irshad:send-updates-digest')->weeklyOn(5, '15:00');

// DEACTIVATED: Enforce strict AAOIFI math on Company status
// Schedule::command('compliance:enforce-math')->dailyAt('01:00');

// NGXPulse Daily Financials Sync (JSON API -> Gemini Extraction)
Schedule::command('irshad:sync-ngxpulse')->dailyAt('03:00');

// NGX Pulse Dividend Calendar — scrape & update every morning at 9:00 AM
Schedule::command('dividends:update')->dailyAt('09:00');

// Send Zakat Reminders daily at 8:00 AM
Schedule::command('app:send-zakat-reminders')->dailyAt('08:00');
