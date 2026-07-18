<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Financial;
use App\Models\StockStatus;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(database_path('data/ngx_companies.json'));
        $companies = json_decode($json, true);

        foreach ($companies as $companyData) {
            Company::updateOrCreate(
                ['symbol' => $companyData['symbol']],
                [
                    'name' => $companyData['name'],
                    'sector' => $companyData['sector'] ?? 'Unknown',
                    'business_type' => $companyData['business_type'] ?? 'Unknown',
                    'description' => 'A publicly listed company on the Nigerian Exchange (NGX).',
                ]
            );
        }
    }
}
