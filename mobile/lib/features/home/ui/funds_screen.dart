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
    { 'asset': 'Afrinvest Halal Fund', 'provider': 'Afrinvest Asset Mgt Ltd.' },
    { 'asset': 'ARM Halal Balanced Fund', 'provider': 'ARM Investment Management' },
    { 'asset': 'ARM Sharia Compliant Fixed Income Fund', 'provider': 'ARM Investment Management' },
    { 'asset': 'CapitalTrust Halal Fixed Income Fund', 'provider': 'CapitalTrust Investments' },
    { 'asset': 'CFG Ethical Fund', 'provider': 'CFG Asset Management' },
    { 'asset': 'Cordros Halal Fixed Income Fund', 'provider': 'Cordros Asset Management' },
    { 'asset': 'D\'Namaz Halal Fixed Income Fund', 'provider': 'D\'Namaz Capital Limited' },
    { 'asset': 'EDC Halal Fund', 'provider': 'EDC Fund Management' },
    { 'asset': 'Emerging Africa Halal Fund', 'provider': 'Emerging Africa Asset Management' },
    { 'asset': 'First Asset Halal Fund', 'provider': 'First Asset Management' },
    { 'asset': 'FSDH Halal Fund', 'provider': 'FSDH Asset Management' },
    { 'asset': 'Lotus Halal 15 ETF', 'provider': 'Lotus Capital Limited' },
    { 'asset': 'Lotus Halal ETF', 'provider': 'Lotus Capital Limited' },
    { 'asset': 'Lotus Halal Fixed Income Fund', 'provider': 'Lotus Capital Limited' },
    { 'asset': 'Lotus Halal Investment Fund', 'provider': 'Lotus Capital Limited' },
    { 'asset': 'Lotus Waqf (Endowment) Fund', 'provider': 'Lotus Capital Limited' },
    { 'asset': 'Marble Halal Commodities Fund', 'provider': 'Marble Capital Limited' },
    { 'asset': 'Marble Halal Fixed Income Fund', 'provider': 'Marble Capital Limited' },
    { 'asset': 'Norrenberger Islamic Fund', 'provider': 'Norrenberger Investments' },
    { 'asset': 'One17 Halal Fund', 'provider': 'One17 Capital Limited' },
    { 'asset': 'Stanbic IBTC Ethical Fund', 'provider': 'Stanbic IBTC Asset Mgt.' },
    { 'asset': 'Stanbic IBTC Shariah Fixed Income Fund', 'provider': 'Stanbic IBTC Asset Mgt.' },
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
      return assetMatch || providerMatch;
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
                hintText: 'Search funds or providers...',
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
                          children: [
                            Container(
                              width: 44,
                              height: 44,
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
                                      color: context.textMuted,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
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
