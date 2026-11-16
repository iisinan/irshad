<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('companies')
            ->where('symbol', 'LOTUS-WAQF')
            ->update(['sector' => 'Endowment']);

        try {
            Cache::forget('directory.mutual_funds');
        } catch (\Throwable) {
            // Cache store may not be reachable during offline builds
        }
    }

    public function down(): void
    {
        DB::table('companies')
            ->where('symbol', 'LOTUS-WAQF')
            ->update(['sector' => 'Balanced']);

        try {
            Cache::forget('directory.mutual_funds');
        } catch (\Throwable) {
            // Cache store may not be reachable during offline builds
        }
    }
};
