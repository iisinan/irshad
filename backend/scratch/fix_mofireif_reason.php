<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$company = Company::where('symbol', 'MOFIREIF')->first();

if (!$company) {
    echo "ERROR: MOFIREIF not found in database.\n";
    exit(1);
}

echo "Current reason:\n" . $company->activity_reason . "\n\n";

$correctReason = "MOFIREIF (Mortgage Finance REIT) is non-compliant under AAOIFI Shariah standards. Despite operating under a real estate investment structure, its core business is the origination and management of conventional interest-bearing mortgage loans to homebuyers at a stated 9.75% interest rate, plus construction financing guarantees to developers. Repayments from these interest-bearing loans are recycled into new lending. Income to unit-holders is derived from coupon/interest received from borrowers, making interest-based lending the fundamental and primary business activity. This constitutes riba, which is categorically prohibited under AAOIFI Shariah Standard No. 21.";

$company->activity_reason = $correctReason;
$company->save();

echo "✅ MOFIREIF activity_reason updated successfully.\n";
echo "New reason:\n" . $company->activity_reason . "\n";
