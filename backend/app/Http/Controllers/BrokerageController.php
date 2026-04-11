<?php

namespace App\Http\Controllers;

use App\Models\BrokerageAccount;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BrokerageController extends Controller
{
    use ApiResponder;

    /**
     * Link a new brokerage account.
     */
    public function link(Request $request): JsonResponse
    {
        $request->validate([
            'broker_name' => 'required|string',
            'access_token' => 'required|string',
        ]);

        $account = BrokerageAccount::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'broker_name' => $request->broker_name,
            ],
            [
                'access_token' => $request->access_token,
                'refresh_token' => $request->refresh_token,
                'account_id' => $request->account_id,
                'status' => 'active',
            ]
        );

        return $this->success($account, 'Brokerage account linked successfully.');
    }

    /**
     * Get linked brokerage accounts.
     */
    public function accounts(): JsonResponse
    {
        $accounts = BrokerageAccount::where('user_id', Auth::id())->get();
        return $this->success($accounts);
    }

    /**
     * Deep link to trade on a legacy broker.
     */
    public function trade(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => 'required|string',
            'broker_name' => 'required|string',
        ]);

        // Logic to generate deep link URL for specific brokers
        $brokerUrls = [
            'robinhood' => "https://robinhood.com/stocks/{$request->symbol}",
            'etrade' => "https://us.etrade.com/e/t/invest/trading?symbol={$request->symbol}",
            'risevest' => "rise://trade?symbol={$request->symbol}",
        ];

        $url = $brokerUrls[strtolower($request->broker_name)] ?? null;

        if (!$url) {
            return $this->error('Deep link not available for this broker.', 404);
        }

        return $this->success(['url' => $url]);
    }
}
