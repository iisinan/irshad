<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\ComplianceStatusChange;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $norm = function (?string $s): string {
            if (!$s) return 'unknown';
            $cleaned = strtolower(trim(str_replace(['_', ' '], '-', $s)));
            if (in_array($cleaned, ['halal', 'compliant', 'pass', 'shariah-compliant'])) return 'halal';
            if (in_array($cleaned, ['non-compliant', 'non-halal', 'fail', 'shariah-non-compliant', 'haram'])) return 'non-compliant';
            if (in_array($cleaned, ['doubtful', 'questionable'])) return 'doubtful';
            return $cleaned;
        };

        $records = ComplianceStatusChange::all();
        $toDelete = [];

        foreach ($records as $record) {
            $prev = $norm($record->previous_status);
            $new = $norm($record->new_status);

            if ($prev === 'unknown' || $new === 'unknown' || $prev === $new) {
                $toDelete[] = $record->id;
            }
        }

        if (!empty($toDelete)) {
            ComplianceStatusChange::whereIn('id', $toDelete)->delete();
        }

        Cache::forget('updates_news_insights');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Deletion cleanup is permanent and idempotent; cannot reverse deleted duplicates
    }
};
