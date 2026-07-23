<?php

$total = \App\Models\Company::count();
$withPrice = \App\Models\Company::whereNotNull('latest_price')->count();
$withLogo = \App\Models\Company::whereNotNull('logo_url')->count();
$withDescription = \App\Models\Company::whereNotNull('description')->count();
$withSector = \App\Models\Company::whereNotNull('sector')->count();

$complete = \App\Models\Company::whereNotNull('latest_price')
    ->whereNotNull('logo_url')
    ->whereNotNull('description')
    ->whereNotNull('sector')
    ->count();

echo "Total Companies: $total\n";
echo "With Price: $withPrice\n";
echo "With Logo: $withLogo\n";
echo "With Description: $withDescription\n";
echo "With Sector: $withSector\n";
echo "Complete Data (all of the above): $complete\n";
