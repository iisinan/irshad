<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$symbols = App\Models\Company::pluck('symbol')->toArray();
file_put_contents('/Users/sinan/.gemini/antigravity/brain/987cf41f-5101-4b4b-88a1-c71ce200fdd6/scratch/symbols.json', json_encode($symbols));
echo "Done\n";
