<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

$count = 0;

// Clean Companies
foreach (Company::whereNotNull('activity_reason')->get() as $company) {
    if (strpos($company->activity_reason, '**') !== false) {
        $company->activity_reason = str_replace('**', '', $company->activity_reason);
        $company->save();
        $count++;
    }
}

// Clean AaoifiScreening
foreach (AaoifiScreening::whereNotNull('business_reasoning')->get() as $screening) {
    if (is_array($screening->business_reasoning)) {
        $arr = $screening->business_reasoning;
        $changed = false;
        foreach ($arr as $k => $v) {
            if (is_string($v) && strpos($v, '**') !== false) {
                $arr[$k] = str_replace('**', '', $v);
                $changed = true;
            }
        }
        if ($changed) {
            $screening->business_reasoning = $arr;
            $screening->save();
        }
    } else if (is_string($screening->business_reasoning) && strpos($screening->business_reasoning, '**') !== false) {
        $screening->business_reasoning = str_replace('**', '', $screening->business_reasoning);
        $screening->save();
    }
}

// Clean StockStatus
foreach (StockStatus::whereNotNull('reason')->get() as $status) {
    if (strpos($status->reason, '**') !== false) {
        $status->reason = str_replace('**', '', $status->reason);
        $status->save();
    }
}

echo "Successfully removed asterisks from {$count} companies.\n";
