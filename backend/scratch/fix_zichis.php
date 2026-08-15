<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = App\Models\StockStatus::whereHas('company', function($q) { $q->where('symbol', 'ZICHIS'); })->first();
if($s) { 
    $s->reason = "Although core activities are permissible, the company's stated business lines include swine farming, which is categorically excluded. Further verification of revenue materiality is required, alongside governance risks related to recent stock investigations."; 
    $s->save(); 
    echo 'ZICHIS updated.'; 
}
