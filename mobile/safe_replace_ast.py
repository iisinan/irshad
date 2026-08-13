import sys

def get_method(content, method_name):
    idx = content.find(method_name)
    if idx == -1: return None, -1, -1
    
    # find first { after method name
    start_brace = content.find('{', idx)
    if start_brace == -1: return None, -1, -1
    
    open_braces = 0
    for i in range(start_brace, len(content)):
        if content[i] == '{': open_braces += 1
        elif content[i] == '}': open_braces -= 1
        
        if open_braces == 0:
            # found end of method
            # capture from the beginning of the line where method_name is
            line_start = content.rfind('\n', 0, idx)
            if line_start == -1: line_start = 0
            else: line_start += 1
            return content[line_start:i+1], line_start, i+1
            
    return None, -1, -1

def main():
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
        content = f.read()

    # 1. Replace _buildStatusHeader
    header_content, hs, he = get_method(content, 'Widget _buildStatusHeader(')
    
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
  }"""
    
    if header_content:
        content = content.replace(header_content, new_header)

    # 2. Replace _buildAaoifiBreakdown with _buildComplianceDashboard
    aaoifi_content, _ , _ = get_method(content, 'Widget _buildAaoifiBreakdown(')
    
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
  }"""

    if aaoifi_content:
        content = content.replace(aaoifi_content, new_aaoifi)

    # 3. Remove _buildFinancialHighlights
    fin_content, _ , _ = get_method(content, 'Widget _buildFinancialHighlights(')
    if fin_content:
        content = content.replace(fin_content, '')
        
    # 4. Modify build() method calls
    # Remove Shariah Justification
    shariah_just = """                  // Shariah Justification Summary
                  if (_currentStock['shariah_justification'] != null && _currentStock['shariah_justification'].toString().trim().isNotEmpty) ...[
                    _buildSectionHeader('Shariah Justification Summary'),
                    const SizedBox(height: 12),
                    _buildShariahJustification(),
                    const SizedBox(height: 32),
                  ],"""
    content = content.replace(shariah_just, '')
    
    # Replace AAOIFI block call and Financial Highlights call
    build_aaoifi = """                  // AAOIFI Screening Breakdown
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('AAOIFI Screening Breakdown'),
                    const SizedBox(height: 12),
                    _buildAaoifiBreakdown(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],"""
    
    build_fin = """                  // Financial Highlights
                  if (hasFinancialHighlights) ...[
                    _buildSectionHeader('Financial Highlights'),
                    const SizedBox(height: 12),
                    _buildFinancialHighlights(),
                    const SizedBox(height: 32),
                  ],"""
                  
    new_call = """                  // Shariah Compliance Dashboard
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('Shariah Compliance Dashboard'),
                    const SizedBox(height: 12),
                    _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],"""
                  
    content = content.replace(build_aaoifi, new_call)
    content = content.replace(build_fin, '')
    
    # Remove Price chart from build() since it's now in the header
    price_chart = """                  // Price Chart
                  if ((_currentStock['daily_prices'] ?? []).isNotEmpty &&
                      (_currentStock['daily_prices'] as List).any((p) => (double.tryParse(p['price']?.toString() ?? '0') ?? 0) > 0)) ...[
                    _buildPriceChart(),
                    const SizedBox(height: 32),
                  ],"""
    content = content.replace(price_chart, '')
    
    with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
