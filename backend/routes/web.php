<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;

Route::get('/', function () {
    return response()->json(['message' => 'Irshad Engine API is running']);
});

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (Exception $e) {
        $dbStatus = 'disconnected';

        return response()->json(['status' => 'unhealthy', 'database' => $dbStatus, 'error' => $e->getMessage()], 500);
    }

    return response()->json([
        'status' => 'healthy',
        'database' => $dbStatus,
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/metrics', function () {
    if (! class_exists(CollectorRegistry::class)) {
        return response('Prometheus not installed', 501);
    }

    $registry = CollectorRegistry::getDefault();
    $renderer = new RenderTextFormat;
    $result = $renderer->render($registry->getMetricFamilySamples());

    return response($result)->header('Content-Type', RenderTextFormat::MIME_TYPE);
});
