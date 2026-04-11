<?php

namespace App\Http\Controllers;

use App\Models\Basket;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BasketController extends Controller
{
    use ApiResponder;

    /**
     * List all active baskets.
     */
    public function index(): JsonResponse
    {
        $baskets = Basket::where('is_active', true)->get();
        return $this->success($baskets);
    }

    /**
     * Show details for a specific basket.
     */
    public function show(Basket $basket): JsonResponse
    {
        return $this->success($basket);
    }
}
