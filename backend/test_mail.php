<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

try {
    Mail::raw('This is a test email from Irshad to verify that Resend is working correctly!', function ($message) {
        $message->to('sinanismailaidris@gmail.com')
                ->subject('Irshad Resend Test');
    });
    echo "SUCCESS: Email sent without errors.\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
