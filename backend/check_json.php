<?php
$json = file_get_contents(__DIR__ . '/api_stocks.json');
$data = json_decode($json, true);
$stocks = $data['data'] ?? [];

$symbols = [
    'ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER',
    'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL',
    'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT',
    'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK',
    'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'MAYBAKER',
    'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NASCON',
    'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO',
    'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT',
    'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN',
    'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM', 'NAHCO', 'LOTUSHAL15'
];

$missing = [];
$found = [];
$not_found = [];

foreach ($stocks as $s) {
    if (in_array($s['symbol'], $symbols)) {
        if (!empty($s['aaoifi_screening']['published_date'])) {
            $found[] = $s['symbol'];
        } else {
            $missing[] = $s['symbol'];
        }
    }
}

// Find any from the list that aren't even in the API response
$api_symbols = array_column($stocks, 'symbol');
$not_in_api = array_diff($symbols, $api_symbols);

echo "Total attached symbols: " . count($symbols) . "\n";
echo "Have Published Date: " . count($found) . "\n";
echo "Missing Published Date: " . count($missing) . "\n\n";

if (count($missing) > 0) {
    echo "The following have NO publication date:\n";
    echo implode(', ', $missing) . "\n\n";
}

if (count($not_in_api) > 0) {
    echo "The following were NOT FOUND in the API:\n";
    echo implode(', ', $not_in_api) . "\n";
}
