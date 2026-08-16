import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/portfolio_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../widgets/purification_card.dart';
import '../widgets/charities_bottom_sheet.dart';

class PurificationTab extends StatelessWidget {
  const PurificationTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PortfolioProvider>(
      builder: (context, provider, child) {
        final isLoading = provider.isLoading;
        
        // We only want to show holdings that have a purification due > 0
        final holdingsRequiringPurification = provider.holdings.where((h) {
          final due = num.tryParse(h['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;
          return due > 0;
        }).toList();

        final totalPurificationDue = holdingsRequiringPurification.fold<double>(0.0, (sum, h) {
          return sum + (num.tryParse(h['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0);
        });

        final totalDividends = holdingsRequiringPurification.fold<double>(0.0, (sum, h) {
          return sum + (num.tryParse(h['total_dividends']?.toString() ?? '0')?.toDouble() ?? 0.0);
        });

        return SingleChildScrollView(
          padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 24.0, bottom: 100.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Banner
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [context.bg, context.primary.withOpacity(0.08)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: context.divider),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 4)),
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: context.divider),
                            boxShadow: [BoxShadow(color: context.primary.withOpacity(0.12), blurRadius: 24, offset: const Offset(0, 8))],
                          ),
                          child: Center(
                            child: Icon(
                              totalPurificationDue > 0 ? Icons.shield_outlined : Icons.check_circle_outline,
                              size: 26,
                              color: totalPurificationDue > 0 ? context.primary : const Color(0xFF34D399),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Dividend Purification', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                              const SizedBox(height: 2),
                              Text('Cleanse your portfolio of non-compliant income', style: TextStyle(fontSize: 13, color: context.textMuted, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (totalPurificationDue > 0) ...[
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(color: context.divider),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('TOTAL DUE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.5)),
                                  const SizedBox(height: 4),
                                  Text('₦${totalPurificationDue.toStringAsFixed(2)}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(color: context.divider),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('DIVIDENDS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.5)),
                                  const SizedBox(height: 4),
                                  Text('₦${totalDividends.toStringAsFixed(2)}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: isLoading ? null : () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => Padding(
                              padding: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
                              child: CharitiesBottomSheet(amountDue: totalPurificationDue), // No symbol = Donate All
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.primary,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: isLoading 
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.favorite, size: 16),
                                SizedBox(width: 8),
                                Text('Donate All', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                              ],
                            ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Main Content Area
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: context.bg,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: context.divider),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 10)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Pending Purifications', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark)),
                        if (holdingsRequiringPurification.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD97706).withOpacity(0.1),
                              border: Border.all(color: const Color(0xFFD97706).withOpacity(0.2)),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '${holdingsRequiringPurification.length} stock${holdingsRequiringPurification.length > 1 ? 's' : ''}',
                              style: const TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w800),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    
                    if (holdingsRequiringPurification.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Colors.white, Color(0xFFF0FDF4)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFF86EFAC)),
                                boxShadow: [BoxShadow(color: const Color(0xFF22C55E).withOpacity(0.15), blurRadius: 24, offset: const Offset(0, 8))],
                              ),
                              child: const Center(
                                child: Icon(Icons.check_circle, size: 32, color: Color(0xFF16A34A)),
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text('Your Portfolio is Clean!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                            const SizedBox(height: 8),
                            Text(
                              'Alhamdulillah. All your dividend income is derived from Shariah-compliant sources. There are no pending purifications at this time.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: holdingsRequiringPurification.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          return PurificationCard(holding: holdingsRequiringPurification[index]);
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
