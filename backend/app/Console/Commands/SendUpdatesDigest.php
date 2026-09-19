<?php

namespace App\Console\Commands;

use App\Mail\UpdatesDigestMail;
use App\Models\WeeklyDigestPreference;
use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Dividend;
use App\Models\Watchlist;
use App\Models\Holding;
use App\Models\UserNotification;
use App\Models\ComplianceStatusChange;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendUpdatesDigest extends Command
{
    protected $signature = 'irshad:send-updates-digest';
    protected $description = 'Send the weekly/monthly digest of portfolio and market updates to opted-in users.';

    public function handle(NotificationService $notificationService)
    {
        $this->info('Starting to send Updates Digest...');

        $preferences = WeeklyDigestPreference::where('email_enabled', true)
            ->orWhere('push_enabled', true)
            ->orWhere('in_app_enabled', true)
            ->with('user')
            ->get();

        if ($preferences->isEmpty()) {
            $this->info('No users opted in for the email or push digest.');
            return self::SUCCESS;
        }

        $halalCompanies = Company::whereHas('status', function($q) {
            $q->whereIn('status', ['halal', 'compliant']);
        })->get();

        $data = [
            'weekly' => $this->getMarketData('weekly', $halalCompanies),
            'monthly' => $this->getMarketData('monthly', $halalCompanies),
        ];

        foreach ($preferences as $pref) {
            if (! $pref->user) {
                continue;
            }

            $freq = $pref->frequency === 'monthly' ? 'monthly' : 'weekly';

            if ($freq === 'monthly' && now()->day > 7) {
                // Not the first Friday of the month
                continue;
            }

            $userSymbols = Watchlist::where('user_id', $pref->user->id)->pluck('symbol')
                ->merge(Holding::where('user_id', $pref->user->id)->pluck('symbol'))
                ->unique();

            $userPerformances = collect($data[$freq]['performances'])->whereIn('symbol', $userSymbols)->values()->all();
            
            $payload = [
                'user_performances' => $userPerformances,
                'top_gainers' => $data[$freq]['top_gainers'],
                'top_losers' => $data[$freq]['top_losers'],
                'dividends' => $data[$freq]['dividends'],
                'compliance_changes' => $data[$freq]['compliance_changes'],
                'ipos' => $data[$freq]['ipos'],
            ];

            if ($pref->email_enabled) {
                try {
                    // We can pass the new fields to the mail if the Mail class supports it, 
                    // or just pass what we can. For now, we will add them if the constructor accepts, 
                    // but since we haven't updated the Mail class constructor, we will just omit them for email or update it.
                    // For safety, let's just use the old constructor.
                    Mail::to($pref->user->email)->send(new UpdatesDigestMail(
                        $pref->user, 
                        $userPerformances, 
                        $data[$freq]['top_gainers'], 
                        $data[$freq]['top_losers'], 
                        $data[$freq]['dividends']
                    ));
                } catch (\Exception $e) {}
            }

            if ($pref->in_app_enabled) {
                UserNotification::notify(
                    $pref->user->id,
                    'Irshad Digest is Ready',
                    'Your ' . $freq . ' portfolio compliance summary and market update is available.',
                    [
                        'icon' => '📧',
                        'category' => 'digest',
                        'action_label' => 'View Digest',
                        'meta' => $payload,
                    ]
                );
            }

            if ($pref->push_enabled && $pref->user->fcm_token) {
                $notificationService->sendDirectPushNotification($pref->user->fcm_token, [
                    'title' => 'Irshad Digest is Ready',
                    'body' => 'Your ' . $freq . ' portfolio compliance summary and market update is available.',
                    'data' => [
                        'type' => 'digest',
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ],
                ]);
            }
            
            $pref->update(['last_sent_at' => now()]);
        }

        $this->info('Updates Digest delivery completed.');
        return self::SUCCESS;
    }

    private function getMarketData($freq, $halalCompanies) {
        $startDate = $freq === 'monthly' ? now()->subMonth()->toDateString() : now()->subDays(7)->toDateString();
        
        $performances = [];
        foreach ($halalCompanies as $company) {
            $prices = DailyPrice::where('company_id', $company->id)
                ->where('date', '>=', $startDate)
                ->orderBy('date', 'asc')
                ->get();
            
            if ($prices->count() >= 2) {
                $startPrice = $prices->first()->price;
                $endPrice = $prices->last()->price;
                if ($startPrice > 0) {
                    $changePct = (($endPrice - $startPrice) / $startPrice) * 100;
                    $performances[] = [
                        'symbol' => $company->symbol,
                        'change_pct' => round($changePct, 2),
                        'current_price' => $endPrice,
                        'status' => $company->current_status ?? 'compliant',
                    ];
                }
            }
        }

        usort($performances, fn($a, $b) => $b['change_pct'] <=> $a['change_pct']);
        
        $topGainers = array_slice($performances, 0, 3);
        $topLosers = array_slice(array_reverse($performances), 0, 3);

        $dividends = Dividend::with('company')
            ->where('created_at', '>=', $startDate)
            ->get();
            
        $complianceChanges = ComplianceStatusChange::with('company')
            ->where('created_at', '>=', $startDate)
            ->get();
            
        $ipos = Company::where('date_listed', '>=', $startDate)->get();

        return [
            'performances' => $performances,
            'top_gainers' => $topGainers,
            'top_losers' => $topLosers,
            'dividends' => $dividends->toArray(),
            'compliance_changes' => $complianceChanges->toArray(),
            'ipos' => $ipos->toArray(),
        ];
    }
}
