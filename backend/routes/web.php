<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'timestamp' => now()->toIso8601String()]);
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
