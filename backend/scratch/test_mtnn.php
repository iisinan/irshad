<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(App\Services\AaoifiScreeningService::class);
$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('tripleCheckCalc');
$method->setAccessible(true);

$marketCap = '17447260265534.00'; // 17.4 Trillion
$debt = '5000000000000.00'; // 5 Trillion

try {
    $ratio = $method->invoke($service, $debt, $marketCap);
    echo "Success! Debt Ratio: {$ratio}%\n";
} catch (\Exception $e) {
    echo "Failed! " . $e->getMessage() . "\n";
}
