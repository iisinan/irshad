import 'package:flutter/material.dart';
import '../../../../core/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import 'stock_detail_screen.dart';

class StockScreenerScreen extends StatefulWidget {
  const StockScreenerScreen({super.key});

  @override
  State<StockScreenerScreen> createState() => _StockScreenerScreenState();
}

class _StockScreenerScreenState extends State<StockScreenerScreen> {
  bool _isLoading = false;
  List<dynamic> _results = [];
  String _errorMessage = '';

  // Filter States
  bool _filterHalalOnly = false;
  double _minMarketCap = 0;
  double _maxPeRatio = 50;

  @override
  void initState() {
    super.initState();
    _applyFilters();
  }

  Future<void> _applyFilters() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final queryParams = [];
      if (_filterHalalOnly) queryParams.add('status=halal');
      if (_minMarketCap > 0) queryParams.add('min_market_cap=${_minMarketCap * 1000000000}'); // Billion
      if (_maxPeRatio < 50) queryParams.add('pe_max=$_maxPeRatio');

      final queryString = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      final response = await ApiService().get('stocks/ngx$queryString');

      if (response.statusCode == 200 && response.data['status'] == 'success') {
        setState(() {
          _results = response.data['data'];
        });
      } else {
        setState(() => _errorMessage = 'Failed to load screener data.');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Stock Screener', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _buildFilterPanel(),
          const Divider(height: 1, color: AppTheme.divider),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _errorMessage.isNotEmpty
                    ? Center(child: Text(_errorMessage, style: const TextStyle(color: AppTheme.haram)))
                    : _results.isEmpty
                        ? const Center(child: Text('No stocks match your criteria.', style: TextStyle(color: AppTheme.textMuted)))
                        : ListView.builder(
                            itemCount: _results.length,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            itemBuilder: (context, index) {
                              return _buildStockItem(_results[index]);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPanel() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Halal Compliant Only', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              Switch(
                value: _filterHalalOnly,
                activeColor: AppTheme.halal,
                onChanged: (val) {
                  setState(() => _filterHalalOnly = val);
                  _applyFilters();
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Min Market Cap: ₦${_minMarketCap.toInt()}B', style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textDark)),
          Slider(
            value: _minMarketCap,
            min: 0,
            max: 1000,
            divisions: 20,
            activeColor: AppTheme.primary,
            onChanged: (val) {
              setState(() => _minMarketCap = val);
            },
            onChangeEnd: (val) => _applyFilters(),
          ),
          const SizedBox(height: 8),
          Text('Max P/E Ratio: ${_maxPeRatio == 50 ? 'Any' : _maxPeRatio.toInt()}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textDark)),
          Slider(
            value: _maxPeRatio,
            min: 0,
            max: 50,
            divisions: 25,
            activeColor: AppTheme.primary,
            onChanged: (val) {
              setState(() => _maxPeRatio = val);
            },
            onChangeEnd: (val) => _applyFilters(),
          ),
        ],
      ),
    );
  }

  Widget _buildStockItem(dynamic stock) {
    final statusObj = stock['status'];
    final statusString = statusObj != null ? statusObj['status'].toString().toLowerCase() : 'review';
    Color statusColor = AppTheme.review;
    if (statusString == 'halal') statusColor = AppTheme.halal;
    if (statusString == 'non-halal') statusColor = AppTheme.haram;
    if (statusString == 'doubtful') statusColor = AppTheme.doubtful;

    return ListTile(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => StockDetailScreen(stock: stock)),
        );
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.divider)),
        alignment: Alignment.center,
        child: Text(
          stock['symbol'].substring(0, 1),
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.primary),
        ),
      ),
      title: Text(stock['symbol'], style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.textDark)),
      subtitle: Text(stock['sector'] ?? 'Unknown Sector', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text('₦${stock['latest_price']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.textDark)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(100)),
            child: Text(
              statusString.toUpperCase(),
              style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
          )
        ],
      ),
    );
  }
}
