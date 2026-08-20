<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (App\Models\Company::where('current_status', 'doubtful')->get() as $company) {
    if ($company->status && $company->aaoifiScreening) {
        $screening = $company->aaoifiScreening;
        $bReasonRaw = $screening->business_reasoning;
        $businessReason = '';
        
        if (is_array($bReasonRaw)) {
            $businessReason = $bReasonRaw['justification'] ?? $bReasonRaw['reason'] ?? $bReasonRaw['reasoning'] ?? $bReasonRaw['summary'] ?? (is_string($bReasonRaw) ? $bReasonRaw : json_encode($bReasonRaw));
        } elseif (is_string($bReasonRaw)) {
            $decoded = json_decode($bReasonRaw, true);
            if (is_array($decoded) && (isset($decoded['justification']) || isset($decoded['reason']) || isset($decoded['reasoning']) || isset($decoded['summary']))) {
                $businessReason = $decoded['justification'] ?? $decoded['reason'] ?? $decoded['reasoning'] ?? $decoded['summary'];
            } else {
                $businessReason = $bReasonRaw;
            }
        }
        $businessReason = trim($businessReason);
        
        if ($businessReason) {
            $company->status->reason = $businessReason;
            $company->status->save();
            echo "Updated CompanyStatus for {$company->symbol}\n";
        }
    }
}
