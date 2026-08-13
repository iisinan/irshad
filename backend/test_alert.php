<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Illuminate\Support\Facades\Mail::to('sinanismailaidris@gmail.com')->send(new \App\Mail\ScraperAlert('error', 'Test error message'));
    echo "Sent successfully\n";
} catch (\Exception $e) {
    echo "Failed: " . $e->getMessage() . "\n";
}
