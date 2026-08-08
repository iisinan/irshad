<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:scrape-ngx-prices')->dailyAt('03:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
// DEACTIVATED: Schedule::command('financials:fetch')->dailyAt('03:30');
// DEACTIVATED: Schedule::command('data:consolidate')->dailyAt('04:00');
Schedule::command('news:aggregate')->hourly()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
Schedule::command('news:scrape-stocks')->everyTwoHours()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
Schedule::command('app:snapshot-portfolios')->dailyAt('17:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
// DEACTIVATED: Schedule::command('alerts:process')->everyMinute();

// Our new AI Engine sweep for Annual Reports
// DEACTIVATED: Schedule::command('irshad:daily-scan')->dailyAt('00:00');
Schedule::command('irshad:market-data')->twiceDaily(0, 12)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// DEACTIVATED: Business Intelligence sweep (Perplexity + Gemini AI)
// Schedule::command('irshad:update-business')->twiceDaily(0, 12);

// Updates section: detect Halal ↔ Non-Halal changes and push inbox notifications
Schedule::command('irshad:detect-compliance-changes')->hourly()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Send weekly updates digest
Schedule::command('irshad:send-updates-digest')->weeklyOn(5, '15:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// DEACTIVATED: Enforce strict AAOIFI math on Company status
// Schedule::command('compliance:enforce-math')->dailyAt('01:00');

// NGXPulse Daily Financials Sync (JSON API -> Gemini Extraction)
// Old: Schedule::command('irshad:sync-ngxpulse')->dailyAt('03:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
Schedule::command('financials:enterprise-discovery')->dailyAt('04:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// NGX Pulse Dividend Calendar — scrape & update every morning at 9:00 AM
Schedule::command('dividends:update')->dailyAt('09:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Send Zakat Reminders daily at 8:00 AM
Schedule::command('app:send-zakat-reminders')->dailyAt('08:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Prune old NGXPulse audit logs daily
Schedule::command('irshad:prune-audits')->daily()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Sync financial and market data from NGXPulse (10 AM and 10 PM)
Schedule::command('pulse:sync-data')->twiceDaily(10, 22)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Warm cache every hour so cold starts never happen
Schedule::command('cache:warm')->hourly()->withoutOverlapping();
