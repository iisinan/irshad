$symbols = ['AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL', 'NCR', 'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT', 'UPDCREIT', 'NEWGOLD', 'VETGOODS', 'VETINDETF', 'MERGROWTH', 'MERVALUE'];
$companyIds = App\Models\Company::whereIn('symbol', $symbols)->pluck('id');
$updated = App\Models\StockStatus::whereIn('company_id', $companyIds)->update(['status' => 'doubtful']);
echo "Updated " . $updated . " company statuses.\n";
