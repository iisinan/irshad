<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tickers = ['BAPLC', 'MULTITREX', 'AFROMEDIA', 'EKOCORP', 'RONCHESS', 'PHARMDEKO', 'ALEX'];

foreach ($tickers as $ticker) {
    $c = \App\Models\Company::where('symbol', $ticker)->with('aaoifiScreening')->first();
    if ($c) {
        $msg = "Note: This company is currently not trading on the NGX.";
        
        // Append to activity_reason if not already there
        if ($c->activity_reason && strpos($c->activity_reason, 'currently not trading') === false) {
            $c->activity_reason = trim($c->activity_reason) . " " . $msg;
            $c->save();
        } elseif (!$c->activity_reason) {
            $c->activity_reason = $msg;
            $c->save();
        }

        // Append to AAOIFI screening business_reasoning
        if ($c->aaoifiScreening) {
            $reasoning = $c->aaoifiScreening->business_reasoning;
            
            if (is_array($reasoning)) {
                $justification = $reasoning['justification'] ?? '';
                if (strpos($justification, 'currently not trading') === false) {
                    $reasoning['justification'] = trim($justification) . " " . $msg;
                    $c->aaoifiScreening->business_reasoning = $reasoning;
                    $c->aaoifiScreening->save();
                }
            } elseif (is_string($reasoning)) {
                if (strpos($reasoning, 'currently not trading') === false) {
                    $c->aaoifiScreening->business_reasoning = trim($reasoning) . " " . $msg;
                    $c->aaoifiScreening->save();
                }
            } else {
                $c->aaoifiScreening->business_reasoning = ["justification" => $msg];
                $c->aaoifiScreening->save();
            }
        }
        echo "Updated $ticker\n";
    } else {
        echo "Could not find $ticker\n";
    }
}
