<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'welcome_email_sent_at')) {
                $table->timestamp('welcome_email_sent_at')->nullable()->after('email_verified_at');
            }
            if (! Schema::hasColumn('users', 'launch_announcement_sent_at')) {
                $table->timestamp('launch_announcement_sent_at')->nullable()->after('welcome_email_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $dropCols = array_values(array_filter(
                ['welcome_email_sent_at', 'launch_announcement_sent_at'],
                fn ($col) => Schema::hasColumn('users', $col)
            ));
            if ($dropCols !== []) {
                $table->dropColumn($dropCols);
            }
        });
    }
};
