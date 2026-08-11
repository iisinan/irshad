<?php
$market_cap = 3930429261.20;
$total_assets = 10261000000;
$loans_and_borrowings = 954000000;
$due_to_related_parties = 240000000 + 791000000; // wait it's 24m and 791m
$due_to_related_parties = 815000000;
$cash = 733000000;
$revenue = 2500000000;
$interest_income = 0; // assuming no interest income in other operating income

echo "Market Cap: " . number_format($market_cap) . "\n";
echo "Total Assets: " . number_format($total_assets) . "\n";
echo "Loans and Borrowings: " . number_format($loans_and_borrowings) . "\n";
echo "Due to Related Parties: " . number_format($due_to_related_parties) . "\n";
echo "Total Debt (w/o Related Parties): " . number_format($loans_and_borrowings) . "\n";
echo "Total Debt (w/ Related Parties): " . number_format($loans_and_borrowings + $due_to_related_parties) . "\n";
echo "Cash: " . number_format($cash) . "\n";

echo "\n--- Ratios (Using Market Cap) ---\n";
echo "Debt Ratio (w/o Related Parties): " . round(($loans_and_borrowings / $market_cap) * 100, 2) . "%\n";
echo "Debt Ratio (w/ Related Parties): " . round((($loans_and_borrowings + $due_to_related_parties) / $market_cap) * 100, 2) . "%\n";
echo "Cash Ratio: " . round(($cash / $market_cap) * 100, 2) . "%\n";

echo "\n--- Ratios (Using Total Assets) ---\n";
echo "Debt Ratio (w/o Related Parties): " . round(($loans_and_borrowings / $total_assets) * 100, 2) . "%\n";
echo "Debt Ratio (w/ Related Parties): " . round((($loans_and_borrowings + $due_to_related_parties) / $total_assets) * 100, 2) . "%\n";
echo "Cash Ratio: " . round(($cash / $total_assets) * 100, 2) . "%\n";
