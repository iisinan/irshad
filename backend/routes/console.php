<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:sync-market-data')->timezone('Africa/Lagos')->dailyAt('15:30')->withoutOverlapping()->description('[Irshad] Market Data Sync (NGX Close — 3:30 PM)')->emailOutputTo('iirshad2026@gmail.com');
Schedule::command('app:sync-market-data')->twiceDaily(10, 22)->withoutOverlapping()->description('[Irshad] Market Data Sync (Twice Daily)')->emailOutputTo('iirshad2026@gmail.com');


Schedule::command('news:scrape-stocks')->dailyAt('18:00')->withoutOverlapping()->description('[Irshad] Stock News Scraper — Daily Run')->emailOutputTo('iirshad2026@gmail.com');
Schedule::command('app:snapshot-portfolios')->dailyAt('17:00')->withoutOverlapping()->description('[Irshad] Portfolio Snapshot — Daily Backup')->emailOutputTo('iirshad2026@gmail.com');
// DEACTIVATED: Schedule::command('alerts:process')->everyMinute();


// DEACTIVATED: Schedule::command('irshad:market-data')->twiceDaily(0, 12)->withoutOverlapping()->emailOutputTo('iirshad2026@gmail.com');



// Updates section: detect Halal ↔ Non-Halal changes and push inbox notifications
Schedule::command('irshad:detect-compliance-changes')->dailyAt('18:30')->withoutOverlapping()->description('[Irshad] Compliance Status Change Detector — Daily Run')->emailOutputTo('iirshad2026@gmail.com');

// Detect significant daily price movements and notify users who opted in
Schedule::command('irshad:detect-price-movements')->dailyAt('16:00')->withoutOverlapping()->description('[Irshad] Price Movement Alerts — Daily Run');

// Detect compliance risk (approaching thresholds) and notify users who opted in
Schedule::command('irshad:detect-compliance-risk')->weekly()->withoutOverlapping()->description('[Irshad] Near-Limit Compliance Risk Scan — Weekly');

// Notify users whose non-compliant holding grace period has expired
Schedule::command('irshad:notify-grace-period-end')->dailyAt('09:00')->withoutOverlapping()->description('[Irshad] Grace Period Expiry Notifications — Daily Run')->emailOutputTo('iirshad2026@gmail.com');

// Send weekly updates digest
Schedule::command('irshad:send-updates-digest')->weeklyOn(5, '15:00')->withoutOverlapping()->description('[Irshad] Weekly Updates Digest — Friday 3 PM')->emailOutputTo('iirshad2026@gmail.com');

// DEACTIVATED: Enforce strict AAOIFI math on Company status
// Schedule::command('compliance:enforce-math')->dailyAt('01:00');



// Unified in app:sync-market-data
// Schedule::command('dividends:update')->dailyAt('09:00')->withoutOverlapping()->emailOutputTo('iirshad2026@gmail.com');

// Send Zakat Reminders daily at 8:00 AM
Schedule::command('app:send-zakat-reminders')->dailyAt('08:00')->withoutOverlapping()->description('[Irshad] Zakat Hawl Reminders — Daily Run')->emailOutputTo('iirshad2026@gmail.com');

// Prune old NGXPulse audit logs daily
Schedule::command('irshad:prune-audits')->daily()->withoutOverlapping()->description('[Irshad] NGXPulse Audit Log Pruner — Daily Cleanup')->emailOutputTo('iirshad2026@gmail.com');

// Unified in app:sync-market-data
// Schedule::command('pulse:sync-data')->twiceDaily(10, 22)->withoutOverlapping()->emailOutputTo('iirshad2026@gmail.com');

// Warm cache every hour so cold starts never happen
Schedule::command('cache:warm')->hourly()->withoutOverlapping()->description('[Irshad] Cache Warmer — Hourly');

// Scrape NGX Pulse for new financial disclosures twice a day at 7 AM and 7 PM
Schedule::command('irshad:scrape-disclosures')->timezone('Africa/Lagos')->twiceDaily(7, 19)->withoutOverlapping()->description('[Irshad] NGXPulse Financial Disclosures Scraper — Twice Daily')->emailOutputTo('iirshad2026@gmail.com');
Schedule::command('backup:run --only-db')->timezone('Africa/Lagos')->dailyAt('00:00')->withoutOverlapping()->description('[Irshad] Database Backup to S3 — Midnight Run')->emailOutputTo('iirshad2026@gmail.com');

// Scrape NGXPulse market news daily at 5 AM
Schedule::command('scrape:market-news')->timezone('Africa/Lagos')->dailyAt('05:00')->withoutOverlapping()->description('[Irshad] Market News Scraper — Daily 5 AM')->emailOutputTo('iirshad2026@gmail.com');
