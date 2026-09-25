import os

filepath = 'mobile/lib/features/portfolio/providers/portfolio_provider.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_func = """  Future<bool> updateHolding(int id, double shares, double averageBuyPrice) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService().put('portfolio/$id', {
        'shares': shares,
        'average_buy_price': averageBuyPrice,
      });"""

new_func = """  Future<bool> updateHolding(int id, double shares, double averageBuyPrice, {String? symbol}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = <String, dynamic>{
        'shares': shares,
        'average_buy_price': averageBuyPrice,
      };
      if (symbol != null && symbol.isNotEmpty) {
        data['symbol'] = symbol;
      }
      final response = await ApiService().put('portfolio/$id', data);"""

content = content.replace(old_func, new_func)

with open(filepath, 'w') as f:
    f.write(content)
