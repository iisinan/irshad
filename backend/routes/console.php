<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:sync-market-data')->timezone('Africa/Lagos')->dailyAt('15:30')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
Schedule::command('app:sync-market-data')->twiceDaily(10, 22)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');


Schedule::command('news:scrape-stocks')->everyTwoHours()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
Schedule::command('app:snapshot-portfolios')->dailyAt('17:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
// DEACTIVATED: Schedule::command('alerts:process')->everyMinute();


// DEACTIVATED: Schedule::command('irshad:market-data')->twiceDaily(0, 12)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');



// Updates section: detect Halal ↔ Non-Halal changes and push inbox notifications
Schedule::command('irshad:detect-compliance-changes')->hourly()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Send weekly updates digest
Schedule::command('irshad:send-updates-digest')->weeklyOn(5, '15:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// DEACTIVATED: Enforce strict AAOIFI math on Company status
// Schedule::command('compliance:enforce-math')->dailyAt('01:00');



// Unified in app:sync-market-data
// Schedule::command('dividends:update')->dailyAt('09:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Send Zakat Reminders daily at 8:00 AM
Schedule::command('app:send-zakat-reminders')->dailyAt('08:00')->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Prune old NGXPulse audit logs daily
Schedule::command('irshad:prune-audits')->daily()->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Unified in app:sync-market-data
// Schedule::command('pulse:sync-data')->twiceDaily(10, 22)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');

// Warm cache every hour so cold starts never happen
Schedule::command('cache:warm')->hourly()->withoutOverlapping();

// Scrape NGX Pulse for new financial disclosures twice a day at 7 AM and 7 PM
Schedule::command('irshad:scrape-disclosures')->timezone('Africa/Lagos')->twiceDaily(7, 19)->withoutOverlapping()->emailOutputTo('sinanismailaidris@gmail.com');
