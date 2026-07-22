<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\Financial;

class CheckMissingDataCommand extends Command
{
    protected $signature = 'data:check-missing';
    protected $description = 'Check missing AAOIFI data';

    public function handle()
    {
        $totalCompanies = Company::count();
        if ($totalCompanies === 0) {
            $this->info(json_encode(['error' => 'No companies found']));
            return;
        }

        $missingSector = Company::whereNull('sector')->orWhere('sector', '')->orWhere('sector', 'Unknown')->count();
        
        $companiesWithFinancials = Financial::distinct('company_id')->count();
        $missingBroadFinancials = $totalCompanies - $companiesWithFinancials; // Roughly

        $missingCash = Company::whereDoesntHave('financials', function ($query) {
            $query->whereNotNull('cash_and_equivalents');
        })->count();

        $missingDebt = Company::whereDoesntHave('financials', function ($query) {
            $query->whereNotNull('total_debt');
        })->count();

        $missingInterest = Company::whereDoesntHave('financials', function ($query) {
            $query->whereNotNull('interest_income');
        })->count();

        $missingReceivables = Company::whereDoesntHave('financials', function ($query) {
            $query->whereNotNull('accounts_receivable');
        })->count();

        $missingIlliquid = Company::whereDoesntHave('financials', function ($query) {
            $query->whereNotNull('illiquid_assets');
        })->count();

        $this->info(json_encode([
            'total_companies' => $totalCompanies,
            'missing_sector' => $missingSector,
            'missing_broad_financials' => $missingBroadFinancials,
            'missing_cash' => $missingCash,
            'missing_debt' => $missingDebt,
            'missing_interest' => $missingInterest,
            'missing_receivables' => $missingReceivables,
            'missing_illiquid' => $missingIlliquid,
        ]));
    }
}
