<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\ComplianceHistory;

$toFix = [
    'AFROMEDIA', 'BETAGLAS', 'DAARCOMM', 'HMCALL', 'NCR',
    'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP',
    'UHOMREIT', 'UPDCREIT', 'NEWGOLD',
];

$updated = 0;

foreach ($toFix as $ticker) {
    $company = Company::where('symbol', $ticker)->first();

    if (!$company) {
        echo "❌ {$ticker} — not found in DB, skipping.\n";
        continue;
    }

    $oldStatus = $company->current_status;

    // Update companies table
    $company->current_status = 'doubtful';
    $company->save();

    // Update AaoifiScreening final_status if it exists
    $aaoifi = AaoifiScreening::where('company_id', $company->id)->first();
    if ($aaoifi) {
        $aaoifi->final_status = 'doubtful';
        $aaoifi->save();
    }

    // Update the stock_statuses table if it exists
    if ($company->status) {
        $company->status()->update([
            'status' => 'doubtful',
            'reason' => 'Corrected by human review — flagged as doubtful in Irshad Stock Screening Excel (July 2026).',
            'last_updated' => now(),
        ]);
    }

    // Log to compliance history
    ComplianceHistory::create([
        'company_id' => $company->id,
        'old_status' => $oldStatus,
        'new_status' => 'doubtful',
        'reason' => 'Human review correction: Excel screening flagged as doubtful due to revenue mix concerns.',
        'changed_at' => now(),
    ]);

    echo "✅ {$ticker} — updated from [{$oldStatus}] → [doubtful]\n";
    $updated++;
}

echo "\nDone. {$updated} stocks updated to doubtful.\n";
