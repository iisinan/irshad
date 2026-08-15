import 'package:flutter/material.dart';
import 'charities_bottom_sheet.dart';
import '../../../../core/widgets/company_avatar.dart';
import '../../../../core/theme/app_theme.dart';

class CalcDetailsBottomSheet extends StatelessWidget {
  final Map<String, dynamic> holding;

  const CalcDetailsBottomSheet({super.key, required this.holding});

  @override
  Widget build(BuildContext context) {
    final symbol = holding['symbol'] ?? '';
    final logoUrl = holding['logo_url'];
    final shares = num.tryParse(holding['shares']?.toString() ?? '0')?.toInt() ?? 0;
    final avgPrice = num.tryParse(holding['average_buy_price']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final dividends = num.tryParse(holding['total_dividends']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final ratio = num.tryParse(holding['non_compliant_ratio']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final due = num.tryParse(holding['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;

    final duePct = dividends > 0 ? (due / dividends).clamp(0.0, 1.0) : 0.0;

    Widget buildRow(String label, String value, {bool highlight = false}) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: highlight ? context.primary.withOpacity(0.1) : Colors.transparent,
          border: Border(bottom: BorderSide(color: context.divider)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(fontSize: 13, fontWeight: highlight ? FontWeight.w700 : FontWeight.w600, color: highlight ? context.textDark : context.textMuted)),
            Text(value, style: TextStyle(fontSize: highlight ? 15 : 13, fontWeight: highlight ? FontWeight.w900 : FontWeight.w700, color: highlight ? context.primary : context.textDark)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: context.scaffoldBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.primary, const Color(0xFF4C1D95)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.15)),
                      ),
                      child: CompanyAvatar(logoUrl: logoUrl, symbol: symbol, size: 48, borderRadius: 12),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PURIFICATION CALCULATION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white.withOpacity(0.6), letterSpacing: 0.5)),
                          Text(symbol, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2)),
                          Text('${shares.toString().replaceAllMapped(RegExp(r'\\B(?=(\\d{3})+(?!\\d))'), (m) => ',')} shares · ₦${avgPrice.toStringAsFixed(2)} avg cost', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7))),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('AMOUNT DUE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white.withOpacity(0.6), letterSpacing: 0.5)),
                        Text('₦${due.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFFFCD34D), height: 1.1)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Impure portion of dividends', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.7))),
                    Text('${(duePct * 100).toStringAsFixed(2)}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFFCD34D))),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  height: 6,
                  width: double.infinity,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(100)),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: duePct,
                    child: Container(
                      decoration: BoxDecoration(color: const Color(0xFFFCD34D), borderRadius: BorderRadius.circular(100), boxShadow: [BoxShadow(color: const Color(0xFFFCD34D).withOpacity(0.5), blurRadius: 6)]),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Body
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.divider),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: context.primary.withOpacity(0.08),
                          border: Border(bottom: BorderSide(color: context.divider)),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                        ),
                        child: Text('PURIFICATION CALCULATION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.primary)),
                      ),
                      buildRow('Total dividends received (12M)', '₦${dividends.toStringAsFixed(2)}'),
                      buildRow('Impure revenue ratio', '${ratio.toStringAsFixed(4)}%'),
                      buildRow('Amount to purify (donate)', '₦${due.toStringAsFixed(2)}', highlight: true),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => Padding(
                        padding: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
                        child: CharitiesBottomSheet(amountDue: due, symbol: symbol),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.favorite, size: 20, color: Colors.white.withOpacity(0.8)),
                      const SizedBox(width: 8),
                      Text('Donate ₦${due.toStringAsFixed(2)} Securely', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  style: TextButton.styleFrom(
                    foregroundColor: context.textMuted,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: context.divider)),
                  ),
                  child: const Text('Close', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
