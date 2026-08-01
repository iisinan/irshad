<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Http\Controllers\PortfolioController;
use App\Models\Holding;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Auth;

// Mock the first user
$user = User::first();
if (! $user) {
    echo "No users found.\n";
    exit;
}
Auth::login($user);

// Add a test holding for DANGCEM
Holding::updateOrCreate(
    ['user_id' => $user->id, 'symbol' => 'DANGCEM'],
    ['shares' => 100, 'average_buy_price' => 500, 'purchase_date' => now()->subDays(10)]
);

$controller = new PortfolioController;
$response = $controller->index();

echo json_encode($response->getData(), JSON_PRETTY_PRINT);
