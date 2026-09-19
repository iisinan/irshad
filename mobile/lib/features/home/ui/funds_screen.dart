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
    { 'asset': 'Afrinvest Halal Fund', 'provider': 'Afrinvest Asset Management Ltd', 'type': 'Balanced', 'launched': '2025', 'description': 'Managed by Afrinvest Asset Management Ltd, the asset-management arm of Afrinvest West Africa, overseen by an Advisory Committee of Experts (ACE). Components: 70–100% Sukuk, 30% Shariah-compliant equities.', 'trustee': '', 'custodian': '' },
    { 'asset': 'ARM Halal Balanced Fund', 'provider': 'ARM Investment Managers Ltd', 'type': 'Balanced', 'launched': '2004', 'description': 'One of the longest-running halal balanced funds in Nigeria. Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co).', 'trustee': 'Royal Exchange Plc', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'ARM Sharia Compliant Fixed Income Fund', 'provider': 'ARM Investment Managers Ltd', 'type': 'Fixed Income', 'launched': '2024', 'description': 'Invests in Sukuk, Mudarabah and Murabaha instruments with a minimum BBB rating. Managed by ARM Investment Managers Ltd.', 'trustee': 'FBNQuest Trustees', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'CapitalTrust Halal Fixed Income Fund', 'provider': 'CapitalTrust Investments & Asset Management Ltd', 'type': 'Fixed Income', 'launched': '2021', 'description': 'Standalone halal fixed-income fund managed by CapitalTrust Investments & Asset Management Ltd (founded 2006, Lagos).', 'trustee': '', 'custodian': '' },
    { 'asset': 'CFG Ethical Fund', 'provider': 'CFG Asset', 'type': 'Ethical', 'launched': '', 'description': 'Managed by CFG Asset (CFG Africa investment bank). Registrar: CardinalStone. Shariah adviser: One17 Capital.', 'trustee': 'AVA Trustees', 'custodian': 'Rand Merchant Bank' },
    { 'asset': 'Cordros Halal Fixed Income Fund', 'provider': 'Cordros Asset Management Ltd', 'type': 'Fixed Income', 'launched': '', 'description': 'Launched alongside a matching conventional Cordros Fixed Income Fund with strict ring-fencing to prevent co-mingling.', 'trustee': '', 'custodian': '' },
    { 'asset': "D'Namaz Halal Fixed Income Fund", 'provider': "D'Namaz Capital", 'type': 'Fixed Income', 'launched': '2025', 'description': "Benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY as a yardstick for whether returns are competitive with conventional savings.", 'trustee': '', 'custodian': '' },
    { 'asset': 'EDC Halal Fund', 'provider': 'EDC Fund Management', 'type': 'Balanced', 'launched': '2022', 'description': 'Asset-management subsidiary of Ecobank Nigeria. Positioned as a template for a multi-country Islamic fund beyond Nigeria.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Emerging Africa Halal Fund', 'provider': 'Emerging Africa Asset Management Ltd', 'type': 'Balanced', 'launched': '2024', 'description': 'Managed by EAAML, part of the Emerging Africa Group. A newer entrant in the growing Nigerian Islamic finance landscape.', 'trustee': '', 'custodian': '' },
    { 'asset': 'FSDH Halal Fund', 'provider': 'FSDH Asset Management Ltd', 'type': 'Balanced', 'launched': '2023', 'description': 'Established as part of FSDH\'s broader "Coral Funds" family. Managed by FSDH Asset Management Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal ETF', 'provider': 'Lotus Capital Ltd', 'type': 'ETF', 'launched': '2014', 'description': 'Tracks the NSE-Lotus Islamic Index. The only halal equity ETF listed on the NGX.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal Fixed Income Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Fixed Income', 'launched': '', 'description': 'Invests in Sukuk plus Ijarah and Murabaha contracts. Managed by Lotus Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Halal Investment Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Equity', 'launched': '', 'description': 'SEC-registered Shariah-compliant equity fund — equity-based, not fixed-income. Managed by Lotus Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Lotus Waqf (Endowment) Fund', 'provider': 'Lotus Capital Ltd', 'type': 'Endowment', 'launched': '', 'description': 'SEC-approved Waqf (endowment) fund — investment income perpetually funds charitable causes (education, healthcare, economic empowerment).', 'trustee': '', 'custodian': '' },
    { 'asset': 'Marble Halal Commodities Fund', 'provider': 'Marble Capital Ltd', 'type': 'Commodities', 'launched': '2021', 'description': 'SEC-approved Shariah-compliant commodities fund, investing in securitized commodities (agriculture, precious metals).', 'trustee': '', 'custodian': '' },
    { 'asset': 'Marble Halal Fixed Income Fund', 'provider': 'Marble Capital Ltd', 'type': 'Fixed Income', 'launched': '2023', 'description': 'Invests in low-risk Sukuk plus Ijarah and Murabaha contracts. Managed by Marble Capital Ltd.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Norrenberger Islamic Fund', 'provider': 'Norrenberger Asset Management Ltd', 'type': 'Fixed Income', 'launched': '2021', 'description': 'Shari\'ah compliant fixed-income fund. Managed by Norrenberger Asset Management Ltd.', 'trustee': 'UTL Trust Management Services', 'custodian': '' },
    { 'asset': 'One17 Halal Fund', 'provider': 'One17 Capital Ltd', 'type': 'Balanced', 'launched': '', 'description': 'Managed by One17 Capital Ltd — a SEC-licensed ethical/Shariah advisory and fund manager that also serves as Shariah adviser for other funds.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Stanbic IBTC Ethical Fund (Imaan Fund)', 'provider': 'Stanbic IBTC Asset Management', 'type': 'Equity', 'launched': '', 'description': 'Shari\'ah-compliant equity product: min. 70% Shariah-compliant equities, up to 30% Sukuk/Shariah money-market instruments.', 'trustee': '', 'custodian': '' },
    { 'asset': 'Stanbic IBTC Shariah Fixed Income Fund', 'provider': 'Stanbic IBTC Asset Management', 'type': 'Fixed Income', 'launched': '2019', 'description': 'Invests in Sukuk (minimum 70%). Managed by Stanbic IBTC Asset Management.', 'trustee': '', 'custodian': '' },
  ];

  static const List<String> _allTypes = ['All', 'Fixed Income', 'Balanced', 'Equity', 'ETF', 'Endowment', 'Commodities', 'Ethical'];

  // Map fund types to app theme semantic colors
  Color _typeColor(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income': return context.primary;
      case 'Balanced':     return context.halal;
      case 'Equity':       return context.primary;
      case 'ETF':          return context.questionable;
      case 'Endowment':    return context.questionable;
      case 'Commodities':  return context.questionable;
      case 'Ethical':      return context.halal;
      default:             return context.primary;
    }
  }

  Color _typeBg(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income': return context.primary.withValues(alpha: 0.1);
      case 'Balanced':     return context.halalBg;
      case 'Equity':       return context.primary.withValues(alpha: 0.14);
      case 'ETF':          return context.questionableBg;
      case 'Endowment':    return context.questionableBg;
      case 'Commodities':  return context.questionableBg;
      case 'Ethical':      return context.halalBg;
      default:             return context.primary.withValues(alpha: 0.1);
    }
  }

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
        // Search
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Container(
            decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(14), border: Border.all(color: context.divider)),
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
              final color = type == 'All' ? context.primary : _typeColor(context, type);
              final bg = type == 'All' ? context.primary.withValues(alpha: 0.1) : _typeBg(context, type);
              return GestureDetector(
                onTap: () => setState(() => _activeType = type),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: isActive ? bg : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isActive ? color : context.divider, width: 1.5),
                  ),
                  child: Text(type, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: isActive ? color : context.textMuted)),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 12),

        // List
        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text('No funds found', style: TextStyle(color: context.textMuted, fontSize: 15)))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _FundCard(
                      fund: filtered[i],
                      typeColor: _typeColor(context, filtered[i]['type']!),
                      typeBg: _typeBg(context, filtered[i]['type']!),
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}

class _FundCard extends StatefulWidget {
  final Map<String, String> fund;
  final Color typeColor;
  final Color typeBg;
  const _FundCard({required this.fund, required this.typeColor, required this.typeBg});

  @override
  State<_FundCard> createState() => _FundCardState();
}

class _FundCardState extends State<_FundCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final fund = widget.fund;
    final hasMeta = (fund['trustee']?.isNotEmpty ?? false) || (fund['custodian']?.isNotEmpty ?? false);
    final isLong = (fund['description']?.length ?? 0) > 100;

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
          // Gradient accent bar — uses primary → accent (gold)
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [context.primary, context.questionable]),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: context.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        fund['provider']![0],
                        style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 18),
                      ),
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
                                  color: widget.typeBg,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: widget.typeColor.withValues(alpha: 0.25)),
                                ),
                                child: Text(fund['type']!, style: TextStyle(color: widget.typeColor, fontWeight: FontWeight.w800, fontSize: 10)),
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

                // Provider
                Row(
                  children: [
                    Icon(Icons.business, size: 13, color: context.textMuted),
                    const SizedBox(width: 5),
                    Expanded(child: Text(fund['provider']!, style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600, fontSize: 12))),
                  ],
                ),

                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: context.divider, height: 1),
                ),

                // Description
                AnimatedCrossFade(
                  firstChild: Text(fund['description']!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: context.textBody, fontSize: 13, height: 1.55, fontWeight: FontWeight.w500)),
                  secondChild: Text(fund['description']!, style: TextStyle(color: context.textBody, fontSize: 13, height: 1.55, fontWeight: FontWeight.w500)),
                  crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),

                // Expand
                if (isLong || hasMeta) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => setState(() => _expanded = !_expanded),
                    child: Row(
                      children: [
                        Text(_expanded ? 'Show less' : 'Show more', style: TextStyle(color: context.primary, fontWeight: FontWeight.w700, fontSize: 12)),
                        const SizedBox(width: 2),
                        Icon(_expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 16, color: context.primary),
                      ],
                    ),
                  ),
                ],

                // Trustee / Custodian chips
                if (_expanded && hasMeta) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8, runSpacing: 8,
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
        color: context.bgSection,
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
