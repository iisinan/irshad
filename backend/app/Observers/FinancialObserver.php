<?php

namespace App\Observers;

use App\Models\Financial;
use Illuminate\Support\Facades\Log;

class FinancialObserver
{
    /**
     * Financial fields whose changes can affect the halal/non-halal verdict.
     * Ratios are computed from these — so locking them locks the verdict.
     */
    protected array $protectedFields = [
        'total_debt',
        'total_assets',
        'cash_and_equivalents',
        'interest_bearing_securities',
        'interest_income',
        'total_revenue',
        'market_cap',
        'interest_income_ratio',
        'non_compliant_income_ratio',
    ];

    public function saving(Financial $financial): void
    {
        // Skip protection if explicitly bypassed (admin approval flow only)
        if (app()->bound('verdict.unlock') && app('verdict.unlock') === true) {
            return;
        }

        // Allow new records (first-time inserts of financial data are fine)
        if (!$financial->exists) {
            return;
        }

        foreach ($this->protectedFields as $field) {
            if ($financial->isDirty($field)) {
                $original = $financial->getOriginal($field);
                $new      = $financial->getAttribute($field);

                if ($original == $new) {
                    continue;
                }

                $symbol = optional($financial->company)->symbol ?? "company_id:{$financial->company_id}";
                Log::warning("VERDICT LOCK: Blocked attempt to change financial [{$field}] on {$symbol} from [{$original}] to [{$new}]");

                // Revert the change
                $financial->setAttribute($field, $original);
            }
        }
    }
}
