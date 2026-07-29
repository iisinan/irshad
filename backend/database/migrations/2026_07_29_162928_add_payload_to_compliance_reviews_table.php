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
        Schema::table('compliance_reviews', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('reason');
            $table->string('old_status')->nullable()->change();
            $table->string('new_status')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('compliance_reviews', function (Blueprint $table) {
            $table->dropColumn('payload');
            $table->string('old_status')->nullable(false)->change();
            $table->string('new_status')->nullable(false)->change();
        });
    }
};
