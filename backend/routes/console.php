<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:scrape-ngx')->dailyAt('03:00');
Schedule::command('financials:fetch')->dailyAt('03:30');
Schedule::command('news:aggregate')->hourly();
