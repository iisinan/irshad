import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/stock_provider.dart';

class NgxMarketScreen extends StatefulWidget {
  const NgxMarketScreen({super.key});

  @override
  State<NgxMarketScreen> createState() => _NgxMarketScreenState();
}

class _NgxMarketScreenState extends State<NgxMarketScreen> {
  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color cardBg = Colors.white;
  static const Color divider = Color(0xFFE5E7EB);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
    });
  }

  Future<void> _fetchNgxData() async {
    await Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Live Stock Market', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: primaryGreen),
            onPressed: _fetchNgxData,
          ),
        ],
      ),
      body: Consumer<StockProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.ngxStocks.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: primaryGreen));
          }

          if (provider.ngxStocks.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            color: primaryGreen,
            onRefresh: _fetchNgxData,
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: provider.ngxStocks.length,
              itemBuilder: (context, index) {
                return _buildStockCard(provider.ngxStocks[index]);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.query_stats_rounded, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'No market data available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textMuted),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check back after the next market scrape.',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildStockCard(Map<String, dynamic> stock) {
    final status = stock['status']?['status'] ?? 'doubtful';
    final latestPrice = stock['daily_prices']?.isNotEmpty == true 
        ? stock['daily_prices'][0]['price'] 
        : '0.00';

    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'halal':
        statusColor = const Color(0xFF16A34A); // Green
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626); // Red
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = const Color(0xFFD97706); // Orange
        statusIcon = Icons.help_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                stock['symbol'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: textDark),
              ),
            ),
            Text(
              '₦ ${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: textDark),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              stock['name'] ?? '',
              style: const TextStyle(color: textMuted, fontWeight: FontWeight.w500),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: statusColor.withOpacity(0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(statusIcon, size: 14, color: statusColor),
                  const SizedBox(width: 6),
                  Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
