<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_status_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('reason')->nullable();
            $table->string('report_url')->nullable();
            $table->timestamp('updated_at_change'); // when the change actually occurred
            $table->timestamps();

            $table->index(['company_id', 'updated_at_change']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_status_changes');
    }
};
