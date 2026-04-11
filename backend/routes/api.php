<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\BasketController;
use App\Http\Controllers\BrokerageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->group(function () {
    // Auth routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        
        // Profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        
        // Products (Scanner & Search)
        Route::post('/scan', [ProductController::class, 'scan']);
        Route::get('/products/search', [ProductController::class, 'search']);
        Route::get('/products/{barcode}', [ProductController::class, 'showByBarcode']);
        Route::put('/products/{product}/status', [ProductController::class, 'updateStatus']); // Scholar/Admin
        
        // Stocks
        Route::get('/stocks', [StockController::class, 'index']);
        Route::get('/stocks/search', [StockController::class, 'search']);
        Route::get('/stocks/{symbol}', [StockController::class, 'show']);
        Route::get('/stocks/check/{symbol}', [StockController::class, 'check']);
        Route::get('/stocks/baskets', [BasketController::class, 'index']);
        Route::get('/stocks/baskets/{basket}', [BasketController::class, 'show']);
        
        // Brokerage
        Route::post('/brokerage/link', [BrokerageController::class, 'link']);
        Route::get('/brokerage/accounts', [BrokerageController::class, 'accounts']);
        Route::post('/brokerage/trade', [BrokerageController::class, 'trade']);
        
        // Favorites
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites', [FavoriteController::class, 'store']);
        Route::delete('/favorites/{favorite}', [FavoriteController::class, 'destroy']);

        // History
        Route::get('/history', [HistoryController::class, 'index']);
        Route::post('/history', [HistoryController::class, 'store']);
        
        // Notifications
        Route::post('/notifications/subscribe', function(Request $request) {
            $request->validate(['fcm_token' => 'required|string']);
            auth()->user()->update(['fcm_token' => $request->fcm_token]);
            return response()->json(['message' => 'Successfully subscribed to push notifications']);
        });
        Route::get('/notifications', function() {
            return response()->json(['data' => []]); // Placeholder for unread notifications
        });
    });
});
