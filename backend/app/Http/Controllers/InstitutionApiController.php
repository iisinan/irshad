<?php

namespace App\Http\Controllers;

use App\Models\Basket;
use App\Models\Company;
use App\Models\InstitutionalApiKey;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InstitutionApiController extends Controller
{
    use ApiResponder;

    /**
     * List API keys belonging to the authenticated institution.
     */
    public function listKeys(Request $request): JsonResponse
    {
        $keys = InstitutionalApiKey::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($k) => [
                'id' => $k->id,
                'name' => $k->name,
                'key_prefix' => $k->key_prefix,
                'scopes' => $k->scopes ?? ['pretrade:check', 'portfolio:screen', 'universe:read'],
                'last_used_at' => $k->last_used_at?->toISOString(),
                'expires_at' => $k->expires_at?->toISOString(),
                'revoked_at' => $k->revoked_at?->toISOString(),
                'is_active' => $k->isActive(),
                'created_at' => $k->created_at?->toISOString(),
            ]);

        return $this->success($keys);
    }

    /**
     * Generate a new institutional API key (plaintext returned once).
     */
    public function createKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'scopes' => 'nullable|array',
            'scopes.*' => 'string|in:pretrade:check,portfolio:screen,purification:read,universe:read',
            'expires_in_days' => 'nullable|integer|min:1|max:1095',
        ]);

        $plainKey = 'irsh_live_' . Str::random(36);
        $prefix = substr($plainKey, 0, 16) . '••••';

        $record = InstitutionalApiKey::create([
            'user_id' => $request->user()->id,
            'name' => trim($validated['name']),
            'key_prefix' => $prefix,
            'key_hash' => hash('sha256', $plainKey),
            'scopes' => $validated['scopes'] ?? ['pretrade:check', 'portfolio:screen', 'purification:read', 'universe:read'],
            'expires_at' => ! empty($validated['expires_in_days'])
                ? now()->addDays((int) $validated['expires_in_days'])
                : null,
        ]);

        return $this->success([
            'api_key' => [
                'id' => $record->id,
                'name' => $record->name,
                'key_prefix' => $record->key_prefix,
                'scopes' => $record->scopes,
                'expires_at' => $record->expires_at?->toISOString(),
                'is_active' => true,
                'created_at' => $record->created_at?->toISOString(),
            ],
            'plain_text_key' => $plainKey,
        ], 'API key generated. Copy it now — it will not be shown again.', 201);
    }

    /**
     * Revoke an institutional API key.
     */
    public function revokeKey(Request $request, int $id): JsonResponse
    {
        $key = InstitutionalApiKey::where('user_id', $request->user()->id)->findOrFail($id);
        $key->update(['revoked_at' => now()]);

        return $this->success(null, 'API key revoked.');
    }

    /**
     * B2B Pre-Trade Compliance Guardrail for broker order management systems.
     * GET /api/v1/b2b/stocks/{symbol}/pre-trade-check?units=1000
     */
    public function preTradeCheck(Request $request, string $symbol): JsonResponse
    {
        $units = max(1, (float) $request->query('units', 1000));
        $controller = app(InstitutionController::class);
        $evaluated = $controller->evaluateHoldingsArray([
            ['symbol' => $symbol, 'shares' => $units],
        ]);

        $item = $evaluated['holdings'][0] ?? null;
        if (! $item || $item['status'] === 'unmapped') {
            return $this->error("Ticker '{$symbol}' was not found in Irshad's NGX equity universe.", 404);
        }

        $allowed = $item['status'] === 'halal';
        $suggestions = $evaluated['rebalancing_suggestions'][0]['replacements'] ?? [];

        return $this->success([
            'symbol' => $item['symbol'],
            'input_symbol' => $item['input_symbol'],
            'name' => $item['name'],
            'sector' => $item['sector'],
            'order_allowed' => $allowed,
            'guardrail_action' => $allowed ? 'APPROVE' : 'BLOCK',
            'verdict' => $item['status'],
            'latest_price' => $item['current_price'],
            'estimated_order_value' => $item['market_value'],
            'aaoifi_ratios' => [
                'debt_ratio' => $item['debt_ratio'],
                'cash_ratio' => $item['cash_ratio'],
                'impure_income_ratio' => $item['impure_ratio'],
            ],
            'near_threshold_warning' => $item['is_near_threshold'],
            'purification_required' => $item['purification_required'],
            'estimated_purification_per_unit' => $item['purification_per_unit'],
            'reporting_period' => $item['reporting_period'],
            'reason' => $item['business_summary'],
            'compliant_alternatives' => $allowed ? [] : $suggestions,
        ]);
    }

    /**
     * B2B Programmatic Portfolio Screening & Purification JSON API.
     * POST /api/v1/b2b/portfolio/screen
     */
    public function screenBook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holdings' => 'required|array|min:1|max:250',
            'holdings.*.symbol' => 'required|string|max:64',
            'holdings.*.shares' => 'required|numeric|min:0',
            'holdings.*.avg_price' => 'nullable|numeric|min:0',
        ]);

        $controller = app(InstitutionController::class);
        $result = $controller->evaluateHoldingsArray($validated['holdings']);

        return $this->success($result, 'Portfolio screened successfully.');
    }

    /**
     * B2B Compliant Equity Universe & Curated Model Baskets feed.
     * GET /api/v1/b2b/stocks/compliant-universe
     */
    public function compliantUniverse(): JsonResponse
    {
        $stocks = Company::with('aaoifiScreening')
            ->where(function ($q) {
                $q->where('asset_class', 'equity')->orWhereNull('asset_class');
            })
            ->where(function ($q) {
                $q->whereIn('current_status', ['halal', 'compliant'])
                    ->orWhereHas('aaoifiScreening', fn ($sq) => $sq->whereIn('final_status', ['halal', 'compliant']));
            })
            ->orderByDesc('market_cap')
            ->get(['id', 'symbol', 'name', 'sector', 'latest_price', 'price_change_pct', 'market_cap'])
            ->map(function ($c) {
                $s = $c->aaoifiScreening;
                return [
                    'symbol' => $c->symbol,
                    'name' => $c->name,
                    'sector' => ucwords(strtolower((string) ($c->sector ?: 'Equities'))),
                    'latest_price' => (float) ($c->latest_price ?? 0),
                    'market_cap' => (float) ($c->market_cap ?? 0),
                    'impure_ratio' => $s ? round((float) $s->impermissible_income_ratio, 2) : 0,
                    'debt_ratio' => $s ? round((float) $s->debt_ratio, 2) : null,
                    'cash_ratio' => $s ? round((float) $s->cash_ratio, 2) : null,
                ];
            });

        $baskets = [];
        try {
            $baskets = Basket::select(['id', 'name', 'description'])
                ->limit(10)
                ->get()
                ->toArray();
        } catch (\Throwable $e) {
            $baskets = [];
        }

        return $this->success([
            'compliant_count' => $stocks->count(),
            'stocks' => $stocks,
            'model_baskets' => $baskets,
        ]);
    }
}
