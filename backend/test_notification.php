<?php
use App\Models\User;
use App\Models\Company;
use App\Models\StockStatus;
use App\Models\Watchlist;
use Illuminate\Support\Facades\Artisan;

// Setup a user
$user = User::first();
if (!$user) {
    $user = User::factory()->create();
}
$user->phone_number = '+1234567890';
$user->save();

// Setup a company and status
$company = Company::first();
$stockStatus = StockStatus::where('company_id', $company->id)->first();
if (!$stockStatus) {
    $stockStatus = StockStatus::create([
        'company_id' => $company->id,
        'status' => 'halal',
        'reason' => 'Test reason',
    ]);
}

// Add to watchlist
Watchlist::updateOrCreate(
    ['user_id' => $user->id, 'symbol' => $company->symbol],
    ['alert_email' => true, 'alert_whatsapp' => true]
);

// Trigger status update
echo "Old status: {$stockStatus->status}\n";
$stockStatus->status = $stockStatus->status === 'halal' ? 'non-halal' : 'halal';
$stockStatus->save();
echo "New status: {$stockStatus->status}\n";
