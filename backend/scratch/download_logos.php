<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use App\Models\Company;

$companies = Company::whereNotNull('logo_url')->where('logo_url', 'like', 'http%')->get();

$count = 0;
foreach ($companies as $company) {
    $url = $company->logo_url;
    echo "Processing {$company->symbol} ({$url})...\n";
    
    try {
        $response = Http::timeout(10)->get($url);
        
        if ($response->successful()) {
            $ext = 'png';
            if (strpos($url, '.svg') !== false) {
                $ext = 'svg';
            } elseif (strpos($url, '.jpg') !== false || strpos($url, '.jpeg') !== false) {
                $ext = 'jpg';
            }
            
            $filename = "logos/{$company->symbol}.{$ext}";
            
            Storage::disk('public')->put($filename, $response->body());
            
            $company->logo_url = "/storage/{$filename}";
            $company->save();
            echo "  -> Saved as /storage/{$filename}\n";
            $count++;
        } else {
            echo "  -> Failed to download: Status {$response->status()}\n";
        }
    } catch (\Exception $e) {
        echo "  -> Exception: " . $e->getMessage() . "\n";
    }
}

echo "\nSuccessfully downloaded and updated $count logos.\n";
