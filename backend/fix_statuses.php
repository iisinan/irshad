<?php
$updates = [
    'ABCTRANS' => 'halal',
    'ACADEMY' => 'halal',
    'AFROMEDIA' => 'doubtful',
    'ALEX' => 'halal',
    'ARADEL' => 'halal',
    'AUSTINLAZ' => 'halal',
    'BAPLC' => 'halal',
    'BERGER' => 'halal',
    'BUACEMENT' => 'halal',
    'BUAFOODS' => 'halal',
    'CADBURY' => 'halal',
    'CAP' => 'halal',
    'CAVERTON' => 'halal',
    'CHAMPION' => 'non-halal',
    'CHAMS' => 'halal',
    'CHELLARAM' => 'halal',
    'CILEASING' => 'halal',
    'CMFC' => 'doubtful',
    'CNIF' => 'non-halal',
    'CONHALLPLC' => 'halal',
    'CONOIL' => 'halal',
    'CUTIX' => 'halal',
    'DANGSUGAR' => 'halal',
    'DELUXEPROP' => 'doubtful',
    'ECHOTEK' => 'halal',
    'ETRANZACT' => 'halal',
    'EVERIDON' => 'halal',
    'FCMB' => 'non-halal',
    'FIDELITYBK' => 'non-halal',
    'GEREGU' => 'halal',
    'INTBREW' => 'non-halal',
    'JAIZBANK' => 'halal',
    'JULI' => 'halal',
    'LASACO' => 'halal',
    'LINKASSURE' => 'halal',
    'LVBANK' => 'non-halal',
    'MAYBAKER' => 'halal',
    'MCNICHOLS' => 'halal',
    'MORISON' => 'halal',
    'MTNN' => 'halal',
    'MULTIVERSE' => 'halal',
    'NAHCO' => 'halal',
    'NASCON' => 'halal',
    'NCR' => 'halal',
    'NNFM' => 'non-halal',
    'NSLTECH' => 'halal',
    'OANDO' => 'halal',
    'OMATEK' => 'halal',
    'PHARMDEKO' => 'halal',
    'PRESCO' => 'halal',
    'REGENCYINS' => 'halal',
    'SEPLAT' => 'halal',
    'STANBIC' => 'non-halal',
    'TRANSCOHOT' => 'halal',
    'UHOMREIT' => 'doubtful',
    'UNILEVER' => 'halal',
    'UNIONDICON' => 'halal',
    'UPDCREIT' => 'halal',
    'UPL' => 'halal',
    'VITAFOAM' => 'halal',
    'ZICHIS' => 'doubtful',
];

$count = 0;
foreach ($updates as $symbol => $status) {
    $company = \App\Models\Company::where('symbol', $symbol)->first();
    if ($company) {
        $stockStatus = \App\Models\StockStatus::updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => $status,
                'reasoning' => 'Manual override applied based on the July 2026 NGX Shariah Excel report.',
                'last_checked_at' => now()
            ]
        );
        $count++;
    }
}
echo "Updated $count company statuses.\n";
