<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\ComplianceReview;
use App\Models\StockStatus;
use Illuminate\Http\Request;

class AdminComplianceController extends Controller
{
    public function index()
    {
        $reviews = ComplianceReview::with('company')->where('status', 'pending')->get();
        return response()->json($reviews);
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

