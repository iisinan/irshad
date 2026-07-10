<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;

class UpdateSectors extends Command
{
    protected $signature = 'app:update-sectors';
    protected $description = 'Updates NGX stock sectors with hardcoded data';

    public function handle()
    {
        $sectors = [
            'Financial Services' => ['ZENITHBANK', 'GTCO', 'UBA', 'FIRSTHOLDCO', 'ACCESSCORP', 'FCMB', 'FIDELITYBK', 'STANBIC', 'STERLINGNG', 'WEMABANK', 'JAIZBANK', 'ETI', 'UCAP', 'AFRIPRUD', 'FBNH'],
            'Consumer Goods' => ['NESTLE', 'NB', 'NB Plc', 'GUINNESS', 'DANGSUGAR', 'NASCON', 'FLOURMILL', 'HONYFLOUR', 'UNILEVER', 'CADBURY', 'PZ', 'INTBREW', 'CHAMPION', 'BUAFOODS', 'MCNICHOLS'],
            'Industrial Goods' => ['DANGCEM', 'BUACEMENT', 'WAPCO', 'BERGER', 'CAP', 'MEYER', 'PREMPAINTS', 'CUTIX', 'BETAGLAS', 'AUSTINLAZ'],
            'Oil & Gas' => ['SEPLAT', 'OANDO', 'TOTAL', 'CONOIL', 'ETERNA', 'ARADEL', 'MRS'],
            'ICT' => ['MTNN', 'AIRTELAFRI', 'CWG', 'CHAMS', 'OMATEK', 'NCR', 'ETRANZACT'],
            'Agriculture' => ['OKOMUOIL', 'PRESCO', 'ELLAHLAKES', 'LIVESTOCK', 'FTNCOCOA'],
            'Healthcare' => ['FIDSON', 'MAYBAKER', 'NEIMETH', 'MECURE', 'PHARMDEKO', 'GLAXOSMITH', 'MORISON'],
            'Conglomerates' => ['TRANSCORP', 'UACN', 'JOHNHOLT', 'SCOA', 'CHELLARAM'],
            'Services' => ['TRANSCOHOT', 'IKEJAHOTEL', 'NAHCO', 'SKYAVN', 'REDSTAREX', 'ABCTRANS', 'CILEASING', 'CAVERTON', 'ACADEMY', 'LEARNAFRCA', 'UPL'],
            'Construction/Real Estate' => ['JBERGER', 'UPDC', 'UPDCREIT', 'UHOMREIT', 'SFSREIT', 'NREIT'],
            'Insurance' => ['AIICO', 'MANSARD', 'NEM', 'SOVRENINS', 'CORNERST', 'LASACO', 'WAPIC', 'MBENEFIT', 'MUTUALBEN', 'REGALINS', 'PRESTIGE', 'SUNUASSUR', 'UNIVINSURE', 'LINKASSURE', 'GUINEAINS', 'VERITASKAP'],
            'Utilities' => ['GEREGU', 'TRANSPOWER'],
        ];

        $updated = 0;
        foreach ($sectors as $sectorName => $symbols) {
            $count = Company::whereIn('symbol', $symbols)->update(['sector' => $sectorName]);
            $updated += $count;
        }

        $this->info("Updated {$updated} companies with sector data.");
    }
}
