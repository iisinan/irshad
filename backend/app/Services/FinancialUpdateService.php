<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Financial;
use App\Models\ComplianceReview;

class FinancialUpdateService
{
    public function proposeUpdate(Company $company, array $newData, string $reason = 'New financial data received')
    {
        // 1. Get current financials
        $current = Financial::where('company_id', $company->id)->latest()->first();

        // 2. Check if there are meaningful changes
        if ($current) {
            $changed = false;
            foreach ($newData as $key => $value) {
                if (in_array($key, ['created_at', 'updated_at', 'id', 'company_id'])) continue;
                
                if (is_numeric($value) && is_numeric($current->$key)) {
                    $diff = abs((float)$value - (float)$current->$key);
                    $avg = (abs((float)$value) + abs((float)$current->$key)) / 2;
                    if ($avg > 0 && ($diff / $avg) > 0.01) {
                        $changed = true;
                        break;
                    }
                } elseif ($value != $current->$key) {
                    $changed = true;
                    break;
                }
            }
            if (!$changed) return null; // No significant change
        }

        // 3. Create a Compliance Review with the payload
        $stockStatus = $company->status()->first();
        $oldStatus = $stockStatus ? $stockStatus->status : 'pending';

        $dummyFinancial = new Financial(array_merge($current ? $current->toArray() : [], $newData));
        $dummyFinancial->company_id = $company->id;
        
        // Let's use AaoifiScreeningService to evaluate the rules without saving anything to the DB
        $screeningService = app(\App\Services\AaoifiScreeningService::class);
        // We can't use AaoifiComplianceService because it modifies the DB.
        
        // AAOIFI limits
        $marketCap = $dummyFinancial->market_cap > 0 ? $dummyFinancial->market_cap : 1;
        $debtToMarketCap = $dummyFinancial->total_debt / $marketCap;
        $cashAndSecurities = (float)$dummyFinancial->cash_and_equivalents + (float)$dummyFinancial->interest_bearing_securities;
        $cashRatioToMarketCap = $cashAndSecurities / $marketCap;
        $totalRevenue = $dummyFinancial->total_revenue > 0 ? $dummyFinancial->total_revenue : 1;
        $purificationFactor = $dummyFinancial->interest_income / $totalRevenue;

        $proposedStatus = $oldStatus;
        $proposedReason = $reason;

        if ($debtToMarketCap > 0.30) {
            $proposedStatus = 'non-halal';
            $proposedReason = $reason . " | Note: Proposed data will fail Debt Limit Check (" . round($debtToMarketCap * 100, 2) . "%).";
        } elseif ($cashRatioToMarketCap > 0.30) {
            $proposedStatus = 'non-halal';
            $proposedReason = $reason . " | Note: Proposed data will fail Cash Limit Check (" . round($cashRatioToMarketCap * 100, 2) . "%).";
        }

        $review = ComplianceReview::create([
            'company_id' => $company->id,
            'old_status' => $oldStatus,
            'new_status' => $proposedStatus,
            'reason' => $proposedReason,
            'status' => 'pending',
            'payload' => $newData
        ]);

        return $review;
    }
}
