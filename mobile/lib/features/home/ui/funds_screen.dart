import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class FundsScreen extends StatefulWidget {
  const FundsScreen({super.key});

  @override
  State<FundsScreen> createState() => _FundsScreenState();
}

class _FundsScreenState extends State<FundsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _activeType = 'All';

  static const List<Map<String, String>> _funds = [
    { 'asset': 'Afrinvest Halal Fund', 'provider': 'Afrinvest Asset Management Ltd', 'type': 'Balanced', 'launched': '2025', 'description': 'Asset-management arm of Afrinvest West Africa, overseen by an Advisory Committee of Experts (ACE). Investment Components: 70–100% in Sukuk, 30% Shariah-compliant equities.', 'trustee': '', 'custodian': '' },
    { 'asset': 'ARM Halal Balanced Fund', 'provider': 'ARM Investment Managers Ltd', 'type': 'Balanced', 'launched': '2004', 'description': 'One of the longest-running halal balanced funds in Nigeria. Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co).', 'trustee': 'Royal Exchange Plc', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'ARM Sharia Compliant Fixed Income Fund', 'provider': 'ARM Investment Managers Ltd', 'type': 'Fixed Income', 'launched': '2024', 'description': 'Invests in Sukuk, Mudarabah and Murabaha instruments with a minimum BBB rating.', 'trustee': 'FBNQuest Trustees', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'CapitalTrust Halal Fixed Income Fund', 'provider': 'CapitalTrust Investments & Asset Management Ltd', 'type': 'Fixed Income', 'launched': '2021', 'description': 'Standalone halal fixed-income fund managed by CapitalTrust Investments & Asset Management Ltd (founded 2006, Lagos).', 'trustee': '', 'custodian': '' },
    { 'asset': 'CFG Ethical Fund', 'provider': 'CFG Asset', 'type': 'Ethical', 'launched': '', 'description': 'Managed by CFG Asset (CFG Africa investment bank). Registrar: CardinalStone. Shariah adviser: One17 Capital.', 'trustee': 'AVA Trustees', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'Cordros Halal Fixed Income Fund', 'provider': 'Cordros Asset Management Ltd', 'type': 'Fixed Income', 'launched': '', 'description': 'Launched alongside a matching conventional Cordros Fixed Income Fund with strict ring-fencing to prevent co-mingling.', 'trustee': '', 'custodian': '' },
    { 'asset': "D'Namaz Halal Fixed Income Fund", 'provider': "D'Namaz Capital", 'type': 'Fixed Income', 'launched': '2025', 'description': "Benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY as a yardstick for whether returns are competitive with conventional savings.", 'trustee': '', 'custodian': '' },
    { 'asset': 'EDC Halal Fund', 'provider': 'EDC Fund Management', 'type': 'Balanced', 'launched': '2022', 'description': 'Asset-management subsidiary of Ecobank Nigeria. Positioned as a template for a multi-country Islamic fund beyond Nigeria.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Emerging Africa Halal Fund', 'provider': 'Emerging Africa Asset Management Ltd', 'type': 'Balanced', 'launched': '2024', 'description': 'Managed by EAAML, part of the Emerging Africa Group. A newer entrant in the growing Nigerian Islamic finance space.', 'trustee': '', 'custodian': '' },
    { 'asset': 'FSDH Halal Fund', 'provider': 'FSDH Asset Management Ltd', 'type': 'Balanced', 'launched': '2023', 'description': 'Established as part of FSDH\'s broader "Coral Funds" family. Managed by FSDH Asset Management Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal ETF', 'provider': 'Lotus Capital Ltd', 'type': 'ETF', 'launched': '2014', 'description': 'Tracks the NSE-Lotus Islamic Index. The only halal equity ETF listed on the NGX. Managed by Lotus Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal Fixed Income Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Fixed Income', 'launched': '', 'description': 'Invests in Sukuk plus Ijarah and Murabaha contracts. Managed by Lotus Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal Investment Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Equity', 'launched': '', 'description': 'SEC-registered Shariah-compliant equity fund — equity-based, not fixed-income. Managed by Lotus Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Waqf (Endowment) Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Endowment', 'launched': '', 'description': 'SEC-approved Waqf (endowment) fund — investment income perpetually funds charitable causes (education, healthcare, economic empowerment).', 'trustee': '', 'custodian': '' },
    { 'asset': 'Marble Halal Commodities Fund', 'provider': 'Marble Capital Ltd', 'type': 'Commodities', 'launched': '2021', 'description': 'SEC-approved Shariah-compliant commodities fund, investing in securitized commodities (agriculture, precious metals) — distinct from typical Sukuk/equity funds.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Marble Halal Fixed Income Fund', 'provider': 'Marble Capital Ltd', 'type': 'Fixed Income', 'launched': '2023', 'description': 'Invests in low-risk Sukuk plus Ijarah and Murabaha contracts. Managed by Marble Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Norrenberger Islamic Fund', 'provider': 'Norrenberger Asset Management Ltd', 'type': 'Fixed Income', 'launched': '2021', 'description': 'Shari\'ah compliant fixed-income fund. Managed by Norrenberger Asset Management Ltd.', 'trustee': 'UTL Trust Management Services', 'custodian': '' },
    { 'asset': 'One17 Halal Fund', 'provider': 'One17 Capital Ltd', 'type': 'Balanced', 'launched': '', 'description': 'Managed by One17 Capital Ltd — a SEC-licensed ethical/Shariah advisory and fund manager that also serves as Shariah adviser for other funds.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Stanbic IBTC Ethical Fund (Imaan Fund)', 'provider': 'Stanbic IBTC Asset Management', 'type': 'Equity', 'launched': '', 'description': 'Shari\'ah-compliant equity product: min. 70% Shariah-compliant equities, up to 30% Sukuk/Shariah money-market instruments.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Stanbic IBTC Shariah Fixed Income Fund', 'provider': 'Stanbic IBTC Asset Management', 'type': 'Fixed Income', 'launched': '2019', 'description': 'Invests in Sukuk (minimum 70%). Managed by Stanbic IBTC Asset Management.', 'trustee': '', 'custodian': '' },
  ];

  static const Map<String, Color> _typeColors = {
    'Fixed Income': Color(0xFF3B82F6),
    'Balanced':     Color(0xFF10B981),
    'Equity':       Color(0xFF8B5CF6),
    'ETF':          Color(0xFFF59E0B),
    'Endowment':    Color(0xFFEC4899),
    'Commodities':  Color(0xFFF97316),
    'Ethical':      Color(0xFF0EA5E9),
  };

  static const List<Color> _avatarColors = [
    Color(0xFF3B82F6), Color(0xFFEF4444), Color(0xFF10B981), Color(0xFFF59E0B),
    Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF0EA5E9), Color(0xFFF97316),
  ];

  Color _getAvatarColor(String str) {
    int hash = 0;
    for (int i = 0; i < str.length; i++) hash = str.codeUnitAt(i) + ((hash << 5) - hash);
    return _avatarColors[hash.abs() % _avatarColors.length];
  }

  List<String> get _allTypes => ['All', ..._typeColors.keys.toList()];

  @override
  Widget build(BuildContext context) {
    final filtered = _funds.where((fund) {
      final q = _searchQuery.toLowerCase();
      final matchSearch = q.isEmpty || fund['asset']!.toLowerCase().contains(q) || fund['provider']!.toLowerCase().contains(q) || fund['description']!.toLowerCase().contains(q);
      final matchType = _activeType == 'All' || fund['type'] == _activeType;
      return matchSearch && matchType;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Container(
            decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(14)),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              style: TextStyle(color: context.textDark, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search funds, providers, or details...',
                hintStyle: TextStyle(color: context.textMuted, fontSize: 14),
                prefixIcon: Icon(Icons.search, color: context.textMuted, size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ),

        // Filter pills
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _allTypes.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final type = _allTypes[i];
              final isActive = _activeType == type;
              final color = _typeColors[type] ?? context.textDark;
              return GestureDetector(
                onTap: () => setState(() => _activeType = type),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: isActive ? color.withValues(alpha: 0.12) : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive ? color : context.divider,
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    type,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: isActive ? color : context.textMuted,
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 12),

        // Results
        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text('No funds found', style: TextStyle(color: context.textMuted, fontSize: 15)))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _FundCard(fund: filtered[i], accentColor: _getAvatarColor(filtered[i]['provider']!)),
                  ),
                ),
        ),
      ],
    );
  }
}

class _FundCard extends StatefulWidget {
  final Map<String, String> fund;
  final Color accentColor;
  const _FundCard({required this.fund, required this.accentColor});

  @override
  State<_FundCard> createState() => _FundCardState();
}

class _FundCardState extends State<_FundCard> {
  bool _expanded = false;

  static const Map<String, Color> _typeColors = {
    'Fixed Income': Color(0xFF3B82F6),
    'Balanced':     Color(0xFF10B981),
    'Equity':       Color(0xFF8B5CF6),
    'ETF':          Color(0xFFF59E0B),
    'Endowment':    Color(0xFFEC4899),
    'Commodities':  Color(0xFFF97316),
    'Ethical':      Color(0xFF0EA5E9),
  };

  @override
  Widget build(BuildContext context) {
    final fund = widget.fund;
    final accent = widget.accentColor;
    final typeColor = _typeColors[fund['type']] ?? accent;
    final hasMeta = (fund['trustee']?.isNotEmpty ?? false) || (fund['custodian']?.isNotEmpty ?? false);

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
          // Top accent bar
          Container(height: 4, color: accent),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Row: Avatar + Title + Badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: accent.withValues(alpha: 0.3)),
                      ),
                      alignment: Alignment.center,
                      child: Text(fund['provider']![0], style: TextStyle(color: accent, fontWeight: FontWeight.w900, fontSize: 18)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(fund['asset']!, style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 14.5, height: 1.3)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              // Type badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: typeColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(fund['type']!, style: TextStyle(color: typeColor, fontWeight: FontWeight.w800, fontSize: 10)),
                              ),
                              if (fund['launched']?.isNotEmpty ?? false) ...[
                                const SizedBox(width: 8),
                                Icon(Icons.calendar_today, size: 11, color: context.textMuted),
                                const SizedBox(width: 3),
                                Text('Est. ${fund['launched']}', style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Provider line
                Row(
                  children: [
                    Icon(Icons.business, size: 13, color: accent),
                    const SizedBox(width: 5),
                    Expanded(child: Text(fund['provider']!, style: TextStyle(color: accent, fontWeight: FontWeight.w700, fontSize: 12))),
                  ],
                ),

                const SizedBox(height: 10),

                // Description
                AnimatedCrossFade(
                  firstChild: Text(fund['description']!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5, fontWeight: FontWeight.w500)),
                  secondChild: Text(fund['description']!, style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5, fontWeight: FontWeight.w500)),
                  crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),

                // Expand button
                if (fund['description']!.length > 100 || hasMeta) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => setState(() => _expanded = !_expanded),
                    child: Row(
                      children: [
                        Text(_expanded ? 'Show less' : 'Show more', style: TextStyle(color: accent, fontWeight: FontWeight.w700, fontSize: 12)),
                        const SizedBox(width: 2),
                        Icon(_expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 16, color: accent),
                      ],
                    ),
                  ),
                ],

                // Trustee / Custodian — expanded
                if (_expanded && hasMeta) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (fund['trustee']?.isNotEmpty ?? false)
                        _MetaChip(label: 'Trustee', value: fund['trustee']!, icon: Icons.shield_outlined),
                      if (fund['custodian']?.isNotEmpty ?? false)
                        _MetaChip(label: 'Custodian', value: fund['custodian']!, icon: Icons.account_balance_outlined),
                    ],
                  ),
                ],
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
  const _MetaChip({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: context.textMuted),
          const SizedBox(width: 5),
          Text('$label: ', style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
          Text(value, style: TextStyle(color: context.textDark, fontSize: 11, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
