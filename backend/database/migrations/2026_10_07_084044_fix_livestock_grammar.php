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
        $c = \App\Models\Company::where('symbol', 'LIVESTOCK')->first();
        if ($c && $c->aaoifiScreening) {
            $s = $c->aaoifiScreening;
            $reasoning = is_string($s->business_reasoning) ? json_decode($s->business_reasoning, true) : $s->business_reasoning;
            if (isset($reasoning['summary'])) {
                $reasoning['summary'] = str_replace(
                    "includes from sale and distributes",
                    "include the sale and distribution of",
                    $reasoning['summary']
                );
                $s->business_reasoning = $reasoning;
                $s->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration needed
    }
};
