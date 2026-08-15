<?php
$data = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/fails_csv_reasoning.json'), true);

$rephrased = [];

foreach ($data as $symbol => $reason) {
    $newReason = $reason;
    
    // Exact or regex matches
    if (preg_match('/^Conventional insurance.*riba\/gharar in contract structure/i', $reason)) {
        $newReason = "Operations are based on conventional insurance principles, which involve impermissible elements of Riba (interest) and Gharar (uncertainty) in their contract structures.";
    } elseif (preg_match('/^Conventional bank.*interest-based lending\/deposits/i', $reason) && !preg_match('/holding co/i', $reason)) {
        $newReason = "Operations involve conventional banking activities, primarily generating revenue through interest-based lending and deposits (Riba).";
    } elseif (preg_match('/^Conventional bank holding co.*interest-based lending\/deposits/i', $reason)) {
        $newReason = "Operates as a holding company for a conventional bank, deriving core revenue from impermissible interest-based lending and deposits (Riba).";
    } elseif (preg_match('/^Brewery.*alcohol production/i', $reason) || preg_match('/brewing, production, and marketing of alcoholic beverages/i', $reason)) {
        $newReason = "Core business activities involve the production, distribution, and sale of alcoholic beverages, which are impermissible.";
    } elseif (preg_match('/^Mortgage bank - interest-based lending/i', $reason)) {
        $newReason = "Operations primarily involve conventional mortgage banking, generating revenue through impermissible interest-based lending (Riba).";
    } elseif (preg_match('/^Microfinance bank - interest-based lending/i', $reason)) {
        $newReason = "Operations primarily involve microfinance banking, generating revenue through impermissible interest-based lending (Riba).";
    } elseif (preg_match('/casino and nightclub/i', $reason) || preg_match('/gambling and alcohol sales are core/i', $reason)) {
        $newReason = "Core business operations involve casino and hospitality facilities that engage in impermissible gambling and alcohol-related activities.";
    } elseif (preg_match('/pig farming/i', $reason) || preg_match('/Piggery and pig feeds/i', $reason)) {
        $newReason = "Core business activities include commercial pig farming and swine production, which are categorically impermissible.";
    } elseif (preg_match('/government-backed mortgage lending vehicle/i', $reason)) {
        $newReason = "Operates primarily as a mortgage lending vehicle, generating core revenue from impermissible interest-bearing lending.";
    } elseif (preg_match('/directly operates microfinance and consumer lending/i', $reason)) {
        $newReason = "Core business segments include operating microfinance and consumer lending subsidiaries that engage in impermissible interest-based lending (Riba).";
    } elseif (preg_match('/national lottery and gambling/i', $reason)) {
        $newReason = "Core revenue is derived directly from operating a national lottery and gambling business, which are categorically impermissible.";
    } elseif (preg_match('/holding group - core business is conventional insurance/i', $reason)) {
        $newReason = "Operates as a holding company for financial services, with core operations rooted in conventional insurance involving Riba and Gharar.";
    } elseif (preg_match('/Greenwich Alpha ETF/i', $reason) || preg_match('/SIAML Pension ETF 40/i', $reason)) {
        $newReason = "Passively tracks a broad index that includes conventional banks and insurers as core constituents, rendering the fund impermissible.";
    } elseif (preg_match('/Stanbic IBTC ETF 30/i', $reason) || preg_match('/VETGRIF30/i', $reason) || preg_match('/ETF passively tracks an index containing conventional banks/i', $reason)) {
        $newReason = "Passively tracks an index containing conventional banks and other impermissible companies as core portfolio constituents.";
    } elseif (preg_match('/VETBANK/i', $reason) || preg_match('/This ETF tracks the NGX Banking Index/i', $reason)) {
        $newReason = "Passively tracks an index consisting exclusively of conventional, interest-based banks, which are impermissible.";
    } elseif (preg_match('/debt fund where interest income/i', $reason) || preg_match('/explicitly as a debt fund/i', $reason)) {
        $newReason = "Operates as a debt fund, generating core revenue from interest-based infrastructure loans and securitized debt (Riba).";
    } elseif (preg_match('/interest-based banking and conventional financial services segments/i', $reason)) {
        $newReason = "Core operations include directly managing interest-based banking and conventional financial services segments, which are impermissible.";
    } elseif (preg_match('/Vetiva S&P Nigeria Sovereign Bond ETF/i', $reason)) {
        $newReason = "Fund holdings consist of conventional government bonds, generating returns from fixed interest (coupon) income (Riba).";
    } elseif (preg_match('/private credit and interest-based debt financing/i', $reason)) {
        $newReason = "Primary business involves providing private credit and interest-based debt financing (Riba).";
    } elseif (preg_match('/capital structuring and financing solutions are overwhelmingly monetized through impermissible structured debt/i', $reason)) {
        $newReason = "Operates as a specialized financing platform, generating revenue primarily through impermissible structured debt and interest spreads (Riba).";
    }
    
    $rephrased[$symbol] = [
        'original' => $reason,
        'rephrased' => $newReason
    ];
}

file_put_contents('/Users/sinan/Herd/irshad/backend/scratch/rephrased_fails.json', json_encode($rephrased, JSON_PRETTY_PRINT));
