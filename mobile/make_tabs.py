import sys

def main():
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
        lines = f.readlines()
        
    # 1. Add _selectedTab to state
    # Find `bool _isAlreadyFavorited = false;`
    for i, line in enumerate(lines):
        if 'bool _isAlreadyFavorited = false;' in line:
            lines.insert(i + 1, '  int _selectedTab = 1;\n')
            break
            
    # 2. Modify _buildStatusHeader (which is now shifted down by 1 line, let's use string replacement for safety)
    content = "".join(lines)
    
    # The tabs row:
    old_tabs = """          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Summary', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w700)),
              Container(
                padding: const EdgeInsets.only(bottom: 6),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: context.textDark, width: 2))),
                child: Text('Shariah', style: TextStyle(color: context.textDark, fontSize: 13, fontWeight: FontWeight.w900)),
              ),
              Text('Performance', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w700)),
              Text('News', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w700)),
            ],
          ),"""
          
    new_tabs = """          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTabItem(0, 'Summary'),
              _buildTabItem(1, 'Shariah'),
              _buildTabItem(2, 'Performance'),
              _buildTabItem(3, 'News'),
            ],
          ),"""
          
    content = content.replace(old_tabs, new_tabs)
    
    tab_helper = """
  Widget _buildTabItem(int index, String title) {
    bool isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.only(bottom: 6),
        decoration: isSelected 
            ? BoxDecoration(border: Border(bottom: BorderSide(color: context.textDark, width: 2)))
            : null,
        child: Text(
          title, 
          style: TextStyle(
            color: isSelected ? context.textDark : context.textMuted, 
            fontSize: 13, 
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700
          ),
        ),
      ),
    );
  }
"""
    # Insert tab_helper right before _buildStatusHeader
    content = content.replace('  Widget _buildStatusHeader', tab_helper + '  Widget _buildStatusHeader')

    # 3. Extract the Verdict Badge from _buildStatusHeader
    old_badge = """          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: color.withOpacity(0.6), width: 1.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  mainLabel.contains('COMPLIANT') && !mainLabel.contains('NON') ? Icons.verified_rounded :
                  mainLabel.contains('NON-COMPLIANT') ? Icons.cancel_rounded : Icons.help_rounded,
                  color: color,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  mainLabel,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.3),
                ),
              ],
            ),
          ),"""
          
    # We remove old_badge from _buildStatusHeader (but wait, _buildStatusHeader is passed `color`, `bg`, `label`).
    # We should keep _buildStatusHeader params and just return the badge as a separate widget _buildVerdictBadge.
    # Actually, we can just leave the badge in the build() method if we split it out.
    content = content.replace(old_badge, "")
    
    # 4. Modify build() to conditionally render sections!
    build_body = """                  // Company Metadata
                  _buildDetailedOverview(),
                  _buildCompanyInfo(),
                  
                  // Shariah Compliance Dashboard
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('Shariah Compliance Dashboard'),
                    const SizedBox(height: 12),
                    _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],"""
                  
    new_build_body = """                  if (_selectedTab == 0) ...[
                    const SizedBox(height: 16),
                    _buildDetailedOverview(),
                    _buildCompanyInfo(),
                  ],
                  
                  if (_selectedTab == 1) ...[
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
                  
    content = content.replace(build_body, new_build_body)
    
    # 5. Hide the news section unless _selectedTab == 3
    news_old = """                  // News Section
                  if (_isLoadingNews || _news.isNotEmpty) ...["""
    news_new = """                  // News Section
                  if (_selectedTab == 3 && (_isLoadingNews || _news.isNotEmpty)) ...["""
    content = content.replace(news_old, news_new)
    
    # Fix the missing color context reference in new_build_body by using .withValues if needed, but withOpacity works for now.
    
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
        f.write(content)
        
if __name__ == '__main__':
    main()
