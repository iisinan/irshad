<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DirectoryController extends Controller
{
    /**
     * Get the Halal Directory comprising Ethical Funds, Islamic Banking, and Takaful operators.
     */
    public function index(Request $request): JsonResponse
    {
        $group = strtolower($request->input('group', 'all'));
        $search = strtolower(trim($request->input('search', '')));

        $banking = $this->getBankingData();
        $takaful = $this->getTakafulData();

        // Load mutual funds from companies table
        $funds = Cache::remember('directory.mutual_funds', 3600, function () {
            return Company::where('asset_class', 'mutual_fund')
                ->select(['id', 'name', 'symbol', 'sector', 'current_status', 'asset_class', 'latest_price', 'price_change_pct', 'logo_url', 'fund_details'])
                ->orderBy('name', 'asc')
                ->get()
                ->toArray();
        });

        // Filter by search query if present
        if (!empty($search)) {
            $funds = array_values(array_filter($funds, function ($f) use ($search) {
                $name = strtolower($f['name'] ?? '');
                $provider = strtolower($f['fund_details']['provider'] ?? '');
                $strategy = strtolower($f['fund_details']['investment_components_target'] ?? '');
                return str_contains($name, $search) || str_contains($provider, $search) || str_contains($strategy, $search);
            }));

            $banking = array_values(array_filter($banking, function ($b) use ($search) {
                $name = strtolower($b['name'] ?? '');
                $tagline = strtolower($b['tagline'] ?? '');
                $desc = strtolower($b['description'] ?? '');
                $hq = strtolower($b['headquarters'] ?? '');
                $products = strtolower(implode(' ', $b['key_products'] ?? []));
                return str_contains($name, $search) || str_contains($tagline, $search) || str_contains($desc, $search) || str_contains($hq, $search) || str_contains($products, $search);
            }));

            $takaful = array_values(array_filter($takaful, function ($t) use ($search) {
                $name = strtolower($t['name'] ?? '');
                $tagline = strtolower($t['tagline'] ?? '');
                $desc = strtolower($t['description'] ?? '');
                $hq = strtolower($t['headquarters'] ?? '');
                $products = strtolower(implode(' ', $t['key_products'] ?? []));
                return str_contains($name, $search) || str_contains($tagline, $search) || str_contains($desc, $search) || str_contains($hq, $search) || str_contains($products, $search);
            }));
        }

        $response = [
            'counts' => [
                'funds' => count($funds),
                'banking' => count($banking),
                'takaful' => count($takaful),
                'total' => count($funds) + count($banking) + count($takaful),
            ],
            'funds' => ($group === 'all' || $group === 'funds') ? $funds : [],
            'banking' => ($group === 'all' || $group === 'banking') ? $banking : [],
            'takaful' => ($group === 'all' || $group === 'takaful') ? $takaful : [],
        ];

        return response()->json([
            'status' => 'success',
            'data' => $response,
        ]);
    }

    /**
     * Non-interest / Islamic commercial banks in Nigeria.
     */
    protected function getBankingData(): array
    {
        return [
            [
                'id' => 'jaiz-bank',
                'name' => 'Jaiz Bank Plc',
                'short_name' => 'Jaiz Bank',
                'category' => 'Banking',
                'sub_type' => 'Full Commercial Bank',
                'regulator' => 'Central Bank of Nigeria (CBN)',
                'license_type' => 'National Non-Interest Banking License',
                'deposit_insurance' => 'NDIC Insured',
                'launched' => '2012',
                'headquarters' => 'Jaiz Bank House, Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
                'website' => 'https://jaizbankplc.com',
                'tagline' => 'The Pioneer Non-Interest Bank in Nigeria',
                'description' => "Nigeria's pioneer full-fledged non-interest (Islamic) commercial bank, providing ethical retail, commercial, corporate banking, trade finance and Sukuk financing across Nigeria.",
                'shariah_board' => 'Advisory Committee of Experts (ACE) chaired by Dr. Muhammad Bashir',
                'key_products' => [
                    'Qard (Non-interest Current Account)',
                    'Mudarabah (Profit-sharing Savings & Term Deposits)',
                    'Murabaha (Cost-plus asset & trade financing)',
                    'Ijarah (Lease-to-own equipment & vehicle financing)',
                    'Istisna\'a (Project & real estate construction financing)',
                    'JaizMobile & Digital Banking Services'
                ]
            ],
            [
                'id' => 'lotus-bank',
                'name' => 'Lotus Bank Limited',
                'short_name' => 'Lotus Bank',
                'category' => 'Banking',
                'sub_type' => 'Commercial Bank',
                'regulator' => 'Central Bank of Nigeria (CBN)',
                'license_type' => 'Non-Interest Banking License',
                'deposit_insurance' => 'NDIC Insured',
                'launched' => 'July 2021',
                'headquarters' => '16 Billings Way, Oregun, Ikeja / Victoria Island, Lagos',
                'website' => 'https://lotusbank.com',
                'tagline' => 'Ethical, Inclusive & Digitally-Driven Non-Interest Banking',
                'description' => 'A dynamic non-interest bank dedicated to ethical principles, financial inclusion, digital convenience, and shared prosperity for individuals, SMEs, and corporate entities.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI & CBN standards',
                'key_products' => [
                    'Lotus Current & Savings Accounts',
                    'Lotus Business & SME Financing',
                    'Asset Acquisition Finance (Ijarah)',
                    'Working Capital & Trade Finance (Murabaha)',
                    'Import & Export Ethical Trade Solutions',
                    'Lotus Digital Banking Mobile App'
                ]
            ],
            [
                'id' => 'taj-bank',
                'name' => 'TAJBank Limited',
                'short_name' => 'Taj Bank',
                'category' => 'Banking',
                'sub_type' => 'Full Commercial Bank',
                'regulator' => 'Central Bank of Nigeria (CBN)',
                'license_type' => 'National Non-Interest Banking License',
                'deposit_insurance' => 'NDIC Insured',
                'launched' => '2019',
                'headquarters' => 'Plot 72 Ahmadu Bello Way, Central Business District, Abuja',
                'website' => 'https://tajbank.com',
                'tagline' => 'Bank with Peace of Mind',
                'description' => 'Leading non-interest bank recognized for innovative Sukuk issuances, high-yield ethical investments, customer-centric services, and seamless digital banking.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) overseeing product governance',
                'key_products' => [
                    'TAJ Savings & Current Accounts',
                    'Mudarabah Term Deposit Accounts',
                    'TAJ Mudarabah Sukuk Series',
                    'Auto & Equipment Finance (Ijarah wa Iqtina)',
                    'Corporate & SME Working Capital Financing',
                    'TAJWay Mobile Banking Application'
                ]
            ],
            [
                'id' => 'summit-bank',
                'name' => 'Summit Non-Interest Bank',
                'short_name' => 'Summit Bank',
                'category' => 'Banking',
                'sub_type' => 'Non-Interest Commercial Bank',
                'regulator' => 'Central Bank of Nigeria (CBN)',
                'license_type' => 'Non-Interest Banking License',
                'deposit_insurance' => 'NDIC Insured',
                'launched' => '2023',
                'headquarters' => 'Abuja / Lagos, Nigeria',
                'website' => 'https://summitbank.ng',
                'tagline' => 'Empowering Ethical Financial Growth',
                'description' => 'Specialized non-interest banking institution focused on financing productive real-sector commerce, small and medium enterprises, and ethical consumer needs.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) in accordance with CBN regulations',
                'key_products' => [
                    'Ethical Personal Accounts',
                    'Commercial & SME Shariah Financing',
                    'Agricultural & Commodity Trade Financing',
                    'Asset Acquisition & Leasing Facilities',
                    'Electronic Payment & Collection Services'
                ]
            ],
            [
                'id' => 'alternative-bank',
                'name' => 'The Alternative Bank Limited',
                'short_name' => 'Alternative Bank',
                'category' => 'Banking',
                'sub_type' => 'Full Commercial Bank',
                'regulator' => 'Central Bank of Nigeria (CBN)',
                'license_type' => 'Non-Interest Commercial Banking License',
                'deposit_insurance' => 'NDIC Insured',
                'launched' => '2023',
                'headquarters' => 'Sterling Towers, 20 Marina, Lagos, Nigeria',
                'website' => 'https://altbank.ng',
                'tagline' => 'Banking on Human Flourishing',
                'description' => 'Evolved from Sterling Alternative Finance into a standalone ethical bank offering transformative Islamic financial solutions, zero-interest consumer e-commerce, and sustainable wealth creation.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) overseeing all Shariah structures',
                'key_products' => [
                    'AltBank App & Digital Accounts',
                    'AltInvest (Shariah-compliant investment marketplace)',
                    'AltMall (Zero-interest asset & electronics purchase financing)',
                    'Commodity & Real Sector Trade Finance',
                    'Corporate Murabaha & Mudarabah Partnerships',
                    'Women & SME Ethical Business Support'
                ]
            ]
        ];
    }

    /**
     * Composite Takaful (Islamic insurance) operators in Nigeria.
     */
    protected function getTakafulData(): array
    {
        return [
            [
                'id' => 'jaiz-takaful',
                'name' => 'Jaiz Takaful Insurance Plc',
                'short_name' => 'Jaiz Takaful',
                'category' => 'Takaful',
                'sub_type' => 'Composite Takaful Operator',
                'regulator' => 'National Insurance Commission (NAICOM)',
                'license_type' => 'Full Composite Takaful License',
                'operational_model' => 'Hybrid Mudarabah & Wakala Model',
                'launched' => '2016',
                'headquarters' => 'Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
                'website' => 'https://jaiztakafulinsurance.com',
                'tagline' => 'Solidarity and Ethical Protection for All',
                'description' => 'Premier Takaful operator established to deliver cooperative risk protection based on mutual assistance, social solidarity, and transparent surplus distribution.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) supervising underwriting & investment pools',
                'key_products' => [
                    'General Takaful: Motor, Fire & Special Perils, Burglary, Marine Cargo',
                    'Family Takaful: Group Family Plan, Education Plan, Credit Life Protection',
                    'Engineering & Contractors\' All-Risk Takaful',
                    'Micro-Takaful for Individuals and Small Businesses',
                    'Annual Participant Underwriting Surplus Sharing'
                ]
            ],
            [
                'id' => 'noor-takaful',
                'name' => 'Noor Takaful Insurance Ltd',
                'short_name' => 'Noor Takaful',
                'category' => 'Takaful',
                'sub_type' => 'Composite Takaful Operator',
                'regulator' => 'National Insurance Commission (NAICOM)',
                'license_type' => 'Full Composite Takaful License',
                'operational_model' => 'Wakala-Waqf Model',
                'launched' => '2016',
                'headquarters' => '170 Awolowo Road, Ikoyi / Victoria Island, Lagos',
                'website' => 'https://noortakaful.ng',
                'tagline' => 'Your Ethical Financial Security Partner',
                'description' => 'Nigeria\'s pioneer composite Takaful operator with an established track record of prompt claim settlements and consecutive surplus cash back payments to participants.',
                'shariah_board' => 'Advisory Council of Experts (ACE) led by prominent international and local scholars',
                'key_products' => [
                    'Family Takaful: Tahfeez Plan, Family Shield, Education Plan, Group Life Takaful',
                    'General Takaful: Motor Vehicle, Home Protection, Marine Cargo, Commercial Assets',
                    'Travel Takaful: Hajj, Umrah & Worldwide Shariah Travel Protection',
                    'Agric & SME Takaful Solutions',
                    'Cash Surplus Sharing (Refunds to policyholders)'
                ]
            ],
            [
                'id' => 'crown-takaful',
                'name' => 'Crown Takaful Insurance Limited',
                'short_name' => 'Crown Takaful',
                'category' => 'Takaful',
                'sub_type' => 'Composite Takaful Operator',
                'regulator' => 'National Insurance Commission (NAICOM)',
                'license_type' => 'Composite Takaful Operator License',
                'operational_model' => 'Wakala & Mudarabah Model',
                'launched' => 'December 2023',
                'headquarters' => 'Victoria Island, Lagos, Nigeria',
                'website' => 'https://crowntakaful.com',
                'tagline' => 'Redefining Insurance with Dignity & Trust',
                'description' => 'Modern ethical insurance firm providing forward-thinking General and Family Takaful policies backed by digital underwriting and equitable community risk pooling.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI governance',
                'key_products' => [
                    'Motor Takaful (Comprehensive & Third Party)',
                    'Fire & Industrial Risk Takaful',
                    'Family Life Protection & Child Education Takaful',
                    'Marine Cargo & Aviation Takaful Coverage',
                    'Community Participant Surplus Fund'
                ]
            ],
            [
                'id' => 'hilal-takaful',
                'name' => 'Hilal Takaful Nigeria Limited',
                'short_name' => 'Hilal Takaful',
                'category' => 'Takaful',
                'sub_type' => 'Composite Takaful Operator',
                'regulator' => 'National Insurance Commission (NAICOM)',
                'license_type' => 'Composite Takaful Operator License',
                'operational_model' => 'Mudarabah & Wakala Model',
                'launched' => '2020',
                'headquarters' => '21 Water Corporation Drive, Victoria Island, Lagos',
                'website' => 'https://hilaltakafulng.com',
                'tagline' => 'The Crescent of Ethical Security',
                'description' => 'A premier subsidiary of Cornerstone Insurance Plc providing specialized Shariah-compliant risk mitigation and family financial planning across Nigeria.',
                'shariah_board' => 'Advisory Committee of Experts (ACE)',
                'key_products' => [
                    'Hilal Education Takaful Plan',
                    'Hilal Golden Family Plan (Savings & Life Cover)',
                    'Hilal Motor & Commercial Vehicle Takaful',
                    'Property, Fire & Burglary Takaful Protection',
                    'Travel & Medical Takaful Plans'
                ]
            ],
            [
                'id' => 'salam-takaful',
                'name' => 'Salam Takaful Insurance Limited',
                'short_name' => 'Salam Takaful',
                'category' => 'Takaful',
                'sub_type' => 'Composite Takaful Operator',
                'regulator' => 'National Insurance Commission (NAICOM)',
                'license_type' => 'Composite Takaful Operator License',
                'operational_model' => 'Wakala & Mudarabah Model',
                'launched' => '2019',
                'headquarters' => 'Kano / Abuja, Nigeria',
                'website' => 'https://salamtakaful.com',
                'tagline' => 'Peace of Mind through Islamic Solidarity',
                'description' => 'Northern Nigeria-rooted composite Takaful operator offering grassroots and corporate non-interest insurance, agricultural safety nets, and cooperative family security.',
                'shariah_board' => 'Advisory Committee of Experts (ACE) monitoring all Tabarru\' allocations',
                'key_products' => [
                    'Family Takaful: Education Support, Individual Family Term, Group Life',
                    'General Takaful: Motor, Agribusiness & Livestock, Fire, Marine',
                    'Micro-Takaful for Smallholder Farmers and Traders',
                    'Public Liability & Personal Accident Coverage',
                    'Participant Surplus Distribution'
                ]
            ]
        ];
    }
}
