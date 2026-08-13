import re

with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
    content = f.read()

# 1. Remove Shariah Justification block
# Find the block starting with // Shariah Justification Summary down to the SizedBox(height: 32), before // About Company
p1 = re.compile(r'(\s*// Shariah Justification Summary.*?const SizedBox\(height: 32\),\n)', re.DOTALL)
content = p1.sub('', content)

# 2. Remove Financial Highlights from build method
p2 = re.compile(r'(\s*// Financial Highlights.*?const SizedBox\(height: 32\),\n\s*\]\,\n)', re.DOTALL)
content = p2.sub('', content)

# 3. Replace AAOIFI Screening Breakdown call with Shariah Compliance Dashboard
p3 = re.compile(r"// AAOIFI Screening Breakdown\n(\s*)if \(\(_currentStock\['financials'\] \?\? \[\]\)\.isNotEmpty\) \.\.\.\[\n(\s*)_buildSectionHeader\('AAOIFI Screening Breakdown'\),\n(\s*)const SizedBox\(height: 12\),\n(\s*)_buildAaoifiBreakdown\(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal\),\n(\s*)const SizedBox\(height: 32\),\n(\s*)\],")
replacement3 = r"""// Shariah Compliance Dashboard
\1if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
\2_buildSectionHeader('Shariah Compliance Dashboard'),
\3const SizedBox(height: 12),
\4_buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
\5const SizedBox(height: 32),
\6],"""
content = p3.sub(replacement3, content)

# 4. Remove _buildFinancialHighlights and _buildAaoifiBreakdown definitions
# Find from Widget _buildFinancialHighlights() up to Widget _buildAiAssistantButton()
p4 = re.compile(r'  Widget _buildFinancialHighlights\(\) \{.*?  Widget _buildAiAssistantButton\(\) \{', re.DOTALL)

dashboard_code = """  Widget _buildComplianceDashboard(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
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
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5)),
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
                      color: context.divider.withValues(alpha: 0.2),
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
            border: Border.all(color: statusColor.withValues(alpha: 0.3)),
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
                style: TextStyle(color: context.textDark.withValues(alpha: 0.8), fontSize: 13, height: 1.6, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAiAssistantButton() {"""
content = p4.sub(dashboard_code, content)

with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
    f.write(content)
