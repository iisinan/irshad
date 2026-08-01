<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Holding;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\PortfolioController;

// Mock the first user
$user = User::first();
if (!$user) {
    echo "No users found.\n";
    exit;
}
Auth::login($user);

// Add a test holding for DANGCEM
Holding::updateOrCreate(
    ['user_id' => $user->id, 'symbol' => 'DANGCEM'],
    ['shares' => 100, 'average_buy_price' => 500, 'purchase_date' => now()->subDays(10)]
);

$controller = new PortfolioController();
$response = $controller->index();

echo json_encode($response->getData(), JSON_PRETTY_PRINT);
