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

  final List<Map<String, String>> _funds = const [
    { 
      'asset': 'Afrinvest Halal Fund', 
      'provider': 'Afrinvest Asset Management Ltd',
      'description': 'Managed by Afrinvest Asset Management Ltd, the asset-management arm of Afrinvest West Africa and overseen by an Advisory Committee of Experts (ACE). Launched July 2025. Investment Components: 70–100% in Sukuk, 30% Shariah-compliant equities.'
    },
    { 
      'asset': 'ARM Halal Balanced Fund', 
      'provider': 'ARM Investment Managers Ltd',
      'description': 'Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co). Launched July 2004. Trustee: Royal Exchange Plc. Custodian: Rand Merchant Bank.'
    },
    { 
      'asset': 'ARM Sharia Compliant Fixed Income Fund', 
      'provider': 'ARM Investment Managers Ltd',
      'description': 'Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co). Launched July 2024. Trustee: FBNQuest Trustees. Custodian: Rand Merchant Bank. Investment Components: Sukuk, Mudarabah and Murabaha with a minimum BBB rating.'
    },
    { 
      'asset': 'CapitalTrust Halal Fixed Income Fund', 
      'provider': 'CapitalTrust Investments & Asset Management Ltd',
      'description': 'Managed by CapitalTrust Investments & Asset Management Ltd (founded 2006, Lagos). Standalone halal fixed-income funds (2021).'
    },
    { 
      'asset': 'CFG Ethical Fund', 
      'provider': 'CFG Asset',
      'description': 'Managed by CFG Asset (CFG Africa investment bank). Trustee: AVA Trustees. Custodian: Rand Merchant Bank. Registrar: CardinalStone. Shariah adviser:One17 Capital.'
    },
    { 
      'asset': 'Cordros Halal Fixed Income Fund', 
      'provider': 'Cordros Asset Management Ltd',
      'description': 'Managed by Cordros Asset Management Ltd (part of Cordros Capital) but launched alongside a matching conventional Cordros Fixed Income Fund preventing co-mingling.'
    },
    { 
      'asset': 'D\'Namaz Halal Fixed Income Fund', 
      'provider': 'D\'Namaz Capital',
      'description': 'Managed by D\'Namaz Capital. Launched May 2025. Components benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY.'
    },
    { 
      'asset': 'EDC Halal Fund', 
      'provider': 'EDC Fund Management',
      'description': 'Managed by EDC Fund Management, the asset-management subsidiary of Ecobank Nigeria/Ecobank Capital Group. Launched August 2022 and positioned as a template for a multi-country Islamic fund, not just a domestic product.'
    },
    { 
      'asset': 'Emerging Africa Halal Fund', 
      'provider': 'Emerging Africa Asset Management Ltd',
      'description': 'Managed by Emerging Africa Asset Management Ltd (EAAML) and part of the Emerging Africa Group. Launched July 2024.'
    },
    { 
      'asset': 'FSDH Halal Fund', 
      'provider': 'FSDH Asset Management Ltd',
      'description': 'Managed by FSDH Asset Management Ltd (FSDH Group). Established October 2023 as part of FSDH\'s broader "Coral Funds" family.'
    },
    { 
      'asset': 'Lotus Halal ETF', 
      'provider': 'Lotus Capital Ltd',
      'description': 'Managed by Lotus Capital Ltd. Launched 2014 and tracks the NSE-Lotus Islamic Index. The only halal equity ETF on the NGX.'
    },
    { 
      'asset': 'Lotus Halal Fixed Income Fund', 
      'provider': 'Lotus Capital Ltd',
      'description': 'Managed by Lotus Capital. Invests in Sukuk plus Ijarah and Murabaha contracts.'
    },
    { 
      'asset': 'Lotus Halal Investment Fund', 
      'provider': 'Lotus Capital Ltd',
      'description': 'Managed by Lotus Capital. SEC-registered Shariah-compliant equity fund, equity-based (not fixed-income).'
    },
    { 
      'asset': 'Lotus Waqf (Endowment) Fund', 
      'provider': 'Lotus Capital Ltd',
      'description': 'Managed by Lotus Capital. SEC-approved endowment (Waqf) fund — structured so investment income perpetually funds charitable causes.'
    },
    { 
      'asset': 'Marble Halal Commodities Fund', 
      'provider': 'Marble Capital Ltd',
      'description': 'Managed by Marble Capital Ltd. Launched 2021 as a SEC-approved Shariah-compliant commodities fund, investing in securitized commodities rather than the Sukuk/equity mix.'
    },
    { 
      'asset': 'Marble Halal Fixed Income Fund', 
      'provider': 'Marble Capital Ltd',
      'description': 'Managed by Marble Capital. Launched 2023. Invests in low risk Sukuk plus Ijarah and Murabaha contracts.'
    },
    { 
      'asset': 'Norrenberger Islamic Fund', 
      'provider': 'Norrenberger Asset Management Ltd',
      'description': 'Managed by Norrenberger Asset Management Ltd. Launched 2021 as a shari\'ah compliant fixed-income fund. Trustee: UTL Trust Management Services.'
    },
    { 
      'asset': 'One17 Halal Fund', 
      'provider': 'One17 Capital Ltd',
      'description': 'Managed by One17 Capital Ltd. SEC-licensed ethical/Shariah advisory and fund manager.'
    },
    { 
      'asset': 'Stanbic IBTC Ethical Fund (Imaan Fund)', 
      'provider': 'Stanbic IBTC Asset Management',
      'description': 'Managed by Stanbic IBTC Asset Management investing in shari\'ah-compliant equity product (min. 70% Shariah-compliant equities, up to 30% Sukuk).'
    },
    { 
      'asset': 'Stanbic IBTC Shariah Fixed Income Fund', 
      'provider': 'Stanbic IBTC Asset Management',
      'description': 'Managed by Stanbic IBTC Asset Management. Launched August 2019 and invests in Sukuk (minimum 70%).'
    },
  ];

  Color _getAvatarColor(String str) {
    const colors = [
      Color(0xFF3B82F6), // blue
      Color(0xFFEF4444), // red
      Color(0xFF10B981), // green
      Color(0xFFF59E0B), // yellow
      Color(0xFF8B5CF6), // purple
      Color(0xFFEC4899), // pink
      Color(0xFF0EA5E9), // sky
      Color(0xFFF97316), // orange
    ];
    int hash = 0;
    for (int i = 0; i < str.length; i++) {
      hash = str.codeUnitAt(i) + ((hash << 5) - hash);
    }
    return colors[hash.abs() % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final filteredFunds = _funds.where((fund) {
      final assetMatch = fund['asset']!.toLowerCase().contains(_searchQuery.toLowerCase());
      final providerMatch = fund['provider']!.toLowerCase().contains(_searchQuery.toLowerCase());
      final descMatch = fund['description']!.toLowerCase().contains(_searchQuery.toLowerCase());
      return assetMatch || providerMatch || descMatch;
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Container(
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(16),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              style: TextStyle(color: context.textDark, fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Search funds, providers, or details...',
                hintStyle: TextStyle(color: context.textMuted, fontSize: 15),
                prefixIcon: Icon(Icons.search, color: context.textMuted, size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ),
        Expanded(
          child: filteredFunds.isEmpty
              ? Center(
                  child: Text(
                    'No funds found',
                    style: TextStyle(color: context.textMuted, fontSize: 16),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.only(top: 8, bottom: 100),
                  itemCount: filteredFunds.length,
                  separatorBuilder: (context, index) => Divider(color: context.divider, height: 1, indent: 76),
                  itemBuilder: (context, index) {
                    final fund = filteredFunds[index];
                    final color = _getAvatarColor(fund['provider']!);
                    
                    return InkWell(
                      onTap: () {},
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              margin: const EdgeInsets.only(top: 2),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                fund['provider']![0],
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    fund['asset']!,
                                    style: TextStyle(
                                      color: context.textDark,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    fund['provider']!,
                                    style: TextStyle(
                                      color: context.primary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Icon(Icons.info_outline, size: 14, color: context.textMuted),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          fund['description']!,
                                          style: TextStyle(
                                            color: context.textMuted,
                                            fontWeight: FontWeight.w500,
                                            fontSize: 13,
                                            height: 1.4,
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
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
