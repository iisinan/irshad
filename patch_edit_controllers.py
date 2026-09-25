import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Remove old qtyController and priceController, use form instead
old_vars = """    final form = _HoldingFormData();
    form.symbol.text = holding['symbol']?.toString() ?? '';
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());"""

new_vars = """    final form = _HoldingFormData();
    form.symbol.text = holding['symbol']?.toString() ?? '';
    form.shares.text = holding['shares'].toString();
    form.price.text = holding['average_buy_price'].toString();"""

content = content.replace(old_vars, new_vars)

old_field_qty = "controller: qtyController,"
new_field_qty = "controller: form.shares,"
content = content.replace(old_field_qty, new_field_qty)

old_field_price = "controller: priceController,"
new_field_price = "controller: form.price,"
content = content.replace(old_field_price, new_field_price)

old_save_shares = "final shares = double.tryParse(qtyController.text) ?? 0.0;"
new_save_shares = "final shares = double.tryParse(form.shares.text) ?? 0.0;"
content = content.replace(old_save_shares, new_save_shares)

old_save_price = "final price = double.tryParse(priceController.text) ?? 0.0;"
new_save_price = "final price = double.tryParse(form.price.text) ?? 0.0;"
content = content.replace(old_save_price, new_save_price)

with open(filepath, 'w') as f:
    f.write(content)
