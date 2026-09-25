import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update _showEditHoldingSheet variables
old_vars = """  void _showEditHoldingSheet(BuildContext context, dynamic holding) {
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());"""

new_vars = """  void _showEditHoldingSheet(BuildContext context, dynamic holding) {
    final form = _HoldingFormData();
    form.symbol.text = holding['symbol']?.toString() ?? '';
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());"""

content = content.replace(old_vars, new_vars)

# 2. Update the layout to include Ticker Symbol field
old_layout = """                Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      Row("""

new_layout = """                Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      _buildTickerSymbolField(form),
                      const SizedBox(height: 16),
                      Row("""
content = content.replace(old_layout, new_layout)

# 3. Update the save logic
old_save = """                                  if (shares == 0) {
                                    await ApiService().delete('portfolio/${holding['id']}');
                                    await provider.fetchPortfolio();
                                  } else {
                                    await provider.updateHolding(holding['id'], shares, price);
                                  }"""

new_save = """                                  if (shares == 0) {
                                    await ApiService().delete('portfolio/${holding['id']}');
                                    await provider.fetchPortfolio();
                                  } else {
                                    await provider.updateHolding(holding['id'], shares, price, symbol: form.symbol.text);
                                  }"""
content = content.replace(old_save, new_save)

with open(filepath, 'w') as f:
    f.write(content)
