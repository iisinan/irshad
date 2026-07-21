<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'disconnected';
        return response()->json(['status' => 'unhealthy', 'database' => $dbStatus, 'error' => $e->getMessage()], 500);
    }

    return response()->json([
        'status' => 'healthy', 
        'database' => $dbStatus,
        'timestamp' => now()->toIso8601String()
    ]);
});

Route::get('/metrics', function () {
    if (!class_exists(\Prometheus\CollectorRegistry::class)) {
        return response('Prometheus not installed', 501);
    }
    
    $registry = \Prometheus\CollectorRegistry::getDefault();
    $renderer = new \Prometheus\RenderTextFormat();
    $result = $renderer->render($registry->getMetricFamilySamples());

    return response($result)->header('Content-Type', \Prometheus\RenderTextFormat::MIME_TYPE);
});
