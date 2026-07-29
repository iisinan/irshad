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
use App\Http\Controllers\BillingController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\PriceAlertController;
use App\Http\Controllers\SettingsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // ── Public Auth ──────────────────────────────────────────────────────
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    
    Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])->name('verification.verify');
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);
    Route::get('/clear-cache-temp', function () {
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
        return 'Cache cleared';
    });

    // ── Public Data (no auth required) ───────────────────────────────────
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/resources',                      [\App\Http\Controllers\ResourceController::class, 'index']);
        Route::get('/settings',                       [SettingsController::class, 'index']);
        Route::get('/stocks',                         [StockController::class, 'index']);
        Route::get('/stocks/compliance-changes',      [StockController::class, 'complianceChanges']);
        Route::get('/sectors',                        [\App\Http\Controllers\SectorController::class, 'index']);
        Route::get('/stocks/search',                  [StockController::class, 'search']);
        Route::get('/stocks/ngx',           [StockController::class, 'ngx']);
        Route::get('/stocks/baskets',                 [BasketController::class, 'index']);
        Route::get('/stocks/baskets/{basket}',        [BasketController::class, 'show']);
        Route::get('/disclosures',          [\App\Http\Controllers\Api\V1\CorporateDisclosureController::class, 'index']);
        Route::get('/news',                 [\App\Http\Controllers\NewsController::class, 'index']);
        Route::get('/stocks/{symbol}/analysis',       [StockController::class, 'getAiAnalysis']);
        Route::get('/stocks/{symbol}/aaoifi-screening', [StockController::class, 'aaoifiScreening']);
    });

    // One-click email link routes — no login required, UUID is the security token
    Route::get('/admin/compliance-reviews/{id}/approve-link', [\App\Http\Controllers\AdminComplianceController::class, 'approveViaLink']);
    Route::get('/admin/compliance-reviews/{id}/reject-link',  [\App\Http\Controllers\AdminComplianceController::class, 'rejectViaLink']);

    // ── Protected Routes ─────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Admin Compliance Routes (requires login — for dashboard use)
        Route::get('/admin/compliance-reviews', [\App\Http\Controllers\AdminComplianceController::class, 'index']);
        Route::get('/admin/compliance-reviews/history', [\App\Http\Controllers\AdminComplianceController::class, 'history']);
        Route::get('/admin/compliance-reviews/system-logs', [\App\Http\Controllers\AdminComplianceController::class, 'systemLogs']);
        Route::post('/admin/compliance-reviews/{id}/approve', [\App\Http\Controllers\AdminComplianceController::class, 'approve']);
        Route::post('/admin/compliance-reviews/{id}/reject', [\App\Http\Controllers\AdminComplianceController::class, 'reject']);
        Route::post('/admin/compliance-reviews/bulk-approve', [\App\Http\Controllers\AdminComplianceController::class, 'bulkApprove']);
        Route::post('/admin/compliance-reviews/bulk-reject', [\App\Http\Controllers\AdminComplianceController::class, 'bulkReject']);

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/email/verification-notification', [VerificationController::class, 'resend'])->name('verification.send');

        // Custom Baskets
        Route::post('/stocks/baskets', [BasketController::class, 'store']);
        Route::delete('/stocks/baskets/{basket}', [BasketController::class, 'destroy']);
        Route::post('/stocks/baskets/{basket}/invest', [BasketController::class, 'invest']);
        Route::put('/stocks/baskets/{basket}', [BasketController::class, 'update']);

        // Profile
        Route::get('/profile',  [ProfileController::class, 'show']);
        Route::put('/profile',  [ProfileController::class, 'update']);
        Route::delete('/account', [AccountController::class, 'destroy']);

        // Products (Scanner & Search)
        Route::get('/products',                       [ProductController::class, 'index']);
        Route::post('/scan',                          [ProductController::class, 'scan']);
        Route::get('/products/search',                [ProductController::class, 'search']);
        Route::post('/products',                      [ProductController::class, 'store']);
        Route::get('/products/{barcode}',             [ProductController::class, 'showByBarcode']);
        Route::put('/products/{product}/status',      [ProductController::class, 'updateStatus']);

        // ── Stocks ── (order matters: specific routes before {symbol} wildcard)
        // Baskets moved to public routes above
        Route::get('/stocks/check/{symbol}',          [StockController::class, 'check']);
        Route::put('/stocks/{symbol}/status',         [StockController::class, 'updateStatus']); // Scholar/Admin only (role checked in controller)

        // Billing
        Route::post('/billing/upgrade', [BillingController::class, 'upgrade']);

        // Brokerage
        Route::post('/brokerage/link',    [BrokerageController::class, 'link']);
        Route::get('/brokerage/accounts', [BrokerageController::class, 'accounts']);
        Route::post('/brokerage/trade',   [BrokerageController::class, 'trade']);

        // Portfolio & Trading
        Route::get('/portfolio', [PortfolioController::class, 'index']);
        Route::get('/portfolio/movers', [PortfolioController::class, 'movers']);
        Route::post('/broker/link', [TradeController::class, 'linkBroker']);
        Route::post('/broker/trade', [TradeController::class, 'executeTrade']);

        // Verification
        Route::post('/email/resend', [VerificationController::class, 'resend']);
        Route::post('/portfolio',              [PortfolioController::class, 'store']);
        Route::post('/portfolio/bulk',         [PortfolioController::class, 'bulkStore']);
        Route::put('/portfolio/{id}',          [PortfolioController::class, 'update']);
        Route::delete('/portfolio/{id}',       [PortfolioController::class, 'destroy']);

        // Watchlist
        Route::get('/watchlist',               [\App\Http\Controllers\WatchlistController::class, 'index']);
        Route::post('/watchlist',              [\App\Http\Controllers\WatchlistController::class, 'store']);
        Route::post('/watchlist/bulk',         [\App\Http\Controllers\WatchlistController::class, 'bulkStore']);
        Route::put('/watchlist/{symbol}',      [\App\Http\Controllers\WatchlistController::class, 'update']);
        Route::delete('/watchlist/{symbol}',   [\App\Http\Controllers\WatchlistController::class, 'destroy']);

        // Onboarding (atomic: bulk watchlist + mark onboarded in one request)
        Route::post('/onboard',                [\App\Http\Controllers\WatchlistController::class, 'onboard']);


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

        // Notifications (Inbox)
        Route::get('/notifications/inbox',          [\App\Http\Controllers\NotificationController::class, 'inbox']);
        Route::get('/notifications/unread-count',   [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
        Route::put('/notifications/read-all',       [\App\Http\Controllers\NotificationController::class, 'markAllRead']);
        Route::put('/notifications/{id}/read',      [\App\Http\Controllers\NotificationController::class, 'markRead']);
        Route::put('/notifications/{id}/archive',   [\App\Http\Controllers\NotificationController::class, 'archive']);
        Route::delete('/notifications/{id}',        [\App\Http\Controllers\NotificationController::class, 'destroy']);
        Route::post('/notifications/subscribe', function (Request $request) {
            $request->validate(['fcm_token' => 'required|string']);
            auth()->user()->update(['fcm_token' => $request->fcm_token]);
            return response()->json(['message' => 'Successfully subscribed to push notifications']);
        });

        // Updates — News & Insights, Digest preferences
        Route::get('/updates/news',    [\App\Http\Controllers\UpdatesController::class, 'newsAndInsights']);
        Route::get('/updates/digest',  [\App\Http\Controllers\UpdatesController::class, 'digestPreference']);
        Route::put('/updates/digest',  [\App\Http\Controllers\UpdatesController::class, 'updateDigestPreference']);
        
        // ── Admin Routes ─────────────────────────────────────────────────────
        Route::middleware(\App\Http\Middleware\AdminMiddleware::class)->group(function () {
            // User Management
            Route::get('/admin/users', [\App\Http\Controllers\AdminController::class, 'getUsers']);
            Route::post('/admin/users', [\App\Http\Controllers\AdminController::class, 'createAdmin']);
            Route::put('/admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser']);
            Route::delete('/admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'deleteUser']);
            
            // Admin Alerts
            Route::get('/admin/alerts', [\App\Http\Controllers\AdminController::class, 'getAlerts']);
            Route::post('/admin/alerts/{id}/resolve', [\App\Http\Controllers\AdminController::class, 'resolveAlert']);

            // Admin Stock/Ticker Management
            Route::get('/admin/stocks/export', [\App\Http\Controllers\AdminController::class, 'exportStocks']);
            Route::post('/admin/stocks/import/preview', [\App\Http\Controllers\AdminController::class, 'previewImport']);
            Route::post('/admin/stocks/import/confirm', [\App\Http\Controllers\AdminController::class, 'confirmImport']);
            Route::put('/admin/stocks/{symbol}', [\App\Http\Controllers\AdminController::class, 'updateTickerAbout']);
            Route::post('/admin/stocks/{symbol}/news', [\App\Http\Controllers\AdminController::class, 'addTickerNews']);
            Route::delete('/admin/stocks/{symbol}/news/{newsId}', [\App\Http\Controllers\AdminController::class, 'deleteTickerNews']);
            
            // AAOIFI Override
            Route::put('/stocks/{symbol}/aaoifi', [StockController::class, 'updateAaoifi']);
            
            // Resource Management
            Route::post('/resources', [\App\Http\Controllers\ResourceController::class, 'store']);
            Route::put('/resources/{id}', [\App\Http\Controllers\ResourceController::class, 'update']);
            Route::delete('/resources/{id}', [\App\Http\Controllers\ResourceController::class, 'destroy']);
            
            // Zakat Settings Management
            Route::put('/admin/settings', [SettingsController::class, 'update']);
        });
    });

    // Public wildcard route placed after all other specific protected routes
    Route::get('/stocks/{symbol}', [StockController::class, 'show']);
});
