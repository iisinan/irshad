<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'shamsugiade@gamil.com')->first();
if ($user) {
    $user->email = 'shamsugiade@gmail.com';
    $user->save();
    echo "Updated email to shamsugiade@gmail.com\n";
    $user->sendEmailVerificationNotification();
    echo "Verification email queued for: " . $user->email . "\n";
} else {
    echo "User not found\n";
}
