<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\BasketController;
use App\Http\Controllers\BrokerageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\TradeController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PriceAlertController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // ── Public Auth ──────────────────────────────────────────────────────
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);
        Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
        Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    });
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);

    // ── Public Data (no auth required) ───────────────────────────────────
    Route::get('/resources',                      [\App\Http\Controllers\ResourceController::class, 'index']);
    Route::get('/stocks',                         [StockController::class, 'index']);
    Route::get('/stocks/search',                  [StockController::class, 'search']);
    Route::get('/stocks/ngx',           [StockController::class, 'ngx']);
    Route::get('/stocks/baskets',                 [BasketController::class, 'index']);
    Route::get('/stocks/baskets/{basket}',        [BasketController::class, 'show']);
    Route::get('/disclosures',          [\App\Http\Controllers\Api\V1\CorporateDisclosureController::class, 'index']);
    Route::get('/news',                 [\App\Http\Controllers\NewsController::class, 'index']);
    Route::get('/stocks/{symbol}/analysis',       [StockController::class, 'getAiAnalysis']);

    // ── Protected Routes ─────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);

        // Custom Baskets
        Route::post('/stocks/baskets', [BasketController::class, 'store']);
        Route::delete('/stocks/baskets/{basket}', [BasketController::class, 'destroy']);
        Route::post('/stocks/baskets/{basket}/invest', [BasketController::class, 'invest']);

        // Profile
        Route::get('/profile',  [ProfileController::class, 'show']);
        Route::put('/profile',  [ProfileController::class, 'update']);
        Route::delete('/account', [AccountController::class, 'destroy']);

        // Products (Scanner & Search)
        Route::post('/scan',                          [ProductController::class, 'scan']);
        Route::get('/products/search',                [ProductController::class, 'search']);
        Route::post('/products',                      [ProductController::class, 'store']);
        Route::get('/products/{barcode}',             [ProductController::class, 'showByBarcode']);
        Route::put('/products/{product}/status',      [ProductController::class, 'updateStatus']);

        // ── Stocks ── (order matters: specific routes before {symbol} wildcard)
        // Baskets moved to public routes above
        Route::get('/stocks/check/{symbol}',          [StockController::class, 'check']);
        Route::put('/stocks/{symbol}/status',         [StockController::class, 'updateStatus']); // Scholar/Admin only (role checked in controller)

        // Brokerage
        Route::post('/brokerage/link',    [BrokerageController::class, 'link']);
        Route::get('/brokerage/accounts', [BrokerageController::class, 'accounts']);
        Route::post('/brokerage/trade',   [BrokerageController::class, 'trade']);

        // Portfolio & Trading
        Route::get('/portfolio', [PortfolioController::class, 'index']);
        Route::post('/broker/link', [TradeController::class, 'linkBroker']);
        Route::post('/portfolio/trade', [TradeController::class, 'executeTrade']);
        Route::post('/portfolio',              [PortfolioController::class, 'store']);
        Route::delete('/portfolio/{id}',       [PortfolioController::class, 'destroy']);

        // Watchlist
        Route::get('/watchlist',               [\App\Http\Controllers\WatchlistController::class, 'index']);
        Route::post('/watchlist',              [\App\Http\Controllers\WatchlistController::class, 'store']);
        Route::put('/watchlist/{symbol}',      [\App\Http\Controllers\WatchlistController::class, 'update']);
        Route::delete('/watchlist/{symbol}',   [\App\Http\Controllers\WatchlistController::class, 'destroy']);

        // Favorites
        Route::get('/favorites',               [\App\Http\Controllers\FavoriteController::class, 'index']);
        Route::post('/favorites',              [\App\Http\Controllers\FavoriteController::class, 'store']);
        Route::put('/favorites/{favorite}',    [\App\Http\Controllers\FavoriteController::class, 'update']);
        Route::delete('/favorites/{favorite}', [\App\Http\Controllers\FavoriteController::class, 'destroy']); // uses route model binding on {favorite} ID

        // History
        Route::get('/history',  [HistoryController::class, 'index']);
        Route::post('/history', [HistoryController::class, 'store']);

        // Price Alerts
        Route::get('/alerts', [PriceAlertController::class, 'index']);
        Route::post('/stocks/{symbol}/alerts', [PriceAlertController::class, 'store']);
        Route::delete('/alerts/{id}', [PriceAlertController::class, 'destroy']);

        // Notifications
        Route::post('/notifications/subscribe', function (Request $request) {
            $request->validate(['fcm_token' => 'required|string']);
            auth()->user()->update(['fcm_token' => $request->fcm_token]);
            return response()->json(['message' => 'Successfully subscribed to push notifications']);
        });
        Route::get('/notifications', function () {
            return response()->json(['data' => []]);
        });
    });

    // Public wildcard route placed after all other specific protected routes
    Route::get('/stocks/{symbol}', [StockController::class, 'show']);
});
