<?php

namespace App\Console\Commands;

use App\Mail\UpdatesDigestMail;
use App\Models\WeeklyDigestPreference;
use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Dividend;
use App\Models\Watchlist;
use App\Models\Holding;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendUpdatesDigest extends Command
{
    protected $signature = 'irshad:send-updates-digest';
    protected $description = 'Send the weekly/monthly digest of portfolio and market updates to opted-in users.';

    public function handle()
    {
        $this->info('Starting to send Updates Digest...');

        $preferences = WeeklyDigestPreference::where('email_enabled', true)
            ->with('user')
            ->get();

        if ($preferences->isEmpty()) {
            $this->info('No users opted in for the email digest.');
            return self::SUCCESS;
        }

        $oneWeekAgo = now()->subDays(7)->toDateString();

        $halalCompanies = Company::whereHas('stockStatus', function($q) {
            $q->whereIn('status', ['halal', 'compliant']);
        })->get();

        $performances = [];
        foreach ($halalCompanies as $company) {
            $prices = DailyPrice::where('company_id', $company->id)
                ->where('date', '>=', $oneWeekAgo)
                ->orderBy('date', 'asc')
                ->get();
            
            if ($prices->count() >= 2) {
                $startPrice = $prices->first()->price;
                $endPrice = $prices->last()->price;
                if ($startPrice > 0) {
                    $changePct = (($endPrice - $startPrice) / $startPrice) * 100;
                    $performances[] = [
                        'symbol' => $company->symbol,
                        'change_pct' => $changePct,
                        'current_price' => $endPrice,
                    ];
                }
            }
        }

        usort($performances, fn($a, $b) => $b['change_pct'] <=> $a['change_pct']);
        
        $topGainers = array_slice($performances, 0, 3);
        $topLosers = array_slice(array_reverse($performances), 0, 3);

        $dividendsThisWeek = Dividend::with('company')
            ->where('created_at', '>=', now()->subDays(7))
            ->get();

        foreach ($preferences as $pref) {
            if (! $pref->user) {
                continue;
            }

            $userSymbols = Watchlist::where('user_id', $pref->user->id)->pluck('symbol')
                ->merge(Holding::where('user_id', $pref->user->id)->pluck('symbol'))
                ->unique();

            $userPerformances = collect($performances)->whereIn('symbol', $userSymbols)->values()->all();

            try {
                Mail::to($pref->user->email)->send(new UpdatesDigestMail(
                    $pref->user, 
                    $userPerformances, 
                    $topGainers, 
                    $topLosers, 
                    $dividendsThisWeek
                ));
                $this->info("Sent digest to {$pref->user->email}");
            } catch (\Exception $e) {
                $this->error("Failed to send digest to {$pref->user->email}: ".$e->getMessage());
            }
        }

        $this->info('Updates Digest delivery completed.');
        return self::SUCCESS;
    }
}
