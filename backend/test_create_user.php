<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::factory()->create([
    'name' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => Hash::make('password123'),
]);

echo "Created user: " . $user->email . "\n";
