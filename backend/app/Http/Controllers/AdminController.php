<?php

namespace App\Http\Controllers;

use App\Models\AdminAlert;
use App\Models\Company;
use App\Models\News;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SquadService;
use App\Traits\ApiResponder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    use ApiResponder;

    /**
     * Get a paginated list of all users.
     */
    public function getUsers(Request $request)
    {
        $query = User::with('activeSubscription.plan')->latest();

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('institution_name', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);

        // Append computed tier and subscription info to each user
        $users->getCollection()->transform(function ($u) {
            $u->append(['tier', 'has_paid_subscription']);
            $sub = $u->activeSubscription;
            $u->active_plan_slug     = $u->tier?->slug ?? 'free';
            $u->active_plan_name     = $u->tier?->name ?? 'Miftah';
            $u->active_billing_cycle = $sub?->billing_cycle;
            $u->subscription_ends    = $sub?->renews_at?->toDateString();
            return $u;
        });

        return response()->json($users);
    }

    /**
     * Create a new user (admin or standard).
     */
    public function createAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'nullable|string|in:admin,user,scholar,institution',
            'institution_name' => 'nullable|string|max:255',
            'institution_type' => 'nullable|string|max:100',
            'plan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->input('role', 'admin'),
            'institution_name' => $request->input('institution_name'),
            'institution_type' => $request->input('institution_type'),
            'plan' => $request->input('plan', 'free'),
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $user,
        ], 201);
    }

    /**
     * Get a paginated list of unresolved admin alerts.
     */
    public function getAlerts(Request $request)
    {
        $alerts = AdminAlert::with('company')
            ->where('resolved', false)
            ->latest()
            ->paginate(20);

        return response()->json($alerts);
    }

    /**
     * Mark an admin alert as resolved.
     */
    public function resolveAlert($id)
    {
        $alert = AdminAlert::findOrFail($id);
        $alert->update(['resolved' => true]);

        return $this->success(null, 'Alert resolved successfully');
    }

    /**
     * Update user details (admin only).
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
            'role'  => 'sometimes|string|in:admin,user,scholar,institution',
            'institution_name' => 'nullable|string|max:255',
            'institution_type' => 'nullable|string|max:100',
            'plan'  => 'sometimes|string|in:free,paid',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'institution_name', 'institution_type', 'plan']));

        return $this->success($user, 'User updated successfully');
    }

    /**
     * Admin override: manually assign a subscription tier to any user.
     */
    public function overridePlan(Request $request, $id)
    {
        $request->validate([
            'plan_slug'     => 'required|string|exists:plans,slug',
            'billing_cycle' => 'nullable|in:quarterly,yearly',
            'expires_at'    => 'nullable|date|after:today',
            'note'          => 'nullable|string|max:255',
        ]);

        $user = User::with('activeSubscription.plan')->findOrFail($id);
        $previousSlug = $user->tier->slug ?? 'free';
        $adminName = $request->user()->name;

        // Cancel any existing active or past-due subscriptions
        $user->subscriptions()->whereIn('status', ['active', 'past_due'])->update([
            'status'  => 'canceled',
            'ends_at' => now(),
        ]);

        $plan = \App\Models\Plan::where('slug', $request->plan_slug)->firstOrFail();
        $billingCycle = $request->input('billing_cycle') ?: 'yearly';

        $expiresAt = null;
        if ($plan->slug !== 'free') {
            $expiresAt = $request->expires_at
                ? \Carbon\Carbon::parse($request->expires_at)
                : ($billingCycle === 'quarterly'
                    ? \Carbon\Carbon::now()->addMonths(3)
                    : \Carbon\Carbon::now()->addYear());

            \App\Models\Subscription::create([
                'user_id'       => $user->id,
                'plan_id'       => $plan->id,
                'billing_cycle' => $billingCycle,
                'gateway'       => 'admin_override',
                'auto_renew'    => false,
                'notes'         => $request->note
                    ? "admin_override_by_{$adminName}: {$request->note}"
                    : "admin_override_by_{$adminName}",
                'status'        => 'active',
                'renews_at'     => $expiresAt,
                'ends_at'       => null,
            ]);
        }

        \App\Services\SubscriptionService::syncUsageTrackingForPlanChange($user, $previousSlug);

        return response()->json([
            'message' => $expiresAt
                ? "Plan for {$user->name} overridden to {$plan->name} ({$billingCycle}, expires {$expiresAt->toDateString()}) by admin."
                : "Plan for {$user->name} reset to {$plan->name} by admin.",
            'plan'             => $plan->name,
            'active_plan_slug' => $plan->slug,
            'billing_cycle'    => $plan->slug !== 'free' ? $billingCycle : null,
            'expires'          => $expiresAt?->toDateString(),
        ]);
    }

    /**
     * Delete a user (admin only).
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->delete();

        return $this->success(null, 'User deleted successfully');
    }

    /**
     * Get user analytics data (admin only).
     */
    public function getUserAnalytics($id)
    {
        $user = User::findOrFail($id);
        
        $holdings = \App\Models\Holding::with('company')->where('user_id', $id)->get();
        $purifications = \App\Models\Purification::where('user_id', $id)->get();
        $screenedCount = \App\Models\History::where('user_id', $id)->where('action', 'check')->distinct('reference_id')->count('reference_id');
        $history = \App\Models\History::where('user_id', $id)->orderBy('created_at', 'desc')->take(200)->get();
        $priceAlerts = \App\Models\PriceAlert::where('user_id', $id)->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $user->plan,
                'joined_at' => $user->created_at,
            ],
            'holdings' => $holdings,
            'purifications' => $purifications,
            'screened_count' => $screenedCount,
            'recent_history' => $history,
            'price_alerts' => $priceAlerts,
        ]);
    }

    /**
     * Update Ticker About Info (admin only).
     */
    public function updateTickerAbout(Request $request, $symbol)
    {
        $company = Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'sector' => 'sometimes|string|max:255',
            'industry' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'overview' => 'sometimes|nullable|string',
            'asset_class' => 'sometimes|string|in:equity,mutual_fund',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($request->only(['name', 'sector', 'industry', 'description', 'overview', 'asset_class']));

        Cache::tags(['stocks'])->flush();

        return $this->success($company, 'Company details updated successfully');
    }

    /**
     * Add News to a Ticker (admin only).
     */
    public function addTickerNews(Request $request, $symbol)
    {
        $company = Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'url' => 'nullable|string',
            'source' => 'nullable|string|max:255',
            'thumbnail_url' => 'nullable|string',
            'excerpt' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $news = new News;
        $news->company_id = $company->id;
        $news->title = $request->title ?? 'Untitled News';
        $news->url = $request->url ?? '#';
        $news->source = $request->source ?? 'Manual Entry';
        $news->thumbnail_url = $request->thumbnail_url;
        $news->excerpt = $request->excerpt;
        $news->published_at = now();
        $news->save();

        Cache::tags(['stocks'])->flush();

        return response()->json(['message' => 'News added successfully', 'data' => $news]);
    }

    /**
     * Delete News from a Ticker (admin only).
     */
    public function deleteTickerNews($symbol, $newsId)
    {
        $company = Company::where('symbol', $symbol)->firstOrFail();
        $news = News::where('id', $newsId)->where('company_id', $company->id)->firstOrFail();

        $news->delete();

        Cache::tags(['stocks'])->flush();

        return $this->success(null, 'News deleted successfully');
    }

    /**
     * Export all tickers to CSV.
     */
    public function exportStocks()
    {
        // financial_screenings uses company_ticker (a symbol string, not company_id)
        // business_screenings uses company_id
        $companies = DB::table('companies')
            ->leftJoin('stock_statuses', 'companies.id', '=', 'stock_statuses.company_id')
            ->leftJoin('financial_screenings', function ($join) {
                $join->on('companies.symbol', '=', 'financial_screenings.company_ticker')
                    ->whereRaw('financial_screenings.created_at = (select max(fs2.created_at) from financial_screenings fs2 where fs2.company_ticker = companies.symbol)');
            })
            ->leftJoin('business_screenings', function ($join) {
                $join->on('companies.id', '=', 'business_screenings.company_id')
                    ->whereRaw('business_screenings.created_at = (select max(bs2.created_at) from business_screenings bs2 where bs2.company_id = companies.id)');
            })
            ->select(
                'companies.symbol',
                'companies.name',
                'stock_statuses.status as verdict',
                'stock_statuses.reason',
                'stock_statuses.verified_by_scholar',
                'business_screenings.business_compliance_status',
                'financial_screenings.calculation_results'
            )
            ->orderBy('companies.symbol')
            ->cursor();

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=stocks.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'Ticker', 'Name', 'Verdict', 'Reason', 'Business Activity',
            'Debt Ratio', 'Cash Ratio', 'Impermissible Income Ratio', 'Scholar Override',
        ];

        $callback = function () use ($companies, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns, ',', '"', '\\');

            foreach ($companies as $company) {
                $calc = [];
                if ($company->calculation_results) {
                    $calc = json_decode($company->calculation_results, true) ?? [];
                }
                $ratios = $calc['ratios'] ?? [];

                // Format ratios as readable percentages (stored as decimals e.g. 0.003 = 0.3%)
                $debtRatio = isset($ratios['interest_bearing_debt_ratio'])
                    ? round(floatval($ratios['interest_bearing_debt_ratio']) * 100, 4) : '';
                $cashRatio = isset($ratios['cash_and_equivalents_ratio'])
                    ? round(floatval($ratios['cash_and_equivalents_ratio']) * 100, 4) : '';
                $impureRatio = isset($ratios['non_permissible_income_ratio'])
                    ? round(floatval($ratios['non_permissible_income_ratio']) * 100, 4) : '';

                fputcsv($file, [
                    $company->symbol,
                    $company->name,
                    $company->verdict ?? 'unknown',
                    $company->reason ?? '',
                    $company->business_compliance_status ?? '',
                    $debtRatio,
                    $cashRatio,
                    $impureRatio,
                    $company->verified_by_scholar ? 'TRUE' : 'FALSE',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Preview CSV Import.
     */
    public function previewImport(Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt,xlsx,xls']);

        $file = $request->file('file');

        $rows = [];
        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            while (($data = fgetcsv($handle, 10000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        }

        $header = array_shift($rows); // Remove header

        $changes = [];
        foreach ($rows as $row) {
            if (count($row) < 9) {
                continue;
            } // Skip invalid rows

            $symbol = $row[0];
            $newVerdict = strtolower(trim($row[2]));
            $newReason = trim($row[3]);
            $newOverrideStr = strtoupper(trim($row[8]));
            $newOverride = ($newOverrideStr === 'TRUE' || $newOverrideStr === '1' || $newOverrideStr === 'YES');

            $company = Company::where('symbol', $symbol)->with('status')->first();
            if (! $company) {
                continue;
            } // Skip if ticker not found

            $currentVerdict = $company->status ? strtolower($company->status->status) : 'unknown';
            $currentReason = $company->status ? trim($company->status->reason) : '';
            $currentOverride = $company->status ? (bool) $company->status->verified_by_scholar : false;

            // Only flag if something important changed
            if ($newVerdict !== $currentVerdict || $newOverride !== $currentOverride || $newReason !== $currentReason) {
                $changes[] = [
                    'ticker' => $symbol,
                    'name' => $company->name,
                    'old_verdict' => $currentVerdict,
                    'new_verdict' => $newVerdict,
                    'old_override' => $currentOverride,
                    'new_override' => $newOverride,
                    'old_reason' => $currentReason,
                    'new_reason' => $newReason,
                ];
            }
        }

        return response()->json(['data' => $changes]);
    }

    /**
     * Confirm CSV Import changes.
     */
    public function confirmImport(Request $request)
    {
        $changes = $request->input('changes', []);
        $updatedCount = 0;

        foreach ($changes as $change) {
            $company = Company::where('symbol', $change['ticker'])->first();
            if (! $company) {
                continue;
            }

            DB::table('stock_statuses')->updateOrInsert(
                ['company_id' => $company->id],
                [
                    'status' => $change['new_verdict'],
                    'reason' => $change['new_reason'] ?? '',
                    'verified_by_scholar' => $change['new_override'],
                    'last_updated' => now(),
                    'updated_at' => now(),
                ]
            );

            DB::table('companies')->where('id', $company->id)->update([
                'current_status' => $change['new_verdict'],
            ]);

            Cache::tags(['stocks'])->flush();
            $updatedCount++;
        }

        Cache::tags(['stocks'])->flush();

        return response()->json(['message' => "Successfully updated $updatedCount tickers."]);
    }

    /**
     * Build the filtered payment transaction query shared by listing and CSV export.
     */
    private function buildFinancesQuery(Request $request)
    {
        $query = PaymentTransaction::with([
            'user:id,name,email',
            'plan:id,name,slug',
        ]);

        if ($search = trim((string) $request->input('search', ''))) {
            $pattern = '%' . strtolower($search) . '%';
            $query->where(function ($q) use ($pattern) {
                $q->whereRaw('LOWER(transaction_ref) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(COALESCE(gateway_ref, \'\')) LIKE ?', [$pattern])
                    ->orWhereHas('user', function ($uq) use ($pattern) {
                        $uq->whereRaw('LOWER(name) LIKE ?', [$pattern])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$pattern]);
                    });
            });
        }

        if (($status = $request->input('status')) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (($type = $request->input('type')) && $type !== 'all') {
            $query->where('type', $type);
        }

        if (($gateway = $request->input('gateway')) && $gateway !== 'all') {
            $query->where('gateway', $gateway);
        }

        if (($planSlug = $request->input('plan')) && $planSlug !== 'all') {
            $query->whereHas('plan', function ($pq) use ($planSlug) {
                $pq->where('slug', $planSlug);
            });
        }

        if (($billingCycle = $request->input('billing_cycle')) && $billingCycle !== 'all') {
            $query->where('billing_cycle', $billingCycle);
        }

        if ($dateFrom = trim((string) $request->input('date_from', ''))) {
            try {
                $start = Carbon::parse($dateFrom)->startOfDay();
                $query->whereRaw('COALESCE(paid_at, created_at) >= ?', [$start]);
            } catch (\Throwable $e) {
                // Ignore invalid date filter
            }
        }

        if ($dateTo = trim((string) $request->input('date_to', ''))) {
            try {
                $end = Carbon::parse($dateTo)->endOfDay();
                $query->whereRaw('COALESCE(paid_at, created_at) <= ?', [$end]);
            } catch (\Throwable $e) {
                // Ignore invalid date filter
            }
        }

        return $query;
    }

    /**
     * Get payment transaction ledger, revenue KPIs, and analytics charts for the Admin Finances tab.
     */
    public function getFinances(Request $request)
    {
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        $baseQuery = $this->buildFinancesQuery($request);

        $filteredCount = (clone $baseQuery)->count();
        $filteredSuccessKobo = (int) (clone $baseQuery)->where('status', 'success')->sum('amount_kobo');

        $transactions = (clone $baseQuery)
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->orderByDesc('id')
            ->paginate($perPage);

        $transactions->getCollection()->transform(function (PaymentTransaction $tx) {
            $tx->amount_ngn = round($tx->amount_kobo / 100, 2);
            return $tx;
        });

        $thirtyDaysAgo = now()->subDays(30);

        $totalSuccessKobo = (int) PaymentTransaction::where('status', 'success')->sum('amount_kobo');
        $last30dSuccessKobo = (int) PaymentTransaction::where('status', 'success')
            ->whereRaw('COALESCE(paid_at, created_at) >= ?', [$thirtyDaysAgo])
            ->sum('amount_kobo');

        $statusCounts = PaymentTransaction::select('status', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $successCount = (int) ($statusCounts['success'] ?? 0);
        $pendingCount = (int) ($statusCounts['pending'] ?? 0);
        $failedCount = (int) ($statusCounts['failed'] ?? 0);
        $totalCount = (int) $statusCounts->sum();

        $activePaidSubs = (int) Subscription::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('renews_at')->orWhere('renews_at', '>', now());
            })
            ->where('gateway', '!=', 'admin_override')
            ->whereHas('plan', fn ($pq) => $pq->where('slug', '!=', 'free'))
            ->count();

        $activeAdminOverrides = (int) Subscription::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('renews_at')->orWhere('renews_at', '>', now());
            })
            ->where('gateway', 'admin_override')
            ->whereHas('plan', fn ($pq) => $pq->where('slug', '!=', 'free'))
            ->count();

        // Monthly revenue chart for the last 6 months (computed in PHP for cross-DB compatibility)
        $sixMonthsStart = now()->startOfMonth()->subMonths(5);
        $monthlyBuckets = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i);
            $monthlyBuckets[$m->format('Y-m')] = [
                'month'        => $m->format('M Y'),
                'label'        => $m->format('M'),
                'revenue_ngn'  => 0.0,
                'transactions' => 0,
            ];
        }

        $recentSuccessRows = PaymentTransaction::with('plan:id,name,slug')
            ->where('status', 'success')
            ->whereRaw('COALESCE(paid_at, created_at) >= ?', [$sixMonthsStart])
            ->get(['id', 'plan_id', 'billing_cycle', 'amount_kobo', 'paid_at', 'created_at']);

        foreach ($recentSuccessRows as $row) {
            $ts = $row->paid_at ?? $row->created_at;
            if (!$ts) {
                continue;
            }
            $key = Carbon::parse($ts)->format('Y-m');
            if (isset($monthlyBuckets[$key])) {
                $monthlyBuckets[$key]['revenue_ngn'] = round(
                    $monthlyBuckets[$key]['revenue_ngn'] + ($row->amount_kobo / 100),
                    2
                );
                $monthlyBuckets[$key]['transactions']++;
            }
        }

        // All-time breakdown by plan & billing cycle for successful payments
        $byPlanRows = PaymentTransaction::with('plan:id,name,slug')
            ->where('status', 'success')
            ->select('plan_id', DB::raw('COUNT(*) as tx_count'), DB::raw('SUM(amount_kobo) as total_kobo'))
            ->groupBy('plan_id')
            ->get();

        $byPlan = $byPlanRows->map(function ($r) {
            return [
                'slug'        => $r->plan?->slug ?? 'unknown',
                'name'        => $r->plan?->name ?? 'Unknown',
                'count'       => (int) $r->tx_count,
                'revenue_ngn' => round(((int) $r->total_kobo) / 100, 2),
            ];
        })->sortByDesc('revenue_ngn')->values();

        $byCycleRows = PaymentTransaction::where('status', 'success')
            ->select('billing_cycle', DB::raw('COUNT(*) as tx_count'), DB::raw('SUM(amount_kobo) as total_kobo'))
            ->groupBy('billing_cycle')
            ->get();

        $byCycle = $byCycleRows->map(function ($r) {
            return [
                'cycle'       => $r->billing_cycle ?: 'unknown',
                'count'       => (int) $r->tx_count,
                'revenue_ngn' => round(((int) $r->total_kobo) / 100, 2),
            ];
        })->sortByDesc('revenue_ngn')->values();

        $summary = [
            'total_revenue_ngn'       => round($totalSuccessKobo / 100, 2),
            'revenue_30d_ngn'         => round($last30dSuccessKobo / 100, 2),
            'avg_ticket_ngn'          => $successCount > 0 ? round(($totalSuccessKobo / $successCount) / 100, 2) : 0,
            'success_rate'            => $totalCount > 0 ? round(($successCount / $totalCount) * 100, 1) : 0,
            'success_count'           => $successCount,
            'pending_count'           => $pendingCount,
            'failed_count'            => $failedCount,
            'total_count'             => $totalCount,
            'paying_users_count'      => (int) PaymentTransaction::where('status', 'success')
                ->distinct('user_id')
                ->count('user_id'),
            'active_paid_subs'        => $activePaidSubs,
            'active_admin_overrides'  => $activeAdminOverrides,
        ];

        return response()->json([
            'summary'         => $summary,
            'filtered_totals' => [
                'count'               => $filteredCount,
                'success_revenue_ngn' => round($filteredSuccessKobo / 100, 2),
            ],
            'charts'          => [
                'monthly_revenue' => array_values($monthlyBuckets),
                'by_plan'         => $byPlan,
                'by_cycle'        => $byCycle,
            ],
            'transactions'    => $transactions,
        ]);
    }

    /**
     * Stream all filtered payment transactions as a CSV download.
     */
    public function exportFinancesCsv(Request $request)
    {
        $rows = $this->buildFinancesQuery($request)
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->orderByDesc('id')
            ->get();

        $filename = 'irshad-finances-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'ID',
                'User Name',
                'User Email',
                'Plan',
                'Plan Slug',
                'Billing Cycle',
                'Amount (NGN)',
                'Currency',
                'Status',
                'Type',
                'Gateway',
                'Transaction Ref',
                'Gateway Ref',
                'Paid At',
                'Created At',
            ]);

            foreach ($rows as $tx) {
                fputcsv($handle, [
                    $tx->id,
                    $tx->user?->name ?? '',
                    $tx->user?->email ?? '',
                    $tx->plan?->name ?? '',
                    $tx->plan?->slug ?? '',
                    $tx->billing_cycle ?? '',
                    number_format($tx->amount_kobo / 100, 2, '.', ''),
                    $tx->currency ?? 'NGN',
                    $tx->status ?? '',
                    $tx->type ?? '',
                    $tx->gateway ?? '',
                    $tx->transaction_ref ?? '',
                    $tx->gateway_ref ?? '',
                    $tx->paid_at?->toIso8601String() ?? '',
                    $tx->created_at?->toIso8601String() ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Manually reconcile a pending transaction against Squad and activate subscription if paid.
     */
    public function verifyFinanceTransaction(int $id, SquadService $squad)
    {
        $tx = PaymentTransaction::with(['user:id,name,email', 'plan:id,name,slug'])->find($id);
        if (!$tx) {
            return response()->json(['message' => 'Payment transaction not found.'], 404);
        }

        if ($tx->status === 'success') {
            $tx->amount_ngn = round($tx->amount_kobo / 100, 2);
            return response()->json([
                'status'      => 'success',
                'message'     => 'Transaction is already marked as successful.',
                'transaction' => $tx,
            ]);
        }

        if ($tx->gateway !== 'squad') {
            return response()->json(['message' => 'Gateway verification is only supported for Squad transactions.'], 422);
        }

        if (!$squad->isConfigured()) {
            return response()->json(['message' => 'Squad payment gateway is not configured.'], 503);
        }

        $data = $squad->verifyTransaction($tx->transaction_ref);
        if (!$data) {
            return response()->json([
                'status'      => 'pending',
                'message'     => 'Squad did not return a confirmed status yet. Transaction remains pending.',
                'transaction' => $tx,
            ]);
        }

        $gatewayStatus = strtolower((string) ($data['transaction_status'] ?? ''));
        $paidAmountKobo = (int) ($data['transaction_amount'] ?? 0);

        if ($gatewayStatus === 'success') {
            if ($paidAmountKobo < $tx->amount_kobo) {
                $tx->update(['status' => 'failed', 'raw_payload' => $data]);
                $tx->refresh()->load(['user:id,name,email', 'plan:id,name,slug']);
                $tx->amount_ngn = round($tx->amount_kobo / 100, 2);

                return response()->json([
                    'status'      => 'failed',
                    'message'     => 'Paid amount mismatch detected from Squad; marked transaction as failed.',
                    'transaction' => $tx,
                ], 422);
            }

            $sub = $squad->activateFromTransaction($tx, $data);
            $tx->refresh()->load(['user:id,name,email', 'plan:id,name,slug']);
            $tx->amount_ngn = round($tx->amount_kobo / 100, 2);

            return response()->json([
                'status'       => 'success',
                'message'      => 'Payment verified with Squad and user subscription activated.',
                'transaction'  => $tx,
                'subscription' => [
                    'id'        => $sub->id,
                    'status'    => $sub->status,
                    'renews_at' => $sub->renews_at?->toDateString(),
                ],
            ]);
        }

        if (in_array($gatewayStatus, ['failed', 'abandoned', 'declined'], true)) {
            $tx->update(['status' => 'failed', 'raw_payload' => $data]);
            $tx->refresh()->load(['user:id,name,email', 'plan:id,name,slug']);
            $tx->amount_ngn = round($tx->amount_kobo / 100, 2);

            return response()->json([
                'status'      => 'failed',
                'message'     => 'Squad reported transaction as ' . $gatewayStatus . '; marked as failed.',
                'transaction' => $tx,
            ]);
        }

        $tx->update(['raw_payload' => $data]);
        $tx->refresh()->load(['user:id,name,email', 'plan:id,name,slug']);
        $tx->amount_ngn = round($tx->amount_kobo / 100, 2);

        return response()->json([
            'status'      => 'pending',
            'message'     => 'Squad still shows this payment as processing (' . ($gatewayStatus ?: 'pending') . ').',
            'transaction' => $tx,
        ]);
    }
}
