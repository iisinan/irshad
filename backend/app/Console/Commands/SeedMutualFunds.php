<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;

class SeedMutualFunds extends Command
{
    protected $signature = 'seed:mutual-funds';
    protected $description = 'Seed mutual funds into the companies table';

    public function handle()
    {
        $funds = [
            [
                'name' => 'Afrinvest Halal Fund',
                'symbol' => 'AFRI-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'Afrinvest Asset Management Ltd',
                    'launched' => 'July 2025',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => '70–100% in (FGN, state and corporate Sukuk), 30% Shariah-compliant equities. 5% cash held in non-interest-bearing accounts.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'ARM Halal Balanced Fund',
                'symbol' => 'ARM-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'ARM Investment Managers Ltd',
                    'launched' => '2004',
                    'trustee' => 'Royal Exchange Plc',
                    'custodian' => 'Rand Merchant Bank',
                    'investment_components_target' => '40–60% Shariah-compliant equities and 40–60% Shariah-compliant alternative investments (Sukuk, Mudarabah deposits).',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'ARM Sharia Compliant Fixed Income Fund',
                'symbol' => 'ARM-SCFI',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'ARM Investment Managers Ltd',
                    'launched' => 'November 2024',
                    'trustee' => 'FBNQuest Trustees',
                    'custodian' => 'Rand Merchant Bank',
                    'investment_components_target' => 'Sukuk 70–100%; Shariah-compliant income contracts 0–30% (Mudarabah and Murabaha with a minimum BBB rating); Shariah-compliant fixed-term instruments 0–30%; cash 0–5%.',
                    'asset_mix' => 'Current actual allocation not completely available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'CapitalTrust Halal Fixed Income Fund',
                'symbol' => 'CT-HALAL',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'CapitalTrust Investments & Asset Management Ltd',
                    'launched' => '2021',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Sovereign and sub-sovereign Sukuk, corporate Sukuk, leasing and trading contracts; no conventional T-bills or bonds.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'CFG Ethical Fund',
                'symbol' => 'CFG-ETHICAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'CFG Asset',
                    'launched' => null,
                    'trustee' => 'AVA Trustees',
                    'custodian' => 'Rand Merchant Bank',
                    'registrar' => 'CardinalStone',
                    'shariah_adviser' => 'One17 Capital',
                    'investment_components_target' => '70–85% high-quality sovereign and sub-sovereign Sukuk and ethical fixed income, with smaller allocations to Shariah-compliant fixed income and equities.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Cordros Halal Fixed Income Fund',
                'symbol' => 'CORDROS-HALAL',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'Cordros Asset Management Ltd',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Shariah-compliant fixed income securities, contracts and investment products.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'D\'Namaz Halal Fixed Income Fund',
                'symbol' => 'DNAMAZ-HALAL',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'D\'Namaz Capital',
                    'launched' => 'May 2025',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Government, sub-national and corporate Sukuk, Shariah-compliant fixed-term deposits, Murabahah contracts and Ijarah leases; investment-grade focus with duration management.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'EDC Halal Fund',
                'symbol' => 'EDC-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'EDC Fund Management',
                    'launched' => 'August 2022',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Income and capital appreciation while limiting exposure to equity-market volatility (no disclosed information on asset mix).',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Emerging Africa Halal Fund',
                'symbol' => 'EA-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'Emerging Africa Asset Management Ltd',
                    'launched' => 'July 2024',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Sovereign and sub-sovereign Sukuk 70–80%; corporate Sukuk 0–30%; Shariah-compliant fixed-term investments 10–40%; cash 0–5%; other Shariah-adviser-approved fixed income contracts 0–5%.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'FSDH Halal Fund',
                'symbol' => 'FSDH-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'FSDH Asset Management Ltd',
                    'launched' => 'October 2023',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Sovereign and sub-sovereign Sukuk, corporate Sukuk, leasing contracts and trading contracts.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Lotus Halal ETF',
                'symbol' => 'LOTUS-ETF',
                'sector' => 'ETF',
                'fund_details' => [
                    'provider' => 'Lotus Capital Ltd',
                    'launched' => '2014',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Tracks the NSE-Lotus Islamic Index (15 screened equities at launch); screens out alcohol, tobacco, conventional financial services, gambling and adult entertainment.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Published by Lotus Capital. Computation is AAOIFI-guided and not independently verified.',
                    'purification_history' => [
                        ['year' => 2025, 'per_unit' => 0.46],
                        ['year' => 2024, 'per_unit' => 0.10],
                        ['year' => 2023, 'per_unit' => 0.08],
                        ['year' => 2022, 'per_unit' => 0.05],
                        ['year' => 2021, 'per_unit' => 0.04],
                    ]
                ]
            ],
            [
                'name' => 'Lotus Halal Fixed Income Fund',
                'symbol' => 'LOTUS-FI',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'Lotus Capital Ltd',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Sukuk plus Ijarah and Murabaha contracts; no T-bills, conventional bonds or conventional bank deposits.',
                    'asset_mix' => 'Sukuk 35%, fixed income 40%, term deposits 25%.',
                    'purification_note' => 'Not disclosed. Lotus\'s published purification schedule covers only the Halal Investment Fund and the Halal Equity ETF.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Lotus Halal Investment Fund',
                'symbol' => 'LOTUS-INV',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'Lotus Capital Ltd',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Diversified portfolio of equities, real estate and other asset-backed investments (leases, trade finance contracts).',
                    'asset_mix' => 'Stocks 34%, cash and equivalents 19%, asset-backed investments 47%.',
                    'purification_note' => 'Published by Lotus Capital. AAOIFI-guided, not independently verified.',
                    'purification_history' => [
                        ['year' => 2025, 'per_unit' => 0.01230],
                        ['year' => 2024, 'per_unit' => 0.00239],
                        ['year' => 2023, 'per_unit' => 0.00104],
                        ['year' => 2022, 'per_unit' => 0.01],
                        ['year' => 2021, 'per_unit' => 0.00182],
                    ]
                ]
            ],
            [
                'name' => 'Lotus Waqf (Endowment) Fund',
                'symbol' => 'LOTUS-WAQF',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'Lotus Capital Ltd',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Shariah-compliant financial instruments, with the income directed to charitable causes.',
                    'asset_mix' => 'No allocation found.',
                    'purification_note' => 'Not disclosed. Lotus\'s published purification schedule does not cover this fund.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Marble Halal Commodities Fund',
                'symbol' => 'MARBLE-COM',
                'sector' => 'Commodities',
                'fund_details' => [
                    'provider' => 'Marble Capital Ltd',
                    'launched' => 'April 2023',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Securitized commodities (agriculture, precious metals), commodity-linked fixed income instruments and commodity-linked equities.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents reviewed.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Marble Halal Fixed Income Fund',
                'symbol' => 'MARBLE-FI',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'Marble Capital Ltd',
                    'launched' => '2023',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Sukuk and other Shariah-compliant debt and fixed income instruments, plus Shariah-compliant fixed-term investments and contracts.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents reviewed.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Norrenberger Islamic Fund',
                'symbol' => 'NORREN-ISLAMIC',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'Norrenberger Asset Management Ltd',
                    'launched' => '2021',
                    'trustee' => 'UTL Trust Management Services',
                    'custodian' => null,
                    'investment_components_target' => 'Sukuk 30–100%; Mudarabah 0–70%; Ijarah 0–50%; Murabaha 0–50%; cash 0–15%.',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'One17 Halal Fund',
                'symbol' => 'ONE17-HALAL',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'One17 Capital Ltd',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Not found. Confirm the fund exists before relying on this entry.',
                    'asset_mix' => 'Not found.',
                    'purification_note' => 'Not found.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Stanbic IBTC Ethical Fund (Imaan Fund)',
                'symbol' => 'STANBIC-IMAAN',
                'sector' => 'Balanced',
                'fund_details' => [
                    'provider' => 'Stanbic IBTC Asset Management',
                    'launched' => null,
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Minimum 70% Shariah-compliant equities; maximum 30% other Shariah-compliant assets (Sukuk, Shariah money-market instruments, cash).',
                    'asset_mix' => 'Current actual allocation not available.',
                    'purification_note' => 'Not disclosed in the public documents reviewed.',
                    'purification_history' => []
                ]
            ],
            [
                'name' => 'Stanbic IBTC Shariah Fixed Income Fund',
                'symbol' => 'STANBIC-SFI',
                'sector' => 'Fixed Income',
                'fund_details' => [
                    'provider' => 'Stanbic IBTC Asset Management',
                    'launched' => 'August 2019',
                    'trustee' => null,
                    'custodian' => null,
                    'investment_components_target' => 'Minimum 70% Sukuk; maximum 30% short-term Shariah-compliant instruments.',
                    'asset_mix' => 'Sukuk 93%, halal term deposits 7%.',
                    'purification_note' => 'Not disclosed in the public documents.',
                    'purification_history' => []
                ]
            ],
        ];

        foreach ($funds as $fund) {
            Company::updateOrCreate(
                ['symbol' => $fund['symbol']],
                [
                    'name' => $fund['name'],
                    'sector' => $fund['sector'],
                    'asset_class' => 'mutual_fund',
                    'current_status' => 'halal',
                    'latest_price' => 100.00,
                    'fund_details' => $fund['fund_details']
                ]
            );
        }

        $this->info('Mutual funds seeded with rich details successfully.');
    }
}
