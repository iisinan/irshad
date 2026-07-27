<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::first();
if (!$user) {
    echo "No user found\n";
    exit;
}

$request = \Illuminate\Http\Request::create('/api/profile', 'PUT', [
    'name' => $user->name,
    'email' => $user->email,
    'phone_number' => $user->phone_number,
    'preferences' => [
        'investor_type' => '',
        'primary_use_case' => '',
        'investment_experience' => ''
    ]
]);
$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = app()->make(\App\Http\Controllers\ProfileController::class);
try {
    $response = $controller->update($request);
    echo "Response: " . $response->getContent() . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation Exception: " . json_encode($e->errors()) . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
