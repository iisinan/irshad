<?php

namespace App\Http\Controllers;

use App\Models\FinancialReviewQueue;
use App\Models\AaoifiScreening;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class FinancialReviewQueueController extends Controller
{
    /**
     * Display a listing of pending financial reviews.
     */
    public function index()
    {
        $queue = FinancialReviewQueue::with('company:id,name,symbol,market_cap')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $queue
        ]);
    }

    /**
     * Approve the extraction and update AAOIFI screening.
     */
    public function approve($id, Request $request)
    {
        $queueItem = FinancialReviewQueue::findOrFail($id);

        if ($queueItem->status !== 'pending') {
            return response()->json(['message' => 'Item is not pending.'], 400);
        }

        $screening = AaoifiScreening::where('company_id', $queueItem->company_id)->first();
        if (! $screening) {
            return response()->json(['message' => 'AAOIFI screening record not found for company.'], 404);
        }

        $extractedData = $queueItem->extracted_data;

        // Optionally, allow the admin to pass modified extracted_data in the request
        if ($request->has('extracted_data')) {
            $extractedData = $request->input('extracted_data');
            $queueItem->extracted_data = $extractedData;
        }

        // Push data to screening table so the Math command can process it
        $screening->financial_data_used = $extractedData;
        $screening->disclosure_id = $queueItem->disclosure_id;
        $screening->reporting_year = $extractedData['financial_year'] ?? null;
        $screening->reporting_period = $extractedData['reporting_period'] ?? null;
        $screening->published_date = $extractedData['published_date'] ?? null;
        // Note: pdf_hash is not tracked in the queue table, so it will remain whatever it was. 
        // This is acceptable as a manual approval overrides the automated hash freshness guard.
        $screening->save();

        // Enforce math to update final statuses
        Artisan::call('compliance:enforce-math');

        // Mark as approved
        $queueItem->status = 'approved';
        $queueItem->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Review approved and compliance recalculated.'
        ]);
    }

    /**
     * Reject the extraction.
     */
    public function reject($id)
    {
        $queueItem = FinancialReviewQueue::findOrFail($id);

        if ($queueItem->status !== 'pending') {
            return response()->json(['message' => 'Item is not pending.'], 400);
        }

        $queueItem->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Review rejected.'
        ]);
    }
}
