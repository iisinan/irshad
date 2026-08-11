<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$c1 = \App\Models\Company::where('symbol', 'CILEASING')->with('aaoifiScreening')->first();
if ($c1) {
    $c1->current_status = 'doubtful';
    $c1->save();
    if ($c1->aaoifiScreening) {
        $c1->aaoifiScreening->business_status = 'doubtful';
        $c1->aaoifiScreening->final_status = 'doubtful';
        $c1->aaoifiScreening->business_reasoning = ["Equipment leasing is permissible in principle, but there are concerns with its conventional lease financing structure."];
        $c1->aaoifiScreening->save();
        echo "Updated CILEASING\n";
    }
}

$c2 = \App\Models\Company::where('symbol', 'HMCALL')->with('aaoifiScreening')->first();
if ($c2) {
    $c2->current_status = 'doubtful';
    $c2->save();
    if ($c2->aaoifiScreening) {
        $c2->aaoifiScreening->business_status = 'doubtful';
        $c2->aaoifiScreening->final_status = 'doubtful';
        $c2->aaoifiScreening->business_reasoning = ["There are concerns regarding the revenue source mix from its budget hotel operations under the Suru Express Hotel brand."];
        $c2->aaoifiScreening->save();
        echo "Updated HMCALL\n";
    }
}
