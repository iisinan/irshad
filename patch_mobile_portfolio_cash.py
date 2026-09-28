import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD = """                  ],
                ),
                const SizedBox(height: 20),
                Divider(height: 1, thickness: 0.5, color: context.divider),"""

NEW = """                  ],
                ),
                if ((provider.summary['cash_balance'] as num? ?? 0) > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 12.0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: context.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Stocks: \u20A6${(((provider.summary['total_balance'] as num).toDouble()) - ((provider.summary['cash_balance'] as num).toDouble())).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\\d{1,3})(?=(\\d{3})+(?!\\d))'), (Match m) => '${m[1]},')}',
                            style: TextStyle(color: context.primary, fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Cash: \u20A6${((provider.summary['cash_balance'] as num).toDouble()).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\\d{1,3})(?=(\\d{3})+(?!\\d))'), (Match m) => '${m[1]},')}',
                            style: TextStyle(color: Colors.green[700], fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 20),
                Divider(height: 1, thickness: 0.5, color: context.divider),"""

content = content.replace(OLD, NEW)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched PortfolioOverviewTab for Cash Balance")
