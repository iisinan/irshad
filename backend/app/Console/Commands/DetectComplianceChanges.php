<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\ComplianceStatusChange;
use App\Models\Holding;
use App\Models\UserNotification;
use App\Models\Watchlist;
use Illuminate\Console\Command;

class DetectComplianceChanges extends Command
{
    protected $signature = 'irshad:detect-compliance-changes';

    protected $description = 'Detect companies whose Halal/Non-Halal status has recently changed and push notifications.';

    public function handle(): int
    {
        $this->info('Detecting compliance status changes...');

        // Look at companies that have had a recent change in compliance_histories
        // but do NOT yet have a corresponding compliance_status_changes record.
        $recentChanges = ComplianceHistory::with('company')
            ->where('changed_at', '>=', now()->subDays(7))
            ->get();

        foreach ($recentChanges as $change) {
            if (! $change->company) {
                continue;
            }

            // Check if we already logged this
            $exists = ComplianceStatusChange::where('company_id', $change->company_id)
                ->where('updated_at_change', $change->changed_at)
                ->exists();

            if ($exists) {
                continue;
            }

            // Record the change
            $statusChange = ComplianceStatusChange::create([
                'company_id' => $change->company_id,
                'previous_status' => $change->old_status,
                'new_status' => $change->new_status,
                'reason' => $change->reason,
                'report_url' => null,
                'updated_at_change' => $change->changed_at,
            ]);

            $this->info("Logged change for {$change->company->symbol}: {$change->old_status} → {$change->new_status}");

            // Notify users who watch or hold this stock
            $this->notifyAffectedUsers($change->company, $statusChange);
        }

        $this->info('Done.');

        return self::SUCCESS;
    }

    private function notifyAffectedUsers(Company $company, ComplianceStatusChange $change): void
    {
        $icon = $change->new_status === 'non_halal' ? '🚨' : '✅';
        $title = "{$company->name} – Status Changed";
        $message = "{$company->name} ({$company->symbol}) has moved from "
            .ucfirst($change->previous_status ?? 'Unknown')
            .' to '.ucfirst($change->new_status).'. '
            .($change->reason ? "Reason: {$change->reason}" : '');

        // Users with this in their watchlist
        $watchlistUserIds = Watchlist::where('symbol', $company->symbol)
            ->pluck('user_id')
            ->unique();

        // Users who hold this stock
        $holdingUserIds = Holding::where('symbol', $company->symbol)
            ->pluck('user_id')
            ->unique();

        $allUserIds = $watchlistUserIds->merge($holdingUserIds)->unique();

        foreach ($allUserIds as $userId) {
            UserNotification::notify($userId, $title, $message, [
                'icon' => $icon,
                'category' => 'screening',
                'action_url' => "/market/{$company->symbol}",
                'action_label' => 'View Report',
                'meta' => [
                    'symbol' => $company->symbol,
                    'previous_status' => $change->previous_status,
                    'new_status' => $change->new_status,
                ],
            ]);
        }

        $this->info("Notified {$allUserIds->count()} user(s).");
    }
}
