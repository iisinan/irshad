<?php
$file = '/Users/sinan/Herd/irshad/backend/app/Http/Controllers/StockController.php';
$content = file_get_contents($file);

$search = "->get()
                ->map(function (\$company) {
                    \$company->status = \$company->current_status ? ['status' => \$company->current_status] : null;
                    return \$company;
                });";
                
$replace = "->with('aaoifiScreening:company_id,impermissible_income_ratio')
                ->get()
                ->map(function (\$company) {
                    \$ratio = \$company->aaoifiScreening ? \$company->aaoifiScreening->impermissible_income_ratio : 0;
                    \$company->status = \$company->current_status ? [
                        'status' => \$company->current_status,
                        'purification_required' => \$company->current_status === 'halal' && \$ratio > 0,
                        'haram_revenue_percent' => \$ratio
                    ] : null;
                    unset(\$company->aaoifiScreening);
                    return \$company;
                });";

if (strpos($content, "['status' => \$company->current_status]") !== false) {
    $content = str_replace($search, $replace, $content);
    file_put_contents($file, $content);
    echo "Updated StockController.php successfully\n";
} else {
    echo "Could not find the target string in StockController.php\n";
}
