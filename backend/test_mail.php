<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Illuminate\Support\Facades\Mail::raw('Test email from Irshad', function ($message) {
        $message->to('sinanismailaidris@gmail.com')->subject('Testing Mail');
    });
    echo "Sent successfully\n";
} catch (\Exception $e) {
    echo "Failed: " . $e->getMessage() . "\n";
}
