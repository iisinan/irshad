<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('watchlists', function (Blueprint $table) {
            $table->boolean('alert_verdict_change')->default(false)->after('alert_email');
            $table->boolean('alert_compliance_risk')->default(false)->after('alert_verdict_change');
            $table->boolean('alert_weekly_digest')->default(false)->after('alert_compliance_risk');
            $table->boolean('alert_price_change')->default(false)->after('alert_weekly_digest');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('watchlists', function (Blueprint $table) {
            $table->dropColumn([
                'alert_verdict_change',
                'alert_compliance_risk',
                'alert_weekly_digest',
                'alert_price_change',
            ]);
        });
    }
};
