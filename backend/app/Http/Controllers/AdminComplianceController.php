<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ComplianceReview;
use App\Models\ComplianceHistory;
use App\Models\StockStatus;

class AdminComplianceController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $query = ComplianceReview::with(['company', 'company.aaoifiScreening', 'company.latestFinancial'])
            ->where('status', 'pending');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('company', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('symbol', 'like', "%{$search}%");
            });
        }

        if ($request->filled('filter') && $request->input('filter') !== 'all') {
            $filter = $request->input('filter');
            if ($filter === 'to-halal') {
                $query->where('new_status', 'halal');
            } elseif ($filter === 'to-nonhalal') {
                $query->where('new_status', 'non-halal');
            }
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate($perPage);
        return response()->json($reviews);
    }

    public function getStats()
    {
        $totalStocks = \App\Models\Company::count();
        $halalStocks = \App\Models\Company::where('current_status', 'halal')->count();
        $nonHalalStocks = \App\Models\Company::where('current_status', 'non-halal')->count();
        $doubtfulStocks = \App\Models\Company::where('current_status', 'doubtful')->count();
        $pendingReviews = ComplianceReview::where('status', 'pending')->count();

        return response()->json([
            'total_stocks' => $totalStocks,
            'halal_stocks' => $halalStocks,
            'non_halal_stocks' => $nonHalalStocks,
            'doubtful_stocks' => $doubtfulStocks,
            'pending_reviews' => $pendingReviews,
        ]);
    }

    public function history(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $history = ComplianceReview::with(['company', 'company.aaoifiScreening', 'company.latestFinancial', 'reviewer'])
            ->whereIn('status', ['approved', 'rejected'])
            ->orderBy('reviewed_at', 'desc')
            ->paginate($perPage);
            
        // Map the paginated items to the desired format
        $history->getCollection()->transform(function ($r) {
            return [
                'id'           => $r->id,
                'company'      => clone $r->company, // Keep the full company object so aaoifiScreening is available
                'old_status'   => $r->old_status,
                'new_status'   => $r->new_status,
                'reason'       => $r->reason,
                'payload'      => $r->payload,
                'status'       => $r->status,
                'reviewed_by'  => $r->reviewer?->name ?? 'Admin',
                'reviewed_at'  => $r->reviewed_at,
                'created_at'   => $r->created_at,
            ];
        });
        
        return response()->json($history);
    }
    
    public function systemLogs(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $logs = ComplianceHistory::with(['company', 'company.aaoifiScreening'])
            ->where('reason', 'like', '%(Auto-applied)%')
            ->orderBy('changed_at', 'desc')
            ->paginate($perPage);
        return response()->json($logs);
    }

    public function bulkApprove(Request $request)
    {
        $ids = $request->input('ids', []);
        $approved = 0;
        foreach ($ids as $id) {
            try {
                $review = ComplianceReview::findOrFail($id);
                if ($review->status !== 'pending') continue;
                $company = $review->company;
                if (!empty($review->payload)) {
                    $financial = \App\Models\Financial::updateOrCreate(['company_id' => $company->id], $review->payload);
                    $complianceService = app(\App\Services\AaoifiComplianceService::class);
                    $complianceService->evaluateCompliance($company, $financial, $company->sector);
                }

                if ($review->new_status && $review->new_status !== $review->old_status) {
                    $company->update(['current_status' => $review->new_status]);
                    StockStatus::updateOrCreate(
                        ['company_id' => $company->id],
                        ['status' => $review->new_status, 'reason' => $review->reason, 'verified_by_scholar' => true, 'last_updated' => now()]
                    );
                    $aaoifi = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
                    if ($aaoifi) $aaoifi->update(['final_status' => $review->new_status]);
                }
                
                ComplianceHistory::create(['company_id' => $company->id, 'old_status' => $review->old_status, 'new_status' => $review->new_status, 'reason' => $review->reason, 'changed_at' => now()]);
                $review->update(['status' => 'approved', 'reviewed_by' => auth()->id(), 'reviewed_at' => now()]);
                $approved++;
            } catch (\Exception $e) { continue; }
        }
        return response()->json(['message' => "Approved {$approved} reviews"]);
    }

    public function bulkReject(Request $request)
    {
        $ids = $request->input('ids', []);
        $rejected = 0;
        foreach ($ids as $id) {
            try {
                $review = ComplianceReview::findOrFail($id);
                if ($review->status !== 'pending') continue;
                $review->update(['status' => 'rejected', 'reviewed_by' => auth()->id(), 'reviewed_at' => now()]);
                $rejected++;
            } catch (\Exception $e) { continue; }
        }
        return response()->json(['message' => "Rejected {$rejected} reviews"]);
    }

    public function approve(Request $request, $id)
    {
        $review = ComplianceReview::findOrFail($id);
        
        if ($review->status !== 'pending') {
            return response()->json(['error' => 'Review is not pending'], 400);
        }

        // Allow admin to override the status and reason during approval
        $finalStatus = $request->input('new_status', $review->new_status);
        $finalReason = $request->input('reason', $review->reason);

        // Apply changes
        $company = $review->company;
        
        // Apply the financial payload if it exists
        if (!empty($review->payload)) {
            $financial = \App\Models\Financial::updateOrCreate(
                ['company_id' => $company->id],
                $review->payload
            );
            
            // Re-evaluate full AAOIFI compliance now that financials are saved
            $complianceService = app(\App\Services\AaoifiComplianceService::class);
            $complianceService->evaluateCompliance($company, $financial, $company->sector);
        }

        // Apply manual status changes
        if ($finalStatus && $finalStatus !== $review->old_status) {
            $company->update(['current_status' => $finalStatus]);

            StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'status' => $finalStatus,
                    'reason' => $finalReason,
                    'verified_by_scholar' => true, // Admin manually approved/edited this
                    'last_updated' => now(),
                ]
            );

            $aaoifiScreening = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
            if ($aaoifiScreening) {
                $aaoifiScreening->update(['final_status' => $finalStatus]);
            }
        }

        \App\Models\ComplianceHistory::create([
            'company_id' => $company->id,
            'old_status' => $review->old_status,
            'new_status' => $finalStatus,
            'reason' => $finalReason,
            'changed_at' => now(),
        ]);

        $review->update([
            'new_status' => $finalStatus,
            'reason' => $finalReason,
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Review approved and applied', 'review' => $review]);
    }

    public function reject($id)
    {
        $review = ComplianceReview::findOrFail($id);

        if ($review->status !== 'pending') {
            return response()->json(['error' => 'Review is not pending'], 400);
        }

        $review->update([
            'status'      => 'rejected',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Review rejected', 'review' => $review]);
    }

    /**
     * One-click Approve from email button (no login required — validated by UUID).
     */
    public function approveViaLink(Request $request, $id)
    {
        $review = ComplianceReview::findOrFail($id);

        if ($review->status !== 'pending') {
            return response('<h2 style="font-family:Arial">⚠️ This review has already been actioned.</h2>', 200)
                ->header('Content-Type', 'text/html');
        }

        $company = $review->company;
        
        if (!empty($review->payload)) {
            $financial = $company->latestFinancial;
            if ($financial) {
                $financial->update($review->payload);
            } else {
                $financial = \App\Models\Financial::create(array_merge(
                    ['company_id' => $company->id],
                    $review->payload
                ));
            }
            $complianceService = app(\App\Services\AaoifiComplianceService::class);
            $complianceService->evaluateCompliance($company, $financial, $company->sector);
        }

        $company->update(['current_status' => $review->new_status]);

        StockStatus::updateOrCreate(
            ['company_id' => $company->id],
            [
                'status'             => $review->new_status,
                'reason'             => $review->reason,
                'verified_by_scholar'=> true,
                'last_updated'       => now(),
            ]
        );

        $aaoifiScreening = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifiScreening) {
            $aaoifiScreening->update(['final_status' => $review->new_status]);
        }

        \App\Models\ComplianceHistory::create([
            'company_id' => $company->id,
            'old_status' => $review->old_status,
            'new_status' => $review->new_status,
            'reason'     => $review->reason,
            'changed_at' => now(),
        ]);

        $review->update([
            'status'      => 'approved',
            'reviewed_at' => now(),
        ]);

        return response('<h2 style="font-family:Arial;color:green">✅ Status change approved and applied to the live app.</h2>', 200)
            ->header('Content-Type', 'text/html');
    }

    /**
     * One-click Reject from email button (no login required — validated by UUID).
     */
    public function rejectViaLink(Request $request, $id)
    {
        $review = ComplianceReview::findOrFail($id);

        if ($review->status !== 'pending') {
            return response('<h2 style="font-family:Arial">⚠️ This review has already been actioned.</h2>', 200)
                ->header('Content-Type', 'text/html');
        }

        $review->update([
            'status'      => 'rejected',
            'reviewed_at' => now(),
        ]);

        return response('<h2 style="font-family:Arial;color:crimson">❌ Change rejected. The current stock status remains unchanged.</h2>', 200)
            ->header('Content-Type', 'text/html');
    }
}
