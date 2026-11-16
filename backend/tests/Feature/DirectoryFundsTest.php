<?php

namespace Tests\Feature;

use App\Models\Company;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DirectoryFundsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! Schema::hasTable('companies')) {
            Schema::create('companies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('symbol')->unique();
                $table->string('sector')->nullable();
                $table->string('asset_class')->nullable();
                $table->string('current_status')->nullable();
                $table->decimal('latest_price', 14, 2)->nullable();
                $table->decimal('price_change_pct', 8, 2)->nullable();
                $table->string('logo_url')->nullable();
                $table->json('fund_details')->nullable();
                $table->timestamps();
            });
        }
    }

    public function test_seed_mutual_funds_sets_lotus_waqf_sector_to_endowment(): void
    {
        Artisan::call('seed:mutual-funds');

        $lotusWaqf = Company::where('symbol', 'LOTUS-WAQF')->first();

        $this->assertNotNull($lotusWaqf);
        $this->assertSame('Endowment', $lotusWaqf->sector);
    }

    public function test_migration_moves_existing_lotus_waqf_to_endowment_and_refreshes_directory_api(): void
    {
        Company::create([
            'name' => 'Lotus Waqf (Endowment) Fund',
            'symbol' => 'LOTUS-WAQF',
            'sector' => 'Balanced',
            'asset_class' => 'mutual_fund',
            'current_status' => 'halal',
            'latest_price' => 100.00,
        ]);

        // Prime cached directory response with stale sector
        $this->getJson('/api/v1/directory?group=funds')
            ->assertOk()
            ->assertJsonPath('data.funds.0.sector', 'Balanced');

        $migration = require database_path('migrations/2026_11_16_100000_update_lotus_waqf_sector_to_endowment.php');
        $migration->up();

        $this->assertFalse(Cache::has('directory.mutual_funds'));

        $this->getJson('/api/v1/directory?group=funds')
            ->assertOk()
            ->assertJsonPath('data.funds.0.symbol', 'LOTUS-WAQF')
            ->assertJsonPath('data.funds.0.sector', 'Endowment');
    }
}
