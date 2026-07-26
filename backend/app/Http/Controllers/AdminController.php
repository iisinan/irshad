<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AdminAlert;
use App\Traits\ApiResponder;
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
        $query = User::latest();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);
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
            'role' => 'nullable|string|in:admin,user',
            'plan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->input('role', 'admin'),
            'plan' => $request->input('plan', 'free'),
        ]);

        return response()->json([
            'message' => 'Admin account created successfully.',
            'user' => $user
        ], 201);
    }

    /**
     * Get all unresolved admin alerts.
     */
    public function getAlerts()
    {
        $alerts = \Illuminate\Support\Facades\Cache::remember('admin.alerts', 300, function () {
            return AdminAlert::with('company')->where('resolved', false)->latest()->get();
        });
        return $this->success($alerts);
    }

    /**
     * Mark an admin alert as resolved.
     */
    public function resolveAlert($id)
    {
        $alert = AdminAlert::findOrFail($id);
        $alert->update(['resolved' => true]);
        \Illuminate\Support\Facades\Cache::forget('admin.alerts');
        return $this->success(null, 'Alert resolved successfully');
    }
    /**
     * Update user details (admin only).
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|string|in:admin,user',
            'plan' => 'sometimes|string|in:free,paid',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'plan']));

        return $this->success($user, 'User updated successfully');
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
     * Update Ticker About Info (admin only).
     */
    public function updateTickerAbout(Request $request, $symbol)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'sector' => 'sometimes|string|max:255',
            'industry' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'overview' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($request->only(['name', 'sector', 'industry', 'description', 'overview']));

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($company, 'Company details updated successfully');
    }

    /**
     * Add News to a Ticker (admin only).
     */
    public function addTickerNews(Request $request, $symbol)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'url' => 'required|url',
            'source' => 'required|string|max:255',
            'thumbnail_url' => 'nullable|url',
            'excerpt' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $news = \App\Models\News::create([
            'company_id' => $company->id,
            'title' => $request->title,
            'url' => $request->url,
            'source' => $request->source,
            'thumbnail_url' => $request->thumbnail_url,
            'excerpt' => $request->excerpt,
            'published_at' => now(),
        ]);

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}_v2");

        return response()->json(['message' => 'News added successfully', 'data' => $news]);
    }

    /**
     * Delete News from a Ticker (admin only).
     */
    public function deleteTickerNews($symbol, $newsId)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();
        $news = \App\Models\News::where('id', $newsId)->where('company_id', $company->id)->firstOrFail();
        
        $news->delete();

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

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
            ->get();
        
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=stocks.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];
        
        $columns = [
            'Ticker', 'Name', 'Verdict', 'Reason', 'Business Activity',
            'Debt Ratio', 'Cash Ratio', 'Impermissible Income Ratio', 'Scholar Override'
        ];
        
        $callback = function() use($companies, $columns) {
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
                    $company->verified_by_scholar ? 'TRUE' : 'FALSE'
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
        if (($handle = fopen($file->getRealPath(), "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
                $rows[] = $data;
            }
            fclose($handle);
        }
        
        $header = array_shift($rows); // Remove header
        
        $changes = [];
        foreach ($rows as $row) {
            if (count($row) < 9) continue; // Skip invalid rows
            
            $symbol = $row[0];
            $newVerdict = strtolower(trim($row[2]));
            $newReason = trim($row[3]);
            $newOverrideStr = strtoupper(trim($row[8]));
            $newOverride = ($newOverrideStr === 'TRUE' || $newOverrideStr === '1' || $newOverrideStr === 'YES');
            
            $company = \App\Models\Company::where('symbol', $symbol)->with('status')->first();
            if (!$company) continue; // Skip if ticker not found
            
            $currentVerdict = $company->status ? strtolower($company->status->status) : 'unknown';
            $currentReason = $company->status ? trim($company->status->reason) : '';
            $currentOverride = $company->status ? (bool)$company->status->verified_by_scholar : false;
            
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
                    'new_reason' => $newReason
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
            $company = \App\Models\Company::where('symbol', $change['ticker'])->first();
            if (!$company) continue;
            
            \Illuminate\Support\Facades\DB::table('stock_statuses')->updateOrInsert(
                ['company_id' => $company->id],
                [
                    'status' => $change['new_verdict'],
                    'reason' => $change['new_reason'] ?? '',
                    'verified_by_scholar' => $change['new_override'],
                    'last_updated' => now(),
                    'updated_at' => now(),
                ]
            );
            
            \Illuminate\Support\Facades\DB::table('companies')->where('id', $company->id)->update([
                'current_status' => $change['new_verdict']
            ]);
            
            Cache::forget("stocks.show.{$company->symbol}");
            Cache::forget("stocks.show.{$company->symbol}_v2");
            Cache::forget("aaoifi_stage1_{$company->symbol}"); // Clear analysis page cache too
            $updatedCount++;
        }
        
        \Illuminate\Support\Facades\Cache::forget('stocks.index_v6');
        
        return response()->json(['message' => "Successfully updated $updatedCount tickers."]);
    }
}
