<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'rizq_planner_email_sent_at')) {
                $table->timestamp('rizq_planner_email_sent_at')->nullable()->after('launch_announcement_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'rizq_planner_email_sent_at')) {
                $table->dropColumn('rizq_planner_email_sent_at');
            }
        });
    }
};
