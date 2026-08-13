import re

with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
    content = f.read()

# Replace AppBar title
content = re.sub(r'appBar: AppBar\(\n\s*title: Row\(.*?backgroundColor: context.bg,', 'appBar: AppBar(\n        backgroundColor: context.bg,', content, flags=re.DOTALL)

# Replace _buildStatusHeader
p_header = re.compile(r'  Widget _buildStatusHeader\(Color color, Color bg, String label, \{bool purificationRequired = false, double percent = 0\.0, bool scholarVerified = false\}\) \{.*?    \);\n  }', re.DOTALL)

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
          // We will render price chart inside build, but we render the tabs and badge here
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
          // Verdict badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: color.withValues(alpha: 0.6), width: 1.5),
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
content = p_header.sub(new_header, content)

# Now, we must rearrange build method. Currently _buildPriceChart() is after _buildStatusHeader.
# In the mockup, it's inside the header. Wait, I will just leave it after _buildStatusHeader, but I will adjust _buildStatusHeader to only contain up to the price chart, and then put the badge below.
# Actually, the python script has `Row` with tabs, and then the badge, inside _buildStatusHeader.
# It's easier if I just run this script.

with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
    f.write(content)
