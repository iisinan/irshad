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
        Schema::table('financials', function (Blueprint $table) {
            $table->string('file_hash')->nullable()->comment('SHA-256 hash of the source PDF');
            $table->string('s3_url')->nullable()->comment('Cloudflare S3 URL of the archived PDF');
            $table->string('extraction_schema_version')->default('v1.0')->comment('Version of the Gemini extraction logic');
            
            // We use a partial index or drop constraints to ensure idempotency. 
            // A company shouldn't have the exact same file_hash twice.
            $table->unique(['company_id', 'file_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'file_hash']);
            $table->dropColumn(['file_hash', 's3_url', 'extraction_schema_version']);
        });
    }
};
