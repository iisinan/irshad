<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = DB::table('resources')
            ->where('url', 'like', 'http://%')
            ->where('url', 'like', '%/api/v1/resources/media/%')
            ->get(['id', 'url']);

        foreach ($rows as $row) {
            if (preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?/#i', $row->url)) {
                continue;
            }

            DB::table('resources')
                ->where('id', $row->id)
                ->update([
                    'url' => 'https://'.substr($row->url, 7),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // Non-destructive scheme normalization; no downgrade needed.
    }
};
