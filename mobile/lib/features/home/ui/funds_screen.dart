import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_service.dart';
import '../../stocks/data/stock_repository.dart';

class FundsScreen extends StatefulWidget {
  const FundsScreen({super.key});

  @override
  State<FundsScreen> createState() => _FundsScreenState();
}

class _FundsScreenState extends State<FundsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final StockRepository _stockRepo = StockRepository();

  String _searchQuery = '';
  String _activeGrouping = 'all'; // 'all', 'funds', 'banking', 'takaful'
  String _activeType = 'All';

  List<Map<String, dynamic>> _funds = [];
  List<Map<String, dynamic>> _banking = [];
  List<Map<String, dynamic>> _takaful = [];
  bool _isLoading = true;

  static const List<String> _allTypes = [
    'All',
    'Fixed Income',
    'Balanced',
    'Equity',
    'ETF',
    'Endowment',
    'Commodities',
    'Ethical',
  ];

  static final List<Map<String, dynamic>> _staticBanking = [
    {
      'id': 'jaiz-bank',
      'name': 'Jaiz Bank Plc',
      'short_name': 'Jaiz Bank',
      'category': 'Banking',
      'sub_type': 'Full Commercial Bank',
      'regulator': 'Central Bank of Nigeria (CBN)',
      'license_type': 'National Non-Interest Banking License',
      'deposit_insurance': 'NDIC Insured',
      'launched': '2012',
      'headquarters': 'Jaiz Bank House, Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
      'website': 'https://jaizbankplc.com',
      'tagline': 'The Pioneer Non-Interest Bank in Nigeria',
      'description': "Nigeria's pioneer full-fledged non-interest (Islamic) commercial bank, providing ethical retail, commercial, corporate banking, trade finance and Sukuk financing across Nigeria.",
      'shariah_board': 'Advisory Committee of Experts (ACE) chaired by Dr. Muhammad Bashir',
      'key_products': [
        'Qard (Non-interest Current Account)',
        'Mudarabah (Profit-sharing Savings & Term Deposits)',
        'Murabaha (Cost-plus asset & trade financing)',
        'Ijarah (Lease-to-own equipment & vehicle financing)',
        'Istisna\'a (Project & real estate construction financing)',
        'JaizMobile & Digital Banking Services'
      ]
    },
    {
      'id': 'lotus-bank',
      'name': 'Lotus Bank Limited',
      'short_name': 'Lotus Bank',
      'category': 'Banking',
      'sub_type': 'Commercial Bank',
      'regulator': 'Central Bank of Nigeria (CBN)',
      'license_type': 'Non-Interest Banking License',
      'deposit_insurance': 'NDIC Insured',
      'launched': 'July 2021',
      'headquarters': '16 Billings Way, Oregun, Ikeja / Victoria Island, Lagos',
      'website': 'https://lotusbank.com',
      'tagline': 'Ethical, Inclusive & Digitally-Driven Non-Interest Banking',
      'description': 'A dynamic non-interest bank dedicated to ethical principles, financial inclusion, digital convenience, and shared prosperity for individuals, SMEs, and corporate entities.',
      'shariah_board': 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI & CBN standards',
      'key_products': [
        'Lotus Current & Savings Accounts',
        'Lotus Business & SME Financing',
        'Asset Acquisition Finance (Ijarah)',
        'Working Capital & Trade Finance (Murabaha)',
        'Import & Export Ethical Trade Solutions',
        'Lotus Digital Banking Mobile App'
      ]
    },
    {
      'id': 'taj-bank',
      'name': 'TAJBank Limited',
      'short_name': 'Taj Bank',
      'category': 'Banking',
      'sub_type': 'Full Commercial Bank',
      'regulator': 'Central Bank of Nigeria (CBN)',
      'license_type': 'National Non-Interest Banking License',
      'deposit_insurance': 'NDIC Insured',
      'launched': '2019',
      'headquarters': 'Plot 72 Ahmadu Bello Way, Central Business District, Abuja',
      'website': 'https://tajbank.com',
      'tagline': 'Bank with Peace of Mind',
      'description': 'Leading non-interest bank recognized for innovative Sukuk issuances, high-yield ethical investments, customer-centric services, and seamless digital banking.',
      'shariah_board': 'Advisory Committee of Experts (ACE) overseeing product governance',
      'key_products': [
        'TAJ Savings & Current Accounts',
        'Mudarabah Term Deposit Accounts',
        'TAJ Mudarabah Sukuk Series',
        'Auto & Equipment Finance (Ijarah wa Iqtina)',
        'Corporate & SME Working Capital Financing',
        'TAJWay Mobile Banking Application'
      ]
    },
    {
      'id': 'summit-bank',
      'name': 'Summit Non-Interest Bank',
      'short_name': 'Summit Bank',
      'category': 'Banking',
      'sub_type': 'Non-Interest Commercial Bank',
      'regulator': 'Central Bank of Nigeria (CBN)',
      'license_type': 'Non-Interest Banking License',
      'deposit_insurance': 'NDIC Insured',
      'launched': '2023',
      'headquarters': 'Abuja / Lagos, Nigeria',
      'website': 'https://summitbank.ng',
      'tagline': 'Empowering Ethical Financial Growth',
      'description': 'Specialized non-interest banking institution focused on financing productive real-sector commerce, small and medium enterprises, and ethical consumer needs.',
      'shariah_board': 'Advisory Committee of Experts (ACE) in accordance with CBN regulations',
      'key_products': [
        'Ethical Personal Accounts',
        'Commercial & SME Shariah Financing',
        'Agricultural & Commodity Trade Financing',
        'Asset Acquisition & Leasing Facilities',
        'Electronic Payment & Collection Services'
      ]
    },
    {
      'id': 'alternative-bank',
      'name': 'The Alternative Bank Limited',
      'short_name': 'Alternative Bank',
      'category': 'Banking',
      'sub_type': 'Full Commercial Bank',
      'regulator': 'Central Bank of Nigeria (CBN)',
      'license_type': 'Non-Interest Commercial Banking License',
      'deposit_insurance': 'NDIC Insured',
      'launched': '2023',
      'headquarters': 'Sterling Towers, 20 Marina, Lagos, Nigeria',
      'website': 'https://altbank.ng',
      'tagline': 'Banking on Human Flourishing',
      'description': 'Evolved from Sterling Alternative Finance into a standalone ethical bank offering transformative Islamic financial solutions, zero-interest consumer e-commerce, and sustainable wealth creation.',
      'shariah_board': 'Advisory Committee of Experts (ACE) overseeing all Shariah structures',
      'key_products': [
        'AltBank App & Digital Accounts',
        'AltInvest (Shariah-compliant investment marketplace)',
        'AltMall (Zero-interest asset & electronics purchase financing)',
        'Commodity & Real Sector Trade Finance',
        'Corporate Murabaha & Mudarabah Partnerships',
        'Women & SME Ethical Business Support'
      ]
    }
  ];

  static final List<Map<String, dynamic>> _staticTakaful = [
    {
      'id': 'jaiz-takaful',
      'name': 'Jaiz Takaful Insurance Plc',
      'short_name': 'Jaiz Takaful',
      'category': 'Takaful',
      'sub_type': 'Composite Takaful Operator',
      'regulator': 'National Insurance Commission (NAICOM)',
      'license_type': 'Full Composite Takaful License',
      'operational_model': 'Hybrid Mudarabah & Wakala Model',
      'launched': '2016',
      'headquarters': 'Plot 1073, J.S. Tarka Way, Area 3, Garki, Abuja',
      'website': 'https://jaiztakafulinsurance.com',
      'tagline': 'Solidarity and Ethical Protection for All',
      'description': 'Premier Takaful operator established to deliver cooperative risk protection based on mutual assistance, social solidarity, and transparent surplus distribution.',
      'shariah_board': 'Advisory Committee of Experts (ACE) supervising underwriting & investment pools',
      'key_products': [
        'General Takaful: Motor, Fire & Special Perils, Burglary, Marine Cargo',
        'Family Takaful: Group Family Plan, Education Plan, Credit Life Protection',
        'Engineering & Contractors\' All-Risk Takaful',
        'Micro-Takaful for Individuals and Small Businesses',
        'Annual Participant Underwriting Surplus Sharing'
      ]
    },
    {
      'id': 'noor-takaful',
      'name': 'Noor Takaful Insurance Ltd',
      'short_name': 'Noor Takaful',
      'category': 'Takaful',
      'sub_type': 'Composite Takaful Operator',
      'regulator': 'National Insurance Commission (NAICOM)',
      'license_type': 'Full Composite Takaful License',
      'operational_model': 'Wakala-Waqf Model',
      'launched': '2016',
      'headquarters': '170 Awolowo Road, Ikoyi / Victoria Island, Lagos',
      'website': 'https://noortakaful.ng',
      'tagline': 'Your Ethical Financial Security Partner',
      'description': "Nigeria's pioneer composite Takaful operator with an established track record of prompt claim settlements and consecutive surplus cash back payments to participants.",
      'shariah_board': 'Advisory Council of Experts (ACE) led by prominent international and local scholars',
      'key_products': [
        'Family Takaful: Tahfeez Plan, Family Shield, Education Plan, Group Life Takaful',
        'General Takaful: Motor Vehicle, Home Protection, Marine Cargo, Commercial Assets',
        'Travel Takaful: Hajj, Umrah & Worldwide Shariah Travel Protection',
        'Agric & SME Takaful Solutions',
        'Cash Surplus Sharing (Refunds to policyholders)'
      ]
    },
    {
      'id': 'crown-takaful',
      'name': 'Crown Takaful Insurance Limited',
      'short_name': 'Crown Takaful',
      'category': 'Takaful',
      'sub_type': 'Composite Takaful Operator',
      'regulator': 'National Insurance Commission (NAICOM)',
      'license_type': 'Composite Takaful Operator License',
      'operational_model': 'Wakala & Mudarabah Model',
      'launched': 'December 2023',
      'headquarters': 'Victoria Island, Lagos, Nigeria',
      'website': 'https://crowntakaful.com',
      'tagline': 'Redefining Insurance with Dignity & Trust',
      'description': 'Modern ethical insurance firm providing forward-thinking General and Family Takaful policies backed by digital underwriting and equitable community risk pooling.',
      'shariah_board': 'Advisory Committee of Experts (ACE) ensuring strict adherence to AAOIFI governance',
      'key_products': [
        'Motor Takaful (Comprehensive & Third Party)',
        'Fire & Industrial Risk Takaful',
        'Family Life Protection & Child Education Takaful',
        'Marine Cargo & Aviation Takaful Coverage',
        'Community Participant Surplus Fund'
      ]
    },
    {
      'id': 'hilal-takaful',
      'name': 'Hilal Takaful Nigeria Limited',
      'short_name': 'Hilal Takaful',
      'category': 'Takaful',
      'sub_type': 'Composite Takaful Operator',
      'regulator': 'National Insurance Commission (NAICOM)',
      'license_type': 'Composite Takaful Operator License',
      'operational_model': 'Mudarabah & Wakala Model',
      'launched': '2020',
      'headquarters': '21 Water Corporation Drive, Victoria Island, Lagos',
      'website': 'https://hilaltakafulng.com',
      'tagline': 'The Crescent of Ethical Security',
      'description': 'A premier subsidiary of Cornerstone Insurance Plc providing specialized Shariah-compliant risk mitigation and family financial planning across Nigeria.',
      'shariah_board': 'Advisory Committee of Experts (ACE)',
      'key_products': [
        'Hilal Education Takaful Plan',
        'Hilal Golden Family Plan (Savings & Life Cover)',
        'Hilal Motor & Commercial Vehicle Takaful',
        'Property, Fire & Burglary Takaful Protection',
        'Travel & Medical Takaful Plans'
      ]
    },
    {
      'id': 'salam-takaful',
      'name': 'Salam Takaful Insurance Limited',
      'short_name': 'Salam Takaful',
      'category': 'Takaful',
      'sub_type': 'Composite Takaful Operator',
      'regulator': 'National Insurance Commission (NAICOM)',
      'license_type': 'Composite Takaful Operator License',
      'operational_model': 'Wakala & Mudarabah Model',
      'launched': '2019',
      'headquarters': 'Kano / Abuja, Nigeria',
      'website': 'https://salamtakaful.com',
      'tagline': 'Peace of Mind through Islamic Solidarity',
      'description': 'Northern Nigeria-rooted composite Takaful operator offering grassroots and corporate non-interest insurance, agricultural safety nets, and cooperative family security.',
      'shariah_board': 'Advisory Committee of Experts (ACE) monitoring all Tabarru\' allocations',
      'key_products': [
        'Family Takaful: Education Support, Individual Family Term, Group Life',
        'General Takaful: Motor, Agribusiness & Livestock, Fire, Marine',
        'Micro-Takaful for Smallholder Farmers and Traders',
        'Public Liability & Personal Accident Coverage',
        'Participant Surplus Distribution'
      ]
    }
  ];

  @override
  void initState() {
    super.initState();
    _banking = List.from(_staticBanking);
    _takaful = List.from(_staticTakaful);
    _fetchDirectory();
  }

  Future<void> _fetchDirectory() async {
    try {
      final res = await ApiService().get('directory');
      final data = res.data?['data'];
      if (data != null && mounted) {
        setState(() {
          if (data['funds'] != null && (data['funds'] as List).isNotEmpty) {
            _funds = (data['funds'] as List).map((s) => s as Map<String, dynamic>).toList();
          }
          if (data['banking'] != null && (data['banking'] as List).isNotEmpty) {
            _banking = (data['banking'] as List).map((s) => s as Map<String, dynamic>).toList();
          }
          if (data['takaful'] != null && (data['takaful'] as List).isNotEmpty) {
            _takaful = (data['takaful'] as List).map((s) => s as Map<String, dynamic>).toList();
          }
          _isLoading = false;
        });
        return;
      }
    } catch (_) {
      // Fallback to stockRepo
    }

    // Fallback: fetch mutual funds from ngx endpoint
    try {
      final res = await _stockRepo.getNgxStocksPaginated(1);
      final List<dynamic> data = res['data'] ?? [];

      final mutualFunds = data
          .where((s) => s['asset_class'] == 'mutual_fund')
          .map((s) => s as Map<String, dynamic>)
          .toList();

      if (mounted) {
        setState(() {
          _funds = mutualFunds;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching directory funds: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Color _typeColor(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income':
        return context.primary;
      case 'Balanced':
        return context.halal;
      case 'Equity':
        return context.primary;
      case 'ETF':
        return context.questionable;
      case 'Endowment':
        return context.questionable;
      case 'Commodities':
        return context.questionable;
      case 'Ethical':
        return context.halal;
      default:
        return context.primary;
    }
  }

  Color _typeBg(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income':
        return context.primary.withValues(alpha: 0.1);
      case 'Balanced':
        return context.halalBg;
      case 'Equity':
        return context.primary.withValues(alpha: 0.14);
      case 'ETF':
        return context.questionableBg;
      case 'Endowment':
        return context.questionableBg;
      case 'Commodities':
        return context.questionableBg;
      case 'Ethical':
        return context.halalBg;
      default:
        return context.primary.withValues(alpha: 0.1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _searchQuery.toLowerCase().trim();

    // Filter funds
    final filteredFunds = _funds.where((fund) {
      final fd = (fund['fund_details'] as Map<String, dynamic>?) ?? {};
      final provider = (fd['provider']?.toString() ?? '').toLowerCase();
      final name = (fund['name']?.toString() ?? '').toLowerCase();
      final strategy = (fd['investment_components_target']?.toString() ?? '').toLowerCase();

      final matchSearch = q.isEmpty ||
          name.contains(q) ||
          provider.contains(q) ||
          strategy.contains(q);

      final sector = fund['sector']?.toString() ?? 'Balanced';
      final matchType = _activeType == 'All' || sector == _activeType;

      return matchSearch && matchType;
    }).toList();

    // Filter banks
    final filteredBanking = _banking.where((b) {
      if (q.isEmpty) return true;
      final name = (b['name']?.toString() ?? '').toLowerCase();
      final shortName = (b['short_name']?.toString() ?? '').toLowerCase();
      final tagline = (b['tagline']?.toString() ?? '').toLowerCase();
      final desc = (b['description']?.toString() ?? '').toLowerCase();
      final hq = (b['headquarters']?.toString() ?? '').toLowerCase();
      final prods = ((b['key_products'] as List?)?.join(' ') ?? '').toLowerCase();
      return name.contains(q) || shortName.contains(q) || tagline.contains(q) || desc.contains(q) || hq.contains(q) || prods.contains(q);
    }).toList();

    // Filter takaful
    final filteredTakaful = _takaful.where((t) {
      if (q.isEmpty) return true;
      final name = (t['name']?.toString() ?? '').toLowerCase();
      final shortName = (t['short_name']?.toString() ?? '').toLowerCase();
      final tagline = (t['tagline']?.toString() ?? '').toLowerCase();
      final desc = (t['description']?.toString() ?? '').toLowerCase();
      final hq = (t['headquarters']?.toString() ?? '').toLowerCase();
      final prods = ((t['key_products'] as List?)?.join(' ') ?? '').toLowerCase();
      return name.contains(q) || shortName.contains(q) || tagline.contains(q) || desc.contains(q) || hq.contains(q) || prods.contains(q);
    }).toList();

    final totalCount = filteredFunds.length + filteredBanking.length + filteredTakaful.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ─── Search Bar ───
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
          child: Container(
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.divider),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              style: TextStyle(color: context.textDark, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search funds, banks, takaful, or products...',
                hintStyle: TextStyle(color: context.textMuted, fontSize: 13.5),
                prefixIcon: Icon(Icons.search, color: context.textMuted, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.close, color: context.textMuted, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ),

        // ─── Primary Grouping Tabs ───
        SizedBox(
          height: 42,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            children: [
              _buildGroupingTab(
                id: 'all',
                label: 'All',
                count: totalCount,
                icon: Icons.layers_outlined,
              ),
              const SizedBox(width: 8),
              _buildGroupingTab(
                id: 'funds',
                label: 'Ethical Funds',
                count: filteredFunds.length,
                icon: Icons.pie_chart_outline_rounded,
              ),
              const SizedBox(width: 8),
              _buildGroupingTab(
                id: 'banking',
                label: 'Banking',
                count: filteredBanking.length,
                icon: Icons.account_balance_outlined,
              ),
              const SizedBox(width: 8),
              _buildGroupingTab(
                id: 'takaful',
                label: 'Takaful',
                count: filteredTakaful.length,
                icon: Icons.shield_outlined,
              ),
            ],
          ),
        ),

        // ─── Secondary Sub-Filter Pills (Active for Ethical Funds / All) ───
        if (_activeGrouping == 'funds' || _activeGrouping == 'all') ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 32,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _allTypes.length,
              separatorBuilder: (_, _) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final type = _allTypes[i];
                final isActive = _activeType == type;
                final color = type == 'All' ? context.primary : _typeColor(context, type);
                final bg = type == 'All'
                    ? context.primary.withValues(alpha: 0.1)
                    : _typeBg(context, type);
                return GestureDetector(
                  onTap: () => setState(() => _activeType = type),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: isActive ? bg : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isActive ? color : context.divider,
                        width: 1.2,
                      ),
                    ),
                    child: Text(
                      type,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isActive ? color : context.textMuted,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],

        const SizedBox(height: 12),

        // ─── Directory List Content ───
        Expanded(
          child: _isLoading
              ? Center(child: CircularProgressIndicator(color: context.primary))
              : _buildListContent(
                  filteredFunds: filteredFunds,
                  filteredBanking: filteredBanking,
                  filteredTakaful: filteredTakaful,
                ),
        ),
      ],
    );
  }

  Widget _buildGroupingTab({
    required String id,
    required String label,
    required int count,
    required IconData icon,
  }) {
    final isActive = _activeGrouping == id;
    return GestureDetector(
      onTap: () => setState(() => _activeGrouping = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? context.primary.withValues(alpha: 0.12) : context.bgAlt,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? context.primary : context.divider,
            width: isActive ? 1.6 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isActive ? context.primary : context.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
                color: isActive ? context.primary : context.textDark,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isActive ? context.primary : context.divider.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: isActive ? Colors.white : context.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListContent({
    required List<Map<String, dynamic>> filteredFunds,
    required List<Map<String, dynamic>> filteredBanking,
    required List<Map<String, dynamic>> filteredTakaful,
  }) {
    if (_activeGrouping == 'banking') {
      if (filteredBanking.isEmpty) return _buildEmptyState('No banking institutions found');
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
        itemCount: filteredBanking.length,
        itemBuilder: (context, i) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: _BankCard(bank: filteredBanking[i]),
        ),
      );
    }

    if (_activeGrouping == 'takaful') {
      if (filteredTakaful.isEmpty) return _buildEmptyState('No Takaful operators found');
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
        itemCount: filteredTakaful.length,
        itemBuilder: (context, i) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: _TakafulCard(takaful: filteredTakaful[i]),
        ),
      );
    }

    if (_activeGrouping == 'funds') {
      if (filteredFunds.isEmpty) return _buildEmptyState('No ethical funds found');
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
        itemCount: filteredFunds.length,
        itemBuilder: (context, i) {
          final sector = filteredFunds[i]['sector']?.toString() ?? 'Balanced';
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _FundCard(
              fund: filteredFunds[i],
              typeColor: _typeColor(context, sector),
              typeBg: _typeBg(context, sector),
            ),
          );
        },
      );
    }

    // All Groupings integrated
    final totalItems = filteredBanking.length + filteredTakaful.length + filteredFunds.length;
    if (totalItems == 0) return _buildEmptyState('No directory listings found');

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
      children: [
        if (filteredBanking.isNotEmpty) ...[
          _buildSectionHeader('Islamic Commercial Banks', Icons.account_balance_outlined, filteredBanking.length, context.primary),
          const SizedBox(height: 10),
          ...filteredBanking.map((b) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _BankCard(bank: b),
          )),
          const SizedBox(height: 14),
        ],

        if (filteredTakaful.isNotEmpty) ...[
          _buildSectionHeader('Takaful (Islamic Insurance) Operators', Icons.shield_outlined, filteredTakaful.length, const Color(0xFFC69249)),
          const SizedBox(height: 10),
          ...filteredTakaful.map((t) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _TakafulCard(takaful: t),
          )),
          const SizedBox(height: 14),
        ],

        if (filteredFunds.isNotEmpty) ...[
          _buildSectionHeader('SEC-Approved Ethical Mutual Funds & ETFs', Icons.pie_chart_outline_rounded, filteredFunds.length, context.halal),
          const SizedBox(height: 10),
          ...filteredFunds.map((f) {
            final sector = f['sector']?.toString() ?? 'Balanced';
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _FundCard(
                fund: f,
                typeColor: _typeColor(context, sector),
                typeBg: _typeBg(context, sector),
              ),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, int count, Color accentColor) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: accentColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 14, color: accentColor),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.6,
              color: context.textDark,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(
            color: accentColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w900,
              color: accentColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 48, color: context.textMuted.withValues(alpha: 0.6)),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(color: context.textMuted, fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

// ─── Bank Card ─────────────────────────────────────────────────────────────
class _BankCard extends StatefulWidget {
  final Map<String, dynamic> bank;
  const _BankCard({required this.bank});

  @override
  State<_BankCard> createState() => _BankCardState();
}

class _BankCardState extends State<_BankCard> {
  bool _expanded = false;

  Future<void> _launchWebsite(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Error launching bank website: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bank = widget.bank;
    final name = bank['name']?.toString() ?? 'Islamic Bank';
    final subType = bank['sub_type']?.toString() ?? 'Commercial Bank';
    final insurance = bank['deposit_insurance']?.toString() ?? 'NDIC Insured';
    final launched = bank['launched']?.toString() ?? '';
    final website = bank['website']?.toString() ?? '';
    final tagline = bank['tagline']?.toString() ?? '';
    final desc = bank['description']?.toString() ?? '';
    final hq = bank['headquarters']?.toString() ?? '';
    final shariah = bank['shariah_board']?.toString() ?? '';
    final products = (bank['key_products'] as List?)?.map((e) => e.toString()).toList() ?? [];

    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top accent strip
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.primary, const Color(0xFF16A34A)],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Logo Avatar + Name + Badges
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: context.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.primary.withValues(alpha: 0.25)),
                      ),
                      alignment: Alignment.center,
                      child: Icon(Icons.account_balance, color: context.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: TextStyle(
                              color: context.textDark,
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: context.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  subType,
                                  style: TextStyle(
                                    color: context.primary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'CBN Licensed',
                                  style: TextStyle(
                                    color: Color(0xFF16A34A),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFC69249).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  insurance,
                                  style: const TextStyle(
                                    color: Color(0xFFC69249),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              if (launched.isNotEmpty)
                                Text(
                                  'Est. $launched',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                if (tagline.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    '“$tagline”',
                    style: TextStyle(
                      color: context.textMuted,
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],

                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: context.divider, height: 1),
                ),

                Text(
                  desc,
                  maxLines: _expanded ? null : 2,
                  overflow: _expanded ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.textBody,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),

                if (_expanded) ...[
                  const SizedBox(height: 14),

                  // Key Products
                  if (products.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(Icons.check_circle_outline, size: 14, color: context.primary),
                        const SizedBox(width: 6),
                        Text(
                          'KEY PRODUCTS & SERVICES',
                          style: TextStyle(
                            color: context.textDark,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...products.map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 4, left: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('• ', style: TextStyle(color: context.primary, fontWeight: FontWeight.w900)),
                          Expanded(
                            child: Text(
                              p,
                              style: TextStyle(color: context.textBody, fontSize: 12.5, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 12),
                  ],

                  // Shariah Governance
                  if (shariah.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(Icons.gavel_outlined, size: 14, color: const Color(0xFFC69249)),
                        const SizedBox(width: 6),
                        Text(
                          'SHARIAH GOVERNANCE',
                          style: TextStyle(
                            color: context.textDark,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      shariah,
                      style: TextStyle(color: context.textMuted, fontSize: 12.5, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Headquarters
                  if (hq.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.location_on_outlined, size: 14, color: context.textMuted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            hq,
                            style: TextStyle(color: context.textMuted, fontSize: 11.5, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ],

                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _expanded = !_expanded),
                      child: Row(
                        children: [
                          Text(
                            _expanded ? 'Show less' : 'View products & details',
                            style: TextStyle(
                              color: context.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                            size: 16,
                            color: context.primary,
                          ),
                        ],
                      ),
                    ),
                    if (website.isNotEmpty)
                      GestureDetector(
                        onTap: () => _launchWebsite(website),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: context.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: context.primary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              Text(
                                'Official Website',
                                style: TextStyle(
                                  color: context.primary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.open_in_new, size: 12, color: context.primary),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Takaful Card ──────────────────────────────────────────────────────────
class _TakafulCard extends StatefulWidget {
  final Map<String, dynamic> takaful;
  const _TakafulCard({required this.takaful});

  @override
  State<_TakafulCard> createState() => _TakafulCardState();
}

class _TakafulCardState extends State<_TakafulCard> {
  bool _expanded = false;

  Future<void> _launchWebsite(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Error launching takaful website: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.takaful;
    final name = t['name']?.toString() ?? 'Takaful Operator';
    final model = t['operational_model']?.toString() ?? 'Wakala-Waqf';
    final launched = t['launched']?.toString() ?? '';
    final website = t['website']?.toString() ?? '';
    final tagline = t['tagline']?.toString() ?? '';
    final desc = t['description']?.toString() ?? '';
    final hq = t['headquarters']?.toString() ?? '';
    final shariah = t['shariah_board']?.toString() ?? '';
    final products = (t['key_products'] as List?)?.map((e) => e.toString()).toList() ?? [];

    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top accent strip
          Container(
            height: 3,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFC69249), Color(0xFF0D9488)],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Shield Icon + Name + Badges
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFC69249).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFC69249).withValues(alpha: 0.3)),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(Icons.shield_outlined, color: Color(0xFFC69249), size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: TextStyle(
                              color: context.textDark,
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFC69249).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'NAICOM Licensed',
                                  style: TextStyle(
                                    color: Color(0xFFC69249),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Surplus Sharing',
                                  style: TextStyle(
                                    color: Color(0xFF16A34A),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: context.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  model,
                                  style: TextStyle(
                                    color: context.primary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              if (launched.isNotEmpty)
                                Text(
                                  'Est. $launched',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                if (tagline.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    '“$tagline”',
                    style: TextStyle(
                      color: context.textMuted,
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],

                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: context.divider, height: 1),
                ),

                Text(
                  desc,
                  maxLines: _expanded ? null : 2,
                  overflow: _expanded ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.textBody,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),

                if (_expanded) ...[
                  const SizedBox(height: 14),

                  // Key Products
                  if (products.isNotEmpty) ...[
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFFC69249)),
                        const SizedBox(width: 6),
                        Text(
                          'TAKAFUL PLANS & COVERAGE',
                          style: TextStyle(
                            color: context.textDark,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...products.map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 4, left: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(color: Color(0xFFC69249), fontWeight: FontWeight.w900)),
                          Expanded(
                            child: Text(
                              p,
                              style: TextStyle(color: context.textBody, fontSize: 12.5, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 12),
                  ],

                  // Shariah Governance
                  if (shariah.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(Icons.gavel_outlined, size: 14, color: context.primary),
                        const SizedBox(width: 6),
                        Text(
                          'SHARIAH GOVERNANCE',
                          style: TextStyle(
                            color: context.textDark,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      shariah,
                      style: TextStyle(color: context.textMuted, fontSize: 12.5, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Headquarters
                  if (hq.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.location_on_outlined, size: 14, color: context.textMuted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            hq,
                            style: TextStyle(color: context.textMuted, fontSize: 11.5, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ],

                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _expanded = !_expanded),
                      child: Row(
                        children: [
                          Text(
                            _expanded ? 'Show less' : 'View plans & details',
                            style: const TextStyle(
                              color: Color(0xFFC69249),
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(
                            Icons.keyboard_arrow_down,
                            size: 16,
                            color: Color(0xFFC69249),
                          ),
                        ],
                      ),
                    ),
                    if (website.isNotEmpty)
                      GestureDetector(
                        onTap: () => _launchWebsite(website),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFC69249).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFC69249).withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            children: [
                              Text(
                                'Official Website',
                                style: TextStyle(
                                  color: Color(0xFFC69249),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.open_in_new, size: 12, color: Color(0xFFC69249)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Fund Card ─────────────────────────────────────────────────────────────
class _FundCard extends StatefulWidget {
  final Map<String, dynamic> fund;
  final Color typeColor;
  final Color typeBg;
  const _FundCard({
    required this.fund,
    required this.typeColor,
    required this.typeBg,
  });

  @override
  State<_FundCard> createState() => _FundCardState();
}

class _FundCardState extends State<_FundCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final fund = widget.fund;
    final fd = (fund['fund_details'] as Map<String, dynamic>?) ?? {};

    final trustee = fd['trustee']?.toString() ?? '';
    final custodian = fd['custodian']?.toString() ?? '';
    final provider = fd['provider']?.toString() ?? 'N/A';
    final strategy =
        fd['investment_components_target']?.toString() ??
        'No strategy details provided.';
    final assetMix = fd['asset_mix']?.toString() ?? 'Not available.';
    final purification =
        fd['purification_note']?.toString() ?? 'Not disclosed.';
    final launched = fd['launched']?.toString() ?? '';

    final hasMeta = trustee.isNotEmpty || custodian.isNotEmpty;
    final historyRaw = fd['purification_history'];
    final history = (historyRaw is List) ? historyRaw : [];

    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.primary, context.questionable],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: context.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: context.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        fund['name'].toString().isNotEmpty
                            ? fund['name'].toString()[0].toUpperCase()
                            : 'F',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fund['name']?.toString() ?? '',
                            style: TextStyle(
                              color: context.textDark,
                              fontWeight: FontWeight.w900,
                              fontSize: 14.5,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: widget.typeBg,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: widget.typeColor.withValues(
                                      alpha: 0.25,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  fund['sector']?.toString() ?? 'Balanced',
                                  style: TextStyle(
                                    color: widget.typeColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                              if (launched.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.calendar_today,
                                  size: 11,
                                  color: context.textMuted,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  'Est. $launched',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Icon(Icons.business, size: 13, color: context.textMuted),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        provider,
                        style: TextStyle(
                          color: context.textMuted,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),

                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: context.divider, height: 1),
                ),

                Text(
                  strategy,
                  maxLines: _expanded ? null : 2,
                  overflow: _expanded ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.textBody,
                    fontSize: 13,
                    height: 1.55,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                if (_expanded) ...[
                  const SizedBox(height: 16),

                  // Asset Mix
                  Row(
                    children: [
                      const Icon(
                        Icons.pie_chart_outline,
                        size: 14,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'ASSET MIX',
                        style: TextStyle(
                          color: context.textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    assetMix,
                    style: TextStyle(
                      color: context.textMuted,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Purification
                  Row(
                    children: [
                      const Icon(
                        Icons.water_drop_outlined,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'PURIFICATION DETAILS',
                        style: TextStyle(
                          color: context.textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    purification,
                    style: TextStyle(
                      color: context.textMuted,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  if (history.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: context.divider),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: context.bgSection,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(8),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'YEAR',
                                    style: TextStyle(
                                      color: context.textMuted,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                Text(
                                  'PER UNIT (₦)',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ...history
                              .map(
                                (h) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      top: BorderSide(color: context.divider),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          h['year'].toString(),
                                          style: TextStyle(
                                            color: context.textDark,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        '₦${double.tryParse(h['per_unit'].toString())?.toStringAsFixed(5) ?? h['per_unit']}',
                                        style: const TextStyle(
                                          color: Colors.orange,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                        ],
                      ),
                    ),
                  ],

                  if (hasMeta) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (trustee.isNotEmpty)
                          _MetaChip(
                            label: 'Trustee',
                            value: trustee,
                            icon: Icons.shield_outlined,
                          ),
                        if (custodian.isNotEmpty)
                          _MetaChip(
                            label: 'Custodian',
                            value: custodian,
                            icon: Icons.account_balance_outlined,
                          ),
                      ],
                    ),
                  ],
                ],

                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Row(
                    children: [
                      Text(
                        _expanded ? 'Show less' : 'Show full details',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        _expanded
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        size: 16,
                        color: context.primary,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _MetaChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.bgSection,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: context.textMuted),
          const SizedBox(width: 5),
          Text(
            '$label: ',
            style: TextStyle(
              color: context.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: context.textDark,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
