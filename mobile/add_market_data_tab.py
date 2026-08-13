import sys

def main():
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
        content = f.read()

    # 1. Update the tabs in _buildStatusHeader
    old_tabs = """              _buildTabItem(0, 'About'),
              _buildTabItem(1, 'Stage 1 Screening'),
              _buildTabItem(2, 'Stage 2 Screening'),
              _buildTabItem(3, 'News'),"""
              
    new_tabs = """              _buildTabItem(0, 'About'),
              _buildTabItem(1, 'Stage 1 Screening'),
              _buildTabItem(2, 'Stage 2 Screening'),
              _buildTabItem(3, 'Price & Market Data'),
              _buildTabItem(4, 'News'),"""
              
    content = content.replace(old_tabs, new_tabs)

    # 2. In _buildStatusHeader, remove the _buildPriceChart() because we will move it to Tab 3.
    old_chart_header = """          const SizedBox(height: 24),
          if ((_currentStock['daily_prices'] ?? []).isNotEmpty && (_currentStock['daily_prices'] as List).any((p) => (double.tryParse(p['price']?.toString() ?? '0') ?? 0) > 0))
            _buildPriceChart(),
          const SizedBox(height: 16),"""
          
    content = content.replace(old_chart_header, "          const SizedBox(height: 32),\n")
    
    # 3. Add Tab 3 and Tab 4 logic to build() body
    # We replace the Tab 2 logic so we can append Tab 3 properly.
    
    old_tab_2_and_3 = """                  if (_selectedTab == 2) ...[
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
                  ],
                  
                  // News Section
                  if (_selectedTab == 3 && (_isLoadingNews || _news.isNotEmpty)) ...["""
                  
    new_tab_2_3_4 = """                  if (_selectedTab == 2) ...[
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
                  ],
                  
                  if (_selectedTab == 3) ...[
                    const SizedBox(height: 16),
                    if ((_currentStock['daily_prices'] ?? []).isNotEmpty && (_currentStock['daily_prices'] as List).any((p) => (double.tryParse(p['price']?.toString() ?? '0') ?? 0) > 0))
                      _buildPriceChart(),
                    const SizedBox(height: 32),
                  ],
                  
                  // News Section
                  if (_selectedTab == 4 && (_isLoadingNews || _news.isNotEmpty)) ...["""
                  
    content = content.replace(old_tab_2_and_3, new_tab_2_3_4)
    
    # Wait, the tabs use a Row with mainAxisAlignment: MainAxisAlignment.spaceBetween. 
    # Having 5 tabs in a single row might cause overflow on small devices. 
    # Let's wrap the tabs in a SingleChildScrollView with scrollDirection: Axis.horizontal!
    
    tabs_row = """          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTabItem(0, 'About'),
              _buildTabItem(1, 'Stage 1 Screening'),
              _buildTabItem(2, 'Stage 2 Screening'),
              _buildTabItem(3, 'Price & Market Data'),
              _buildTabItem(4, 'News'),
            ],
          ),"""
          
    new_tabs_row = """          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildTabItem(0, 'About'),
                const SizedBox(width: 24),
                _buildTabItem(1, 'Stage 1 Screening'),
                const SizedBox(width: 24),
                _buildTabItem(2, 'Stage 2 Screening'),
                const SizedBox(width: 24),
                _buildTabItem(3, 'Price & Market Data'),
                const SizedBox(width: 24),
                _buildTabItem(4, 'News'),
              ],
            ),
          ),"""
          
    content = content.replace(tabs_row, new_tabs_row)

    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
