<?php

namespace App\Console\Commands;

use App\Models\BrokerageAccount;
use App\Models\Holding;
use App\Models\PortfolioSnapshot;
use App\Models\User;
use Illuminate\Console\Command;

class SnapshotPortfolios extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:snapshot-portfolios';

    protected $description = 'Snapshots the total portfolio value for all users at market close';

    public function handle()
    {
        $this->info('Starting portfolio snapshot...');

        $users = User::all();
        $today = now()->toDateString();
        $count = 0;

        foreach ($users as $user) {
            $holdings = Holding::with(['company.status', 'company.dailyPrices' => fn ($q) => $q->latest('date')])
                ->where('user_id', $user->id)
                ->get();

            if ($holdings->isEmpty()) {
                continue;
            }

            $stocksBalance = 0;
            $halalValue = 0;

            foreach ($holdings as $holding) {
                $company = $holding->company;
                $currentPrice = $company?->dailyPrices?->first()?->price ?? 0;
                $status = $company?->status?->status ?? 'doubtful';
                $isHalal = strtolower($status) === 'halal' || strtolower($status) === 'compliant';

                $value = $holding->shares * $currentPrice;
                $stocksBalance += $value;
                if ($isHalal) {
                    $halalValue += $value;
                }
            }

            $brokerage = BrokerageAccount::where('user_id', $user->id)->first();
            $cashBalance = $brokerage?->cash_balance ?? 0.0;
            $totalBalance = $stocksBalance + $cashBalance;
            $healthPercentage = $stocksBalance > 0 ? round(($halalValue / $stocksBalance) * 100, 1) : 100;

            PortfolioSnapshot::updateOrCreate(
                ['user_id' => $user->id, 'date' => $today],
                [
                    'total_balance' => $totalBalance,
                    'cash_balance' => $cashBalance,
                    'stocks_balance' => $stocksBalance,
                    'halal_value' => $halalValue,
                    'health_percentage' => $healthPercentage,
                ]
            );

            $count++;
        }

        $this->info("Completed! Snapshotted $count portfolios for $today.");
    }
}
