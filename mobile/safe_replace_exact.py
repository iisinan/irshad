import sys

def main():
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
        lines = f.readlines()
        
    new_aaoifi = """  Widget _buildComplianceDashboard(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    final debtRatio = latest != null && latest['interest_bearing_debt_ratio'] != null 
        ? (double.tryParse(latest['interest_bearing_debt_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    final interestRatio = latest != null && latest['interest_income_ratio'] != null 
        ? (double.tryParse(latest['interest_income_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    final cashRatio = latest != null && latest['cash_and_equivalents_ratio'] != null 
        ? (double.tryParse(latest['cash_and_equivalents_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    Widget buildGauge(String title, double value, double limit) {
      bool isPass = value <= limit;
      Color gaugeColor = isPass ? context.halal : context.haram;
      double percentage = value / limit;
      if (percentage > 1.0) percentage = 1.0;
      if (percentage < 0.0) percentage = 0.0;
      
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.divider.withOpacity(0.5)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 70,
                width: 70,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      value: 1.0,
                      backgroundColor: Colors.transparent,
                      color: context.divider.withOpacity(0.2),
                      strokeWidth: 6,
                    ),
                    CircularProgressIndicator(
                      value: percentage,
                      backgroundColor: Colors.transparent,
                      color: gaugeColor,
                      strokeWidth: 6,
                      strokeCap: StrokeCap.round,
                    ),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('${value.toStringAsFixed(1)}%', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 13)),
                          Text('<${limit.toStringAsFixed(0)}%', style: TextStyle(color: context.textMuted, fontSize: 9, fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(title, style: TextStyle(color: context.textMuted, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isPass ? context.halalBg : context.haramBg,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  isPass ? 'PASS' : 'FAIL',
                  style: TextStyle(color: isPass ? context.halal : context.haram, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildGauge('DEBT', debtRatio, 30.0),
            const SizedBox(width: 12),
            buildGauge('CASH', cashRatio, 30.0),
            const SizedBox(width: 12),
            buildGauge('INCOME', interestRatio, 5.0),
          ],
        ),
        const SizedBox(height: 24),
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
        ),
      ],
    );
  }
"""

    new_header = """  Widget _buildStatusHeader(Color color, Color bg, String label, {bool purificationRequired = false, double percent = 0.0, bool scholarVerified = false}) {
    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;
    final priceChange = _currentStock['price_change_pct'] != null ? double.tryParse(_currentStock['price_change_pct'].toString()) : null;
    final isUp = (priceChange ?? 0) >= 0;
    
    final absChangeStr = _currentStock['price_change']?.toString() ?? '0.00';
    final pctChangeStr = priceChange?.toStringAsFixed(2) ?? '0.00';

    String mainLabel = label;
    if (purificationRequired) {
      mainLabel = 'SHARIAH COMPLIANT';
    }

    return Container(
      width: double.infinity,
      color: context.bg,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_currentStock['symbol'] ?? '', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                  const SizedBox(height: 2),
                  Text(_currentStock['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₦${latestPrice.toStringAsFixed(2)}', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                  const SizedBox(height: 2),
                  Text(
                    '${isUp ? '+' : '-'}₦$absChangeStr (${isUp ? '+' : ''}$pctChangeStr%)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: isUp ? context.halal : context.haram,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          if ((_currentStock['daily_prices'] ?? []).isNotEmpty && (_currentStock['daily_prices'] as List).any((p) => (double.tryParse(p['price']?.toString() ?? '0') ?? 0) > 0))
            _buildPriceChart(),
          const SizedBox(height: 16),
          Row(
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
          ),
          const SizedBox(height: 24),
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
          ),
        ],
      ),
    );
  }
"""

    new_build_section = """                  // Shariah Compliance Dashboard
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('Shariah Compliance Dashboard'),
                    const SizedBox(height: 12),
                    _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],

"""
    
    # Bottom to top replacements
    # 5. _buildAaoifiBreakdown
    start_idx_aaoifi = 1255 - 1
    end_idx_aaoifi = 1641 - 1
    lines[start_idx_aaoifi:end_idx_aaoifi+1] = [new_aaoifi + "\n"]
    
    # 4. _buildFinancialHighlights
    start_idx_fin = 1210 - 1
    end_idx_fin = 1253 - 1
    lines[start_idx_fin:end_idx_fin+1] = []
    
    # 3. _buildStatusHeader
    start_idx_header = 596 - 1
    end_idx_header = 725 - 1
    lines[start_idx_header:end_idx_header+1] = [new_header + "\n"]
    
    # 2. build() AAOIFI and Financial Highlights calls
    start_idx_build = 390 - 1
    end_idx_build = 404 - 1
    lines[start_idx_build:end_idx_build+1] = [new_build_section]
    
    # 1. build() Price Chart and Shariah Justification calls
    start_idx_top = 340 - 1
    end_idx_top = 376 - 1
    lines[start_idx_top:end_idx_top+1] = []

    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
        f.writelines(lines)
        
    print("Successfully replaced exact lines")

if __name__ == '__main__':
    main()
