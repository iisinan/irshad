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
        $companies = [
            [
                'name' => 'Dangote Cement PLC',
                'symbol' => 'DANGCEM',
                'sector' => 'Industrial Goods',
                'business_type' => 'Cement Manufacturing',
                'description' => 'Largest cement producer in Sub-Saharan Africa.',
            ],
            [
                'name' => 'Zenith Bank PLC',
                'symbol' => 'ZENITHBANK',
                'sector' => 'Financial Services',
                'business_type' => 'Banking',
                'description' => 'Leading multinational financial services provider.',
            ],
            [
                'name' => 'MTN Nigeria Communications PLC',
                'symbol' => 'MTNN',
                'sector' => 'ICT',
                'business_type' => 'Telecommunications',
                'description' => 'Providing cellular telecommunications services.',
            ],
            [
                'name' => 'Nestle Nigeria PLC',
                'symbol' => 'NESTLE',
                'sector' => 'Consumer Goods',
                'business_type' => 'Food & Beverages',
                'description' => 'Manufacturing and distribution of food products.',
            ],
        ];

        foreach ($companies as $companyData) {
            $company = Company::create($companyData);

            // Add mock financial data
            $isHalalCandidate = ($companyData['symbol'] !== 'ZENITHBANK');
            
            Financial::create([
                'company_id' => $company->id,
                'reporting_period' => '2023-Q4',
                'total_assets' => $isHalalCandidate ? 1000000000 : 5000000000,
                'total_debt' => $isHalalCandidate ? 200000000 : 3000000000, // 20% vs 60%
                'interest_income' => $isHalalCandidate ? 10000000 : 250000000, // 1% vs 5%
                'net_income' => $isHalalCandidate ? 150000000 : 600000000,
                'total_revenue' => $isHalalCandidate ? 800000000 : 1200000000,
            ]);

            // Initial status
            StockStatus::create([
                'company_id' => $company->id,
                'status' => $isHalalCandidate ? 'halal' : 'non-halal',
                'reason' => $isHalalCandidate ? 'Compliant with AAOIFI standards.' : 'Business activity: Banking (Conventional Finance)',
                'last_updated' => now(),
            ]);
        }
    }
}
