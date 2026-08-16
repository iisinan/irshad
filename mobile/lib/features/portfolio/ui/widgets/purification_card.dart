import 'package:flutter/material.dart';
import '../../../../core/widgets/company_avatar.dart';
import '../../../../core/theme/app_theme.dart';
import 'calc_details_bottom_sheet.dart';
import 'charities_bottom_sheet.dart';

class PurificationCard extends StatelessWidget {
  final Map<String, dynamic> holding;

  const PurificationCard({
    super.key,
    required this.holding,
  });

  @override
  Widget build(BuildContext context) {
    final symbol = holding['symbol'] ?? '';
    final logoUrl = holding['logo_url'];
    final shares = num.tryParse(holding['shares']?.toString() ?? '0')?.toInt() ?? 0;
    final avgPrice = num.tryParse(holding['average_buy_price']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final dividends = num.tryParse(holding['total_dividends']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final due = num.tryParse(holding['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final totalValue = num.tryParse(holding['total_value']?.toString() ?? '0')?.toDouble() ?? 0.0;

    final latestDiv = holding['latest_dividend'];
    String? dividendLabel;
    String? dividendVal;
    String? dividendDate;

    if (latestDiv != null) {
      final isUpcoming = latestDiv['status'] != 'paid' && DateTime.tryParse(latestDiv['pay_date'] ?? '')?.isAfter(DateTime.now()) == true;
      dividendLabel = isUpcoming ? 'Upcoming' : 'Last Dividend';
      final amt = num.tryParse(latestDiv['amount']?.toString() ?? '0')?.toDouble() ?? 0.0;
      dividendVal = '₦${amt.toStringAsFixed(2)} /sh';
      if (latestDiv['pay_date'] != null) {
        final d = DateTime.tryParse(latestDiv['pay_date']);
        if (d != null) {
          final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          dividendDate = '${months[d.month - 1]} ${d.year.toString().substring(2)}';
        }
      }
    }

    final statItems = [
      {'label': 'Portfolio Value', 'value': '₦${totalValue.toStringAsFixed(2)}', 'sub': 'Current'},
      {'label': 'Dividends', 'value': '₦${dividends.toStringAsFixed(2)}', 'sub': 'Total received'},
      if (latestDiv != null) {'label': dividendLabel, 'value': dividendVal, 'sub': dividendDate},
    ];

    return GestureDetector(
      onTap: () {
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
      child: Container(
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          children: [
            Container(
              height: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [context.primary, context.primary.withValues(alpha: 0.8), context.primary.withValues(alpha: 0.5)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      CompanyAvatar(logoUrl: logoUrl, symbol: symbol, size: 42, borderRadius: 12),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              symbol, 
                              style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 17, letterSpacing: -0.2),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${shares.toString().replaceAllMapped(RegExp(r'\\B(?=(\\d{3})+(?!\\d))'), (m) => ',')} shs · ₦${avgPrice.toStringAsFixed(2)} avg', 
                              style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w500),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Dedicated Purification Action Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: context.primary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.primary.withOpacity(0.1)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('AMOUNT TO PURIFY', style: TextStyle(fontWeight: FontWeight.w800, color: context.primary.withOpacity(0.8), fontSize: 10, letterSpacing: 0.5)),
                            const SizedBox(height: 2),
                            Text('₦${due.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, color: context.primary, fontSize: 20)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: context.primary,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [BoxShadow(color: context.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Purify', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
                              SizedBox(width: 4),
                              Icon(Icons.chevron_right, color: Colors.white, size: 16),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...statItems.map((s) => Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: context.bgAlt,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: context.divider),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(s['label']!.toString().toUpperCase(), style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
                                  const SizedBox(width: 4),
                                  Icon(Icons.arrow_outward, size: 10, color: context.primary.withValues(alpha: 0.5)),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(s['value']!.toString(), style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w800)),
                              if (s['sub'] != null) ...[
                                const SizedBox(height: 2),
                                Text(s['sub']!.toString(), style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w500)),
                              ]
                            ],
                          ),
                        )),
                        GestureDetector(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => Padding(
                                padding: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
                                child: CalcDetailsBottomSheet(holding: holding),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: context.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: context.primary.withValues(alpha: 0.3), style: BorderStyle.solid),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.calculate, size: 16, color: context.primary),
                                const SizedBox(height: 2),
                                Text('VIEW CALC', style: TextStyle(color: context.primary, fontSize: 9, fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
