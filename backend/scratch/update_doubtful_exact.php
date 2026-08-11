<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;
use Illuminate\Support\Facades\DB;

$json = '{
    "AFROMEDIA": "The company operates in outdoor advertising and media. ||| Concerns with client mix (alcohol/betting ad revenue share).",
    "BETAGLAS": "The company manufactures generic glass containers for various sectors, but its major clients include prominent breweries and spirits producers. ||| Concerns with revenue source mix.",
    "CILEASING": "The core business of equipment leasing is permissible in principle. ||| Concerns with conventional lease financing structure.",
    "DAARCOMM": "The company is involved in broadcast media and programming. ||| Concerns with revenue sources from programming content mix (advertising for alcohol/betting, entertainment content standards).",
    "HMCALL": "The company operates in real estate and hospitality. ||| Concerns with revenue source mix as it owns and operates budget hotels, predominantly under the Suru Express Hotel brand in Lagos.",
    "NCR": "The core technology vending business is permissible, but company literature explicitly lists the gaming industry as a client vertical. ||| Concerns with revenue source mix.",
    "NGXGROUP": "The core exchange operations are fee-based and permissible, but the company holds a strategic investment in FMDQ Securities Exchange, a platform heavily focused on conventional debt trading. ||| Concerns with revenue source mix.",
    "SFSREIT": "While acquiring and managing real estate is permissible, the fund\'s allocation rules allow significant investment in mortgages and real estate-backed securities. ||| Concerns with disclosed financial-ratios.",
    "TANTALIZER": "The core restaurant business is permissible, but a subsidiary operates a live-game show platform. ||| Concerns with revenue source mix.",
    "TRANSCORP": "The company operates as a diversified conglomerate across power, energy, and hospitality sectors. ||| Concerns with segment and revenue source mix.",
    "UHOMREIT": "Although real estate management is permissible, the fund directly holds mortgage assets and explicitly accounts for interest-bearing loans. ||| Concerns with disclosed financial-ratios.",
    "UPDCREIT": "Operating a real estate investment trust is a permissible core activity, provided the underlying properties are utilized ethically. ||| Concerns on investment sources and results.",
    "NEWGOLD": "Although physical gold is a permissible asset, Islamic finance requires immediate possession and same-session settlement for gold trades to avoid Riba. ||| Concerns with NewGold\'s custodial and settlement structure.",
    "VETGOODS": "This ETF tracks consumer goods companies, a sector that historically includes major breweries alongside permissible food manufacturers. ||| Concerns with business case mix.",
    "VETINDETF": "This ETF tracks industrial goods companies, which generally engage in permissible manufacturing activities. ||| Concerns with regards exact verdict of constituent and the weights of each.",
    "MERGROWTH": "This ETF tracks a growth-oriented basket of equities across multiple sectors, which historically includes financial services. ||| Concerns with regards exact verdict of constituent companies and the weights of each.",
    "MERVALUE": "This ETF tracks a value-oriented basket of equities. ||| Concerns with regards exact verdict of constituent companies and the weights of each.",
    "NAHCO": "While the core aviation and logistics services are permissible, the company now operates an in-terminal hotel with on-site dining. ||| Concerns with revenue source mix."
}';

$updates = json_decode($json, true);

foreach ($updates as $symbol => $new_reason) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $statusRecord = StockStatus::where('company_id', $company->id)->first();
        if ($statusRecord) {
            $statusRecord->reason = $new_reason;
            $statusRecord->save();
            echo "Updated reason for $symbol\n";
        }
    }
}
echo "Done updating reasons\n";
