<?php

namespace App\Observers;

use App\Models\Company;
use Illuminate\Support\Facades\Log;

class CompanyObserver
{
    /**
     * Fields that affect the halal/non-halal verdict.
     * These cannot be changed without going through the
     * ComplianceReview approval workflow.
     */
    protected array $protectedFields = [
        'current_status',
    ];

    public function saving(Company $company): void
    {
        // Skip protection if explicitly bypassed (admin approval flow only)
        if (app()->bound('verdict.unlock') && app('verdict.unlock') === true) {
            return;
        }

        foreach ($this->protectedFields as $field) {
            if ($company->isDirty($field)) {
                $original = $company->getOriginal($field);
                $new      = $company->getAttribute($field);

                // Allow if value hasn't actually changed
                if ($original === $new) {
                    continue;
                }

                Log::warning("VERDICT LOCK: Blocked attempt to change [{$field}] on {$company->symbol} from [{$original}] to [{$new}]");

                // Revert the change — lock the field
                $company->setAttribute($field, $original);
            }
        }
    }
}
