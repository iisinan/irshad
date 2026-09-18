<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weekly_digest_preferences', function (Blueprint $table) {
            $table->boolean('push_enabled')->default(false)->after('email_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('weekly_digest_preferences', function (Blueprint $table) {
            $table->dropColumn('push_enabled');
        });
    }
};
