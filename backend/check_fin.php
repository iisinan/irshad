<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Financial;
use App\Models\FinancialStatementNormalized;
use App\Models\AaoifiScreening;
use Carbon\Carbon;

$today = Carbon::today();

echo "Financials Updated Today: " . Financial::whereDate('updated_at', $today)->count() . "\n";
echo "Normalized Statements Updated Today: " . FinancialStatementNormalized::whereDate('updated_at', $today)->count() . "\n";
echo "AAOIFI Screenings Updated Today: " . AaoifiScreening::whereDate('updated_at', $today)->count() . "\n";
