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
            $table->dropColumn('alert_whatsapp');
            $table->boolean('alert_inapp')->default(false)->after('alert_email');
            $table->boolean('alert_push')->default(false)->after('alert_inapp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('watchlists', function (Blueprint $table) {
            $table->boolean('alert_whatsapp')->default(false);
            $table->dropColumn(['alert_inapp', 'alert_push']);
        });
    }
};
