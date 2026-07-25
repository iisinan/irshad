<?php
$screenings = DB::table('financial_screenings')->get();
$missing_count = 0;
$found_count = 0;
$zero_revenue_count = 0;

foreach ($screenings as $s) {
    if (!$s->chosen_values) continue;
    $data = json_decode($s->chosen_values, true);
    if (!isset($data['total_revenue'])) continue;
    
    if (isset($data['total_revenue']['value']) && $data['total_revenue']['value'] > 0) {
        $found_count++;
    } else {
        $zero_revenue_count++;
    }
}
echo "Total with data: $found_count\n";
echo "Total with zero revenue: $zero_revenue_count\n";
