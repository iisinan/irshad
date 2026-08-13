import re

with open('lib/features/stocks/ui/stock_detail_screen.dart', 'r') as f:
    content = f.read()

# I will just remove the chart from `build()` and put it inside `_buildStatusHeader()`
p_chart_in_build = re.compile(r'                  // Price Chart.*?const SizedBox\(height: 32\),\n\s*\],', re.DOTALL)
content = p_chart_in_build.sub('', content)

# Insert the call to _buildPriceChart() inside _buildStatusHeader, right after the first SizedBox(height: 24)
p_header = re.compile(r'(          const SizedBox\(height: 24\),\n)(\s*// We will render price chart inside build, but we render the tabs and badge here)')
content = p_header.sub(r'\1          if ((_currentStock[\'daily_prices\'] ?? []).isNotEmpty && (_currentStock[\'daily_prices\'] as List).any((p) => (double.tryParse(p[\'price\']?.toString() ?? \'0\') ?? 0) > 0))\n            _buildPriceChart(),\n\2', content)


with open('lib/features/stocks/ui/stock_detail_screen.dart', 'w') as f:
    f.write(content)
