import sys

def main():
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
        content = f.read()
        
    # Replace tab titles
    content = content.replace("_buildTabItem(0, 'Summary')", "_buildTabItem(0, 'About')")
    content = content.replace("_buildTabItem(1, 'Shariah')", "_buildTabItem(1, 'Stage 1 Screening')")
    content = content.replace("_buildTabItem(2, 'Performance')", "_buildTabItem(2, 'Stage 2 Screening')")
    
    # We need to change the content rendered in build() for these tabs.
    # We will put the Justification block in Stage 1, and the Dashboard block in Stage 2.
    
    build_body = """                  if (_selectedTab == 1) ...[
                    const SizedBox(height: 24),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: statusColor.withOpacity(0.6), width: 1.5),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              statusLabel.contains('COMPLIANT') && !statusLabel.contains('NON') ? Icons.verified_rounded :
                              statusLabel.contains('NON-COMPLIANT') ? Icons.cancel_rounded : Icons.help_rounded,
                              color: statusColor,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              statusLabel,
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 0.3),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                      _buildSectionHeader('Shariah Compliance Dashboard'),
                      const SizedBox(height: 12),
                      _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                      const SizedBox(height: 32),
                    ],
                  ],
                  
                  if (_selectedTab == 2) ...[
                    const SizedBox(height: 32),
                    Center(
                      child: Text('Performance data & Historical metrics', style: TextStyle(color: context.textMuted)),
                    ),
                  ],"""
                  
    new_build_body = """                  if (_selectedTab == 1) ...[
                    const SizedBox(height: 24),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: statusColor.withOpacity(0.6), width: 1.5),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              statusLabel.contains('COMPLIANT') && !statusLabel.contains('NON') ? Icons.verified_rounded :
                              statusLabel.contains('NON-COMPLIANT') ? Icons.cancel_rounded : Icons.help_rounded,
                              color: statusColor,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              statusLabel,
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 0.3),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (reason != null && reason.toString().trim().isNotEmpty) ...[
                      _buildSectionHeader('Sector Screening (Stage 1)'),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: statusColor.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.feed_outlined, color: statusColor, size: 20),
                                const SizedBox(width: 8),
                                Text('Justification', style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w900)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              reason,
                              style: TextStyle(color: context.textDark.withOpacity(0.8), fontSize: 13, height: 1.6, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ],
                  
                  if (_selectedTab == 2) ...[
                    const SizedBox(height: 32),
                    if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                      _buildSectionHeader('Financial Screening (Stage 2)'),
                      const SizedBox(height: 12),
                      _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                      const SizedBox(height: 32),
                    ] else ...[
                      Center(
                        child: Text('Financial screening data not available', style: TextStyle(color: context.textMuted)),
                      ),
                    ],
                  ],"""

    content = content.replace(build_body, new_build_body)

    # Note: We need to remove the justification box from `_buildComplianceDashboard` because we moved it to Stage 1 Tab!
    
    old_dashboard = """        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: statusColor.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.feed_outlined, color: statusColor, size: 20),
                  const SizedBox(width: 8),
                  Text('Compliance Justification', style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w900)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                reason,
                style: TextStyle(color: context.textDark.withOpacity(0.8), fontSize: 13, height: 1.6, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),"""
        
    content = content.replace(old_dashboard, "")

    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
