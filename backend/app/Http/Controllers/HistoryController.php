<?php

namespace App\Http\Controllers;

use App\Models\History;
use App\Models\Product;
use App\Models\Company;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HistoryController extends Controller
{
    use ApiResponder;

    /**
     * Get user's activity history.
     */
    public function index(Request $request): JsonResponse
    {
        $query = History::where('user_id', Auth::id())->latest();

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $history = $query->paginate(20);

        $results = collect($history->items());
        
        $scanRefs = $results->where('action', 'scan')->pluck('reference_id')->unique();
        $otherRefs = $results->where('action', '!=', 'scan')->pluck('reference_id')->unique();
        
        $products = Product::whereIn('barcode', $scanRefs)->get()->keyBy('barcode');
        $companies = Company::whereIn('symbol', $otherRefs)->get()->keyBy('symbol');

        $formatted = $results->map(function ($item) use ($products, $companies) {
            if ($item->action === 'scan') {
                $detail = $products->get($item->reference_id);
            } else {
                $detail = $companies->get($item->reference_id);
                if ($detail) {
                    $detail->status = $detail->current_status ? ['status' => $detail->current_status] : null;
                }
            }

            return [
                'id' => $item->id,
                'action' => $item->action,
                'detail' => $detail,
                'created_at' => $item->created_at,
            ];
        });

        return $this->success([
            'history' => $formatted,
            'meta' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
            ],
        ]);
    }

    /**
     * Track a user action.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:scan,check',
            'reference_id' => 'required|string',
        ]);

        $history = History::create([
            'user_id' => Auth::id(),
            'action' => $validated['action'],
            'reference_id' => $validated['reference_id'],
        ]);

        return $this->success($history, 'Action tracked', 201);
    }
}
