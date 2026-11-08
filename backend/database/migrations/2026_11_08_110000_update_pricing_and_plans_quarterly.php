<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Disable transaction so PostgreSQL DDL statement errors don't abort subsequent commands.
     */
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (!Schema::hasColumn('plans', 'price_quarterly')) {
                $table->decimal('price_quarterly', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('plans', 'price_quarterly_regular')) {
                $table->decimal('price_quarterly_regular', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('plans', 'price_yearly_regular')) {
                $table->decimal('price_yearly_regular', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('plans', 'paystack_plan_code_quarterly')) {
                $table->string('paystack_plan_code_quarterly')->nullable();
            }
        });

        // Ensure subscriptions billing_cycle accommodates 'quarterly'
        try {
            DB::statement("ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;");
            DB::statement("ALTER TABLE subscriptions ALTER COLUMN billing_cycle DROP DEFAULT;");
            DB::statement("ALTER TABLE subscriptions ALTER COLUMN billing_cycle TYPE VARCHAR(50) USING billing_cycle::varchar;");
            DB::statement("ALTER TABLE subscriptions ALTER COLUMN billing_cycle SET DEFAULT 'quarterly';");
        } catch (\Throwable $e) {
            try {
                Schema::table('subscriptions', function (Blueprint $table) {
                    $table->string('billing_cycle', 50)->default('quarterly')->change();
                });
            } catch (\Throwable $t) {
                // Ignore if already changed or dialect unsupported
            }
        }

        // Seed / Update plans with the new pricing key
        $plans = [
            'free' => [
                'name' => 'Miftah',
                'price_monthly' => 0,
                'price_quarterly' => 0,
                'price_quarterly_regular' => 0,
                'price_yearly' => 0,
                'price_yearly_regular' => 0,
            ],
            'pro' => [
                'name' => 'Rawdha',
                'price_monthly' => 0,
                'price_quarterly' => 6500,
                'price_quarterly_regular' => 7500,
                'price_yearly' => 25000,
                'price_yearly_regular' => 30000,
            ],
            'max' => [
                'name' => 'Noor',
                'price_monthly' => 0,
                'price_quarterly' => 8500,
                'price_quarterly_regular' => 10000,
                'price_yearly' => 33000,
                'price_yearly_regular' => 40000,
            ],
        ];

        foreach ($plans as $slug => $data) {
            DB::table('plans')->updateOrInsert(['slug' => $slug], $data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('plans', 'price_quarterly')) $columns[] = 'price_quarterly';
            if (Schema::hasColumn('plans', 'price_quarterly_regular')) $columns[] = 'price_quarterly_regular';
            if (Schema::hasColumn('plans', 'price_yearly_regular')) $columns[] = 'price_yearly_regular';
            if (Schema::hasColumn('plans', 'paystack_plan_code_quarterly')) $columns[] = 'paystack_plan_code_quarterly';
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
