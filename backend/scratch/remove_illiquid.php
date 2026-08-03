<?php
$file = __DIR__.'/../app/Services/AaoifiScreeningService.php';
$content = file_get_contents($file);

// Remove illiquid assets block
$content = preg_replace('/\$illiquidRatio = null;.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n/s', '$illiquidRatio = null;'."\n".'$illiquidStatus = \'insufficient_data\';'."\n", $content);

// Remove receivables ratio block
$content = preg_replace('/\$receivablesRatio = null;.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n/s', '$receivablesRatio = null;'."\n".'$receivablesStatus = \'insufficient_data\';'."\n", $content);

file_put_contents($file, $content);

echo "Removed illiquid and receivables ratio logic from AaoifiScreeningService.php\n";
