import 'package:flutter/material.dart';
import '../stocks/ui/stock_search_screen.dart';
import '../stocks/ui/ngx_market_screen.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_service.dart';
import '../stocks/providers/stock_provider.dart';
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedRegion = 'Nigeria';
  String _selectedSort = 'Sort by market cap';

  // Theme
  static const Color bgColor = Color(0xFFF5F0E8);
  static const Color primaryGold = Color(0xFFC9A84C);
  static const Color compliantGreen = Color(0xFF2E7D32);
  static const Color questionableAmber = Color(0xFFD97706);
  static const Color textDark = Color(0xFF1A1208);
  static const Color textMuted = Color(0xFF9A8C70);
  static const Color divider = Color(0xFFE8E2D9);

  List<dynamic> _baskets = [];
  bool _isLoadingBaskets = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
    });
    _fetchBaskets();
  }

  Future<void> _fetchStocks() async {
    await Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
  }

  Future<void> _fetchBaskets() async {
    try {
      final response = await ApiService().get('stocks/baskets');
      if (response.statusCode == 200 && response.data['status'] == 'success') {
        if (mounted) {
          setState(() {
            _baskets = response.data['data'];
            _isLoadingBaskets = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingBaskets = false);
      debugPrint('Error fetching baskets: $e');
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTopBar(context),
            _buildTitle(),
            _buildTabBar(),
            _buildFilterRow(),
            Expanded(child: _buildStockList()),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: textDark, size: 26),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          Row(
            children: [

              GestureDetector(
                onTap: () => Navigator.pushNamed(context, '/upgrade'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: textDark, width: 1.5),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Text(
                    'Upgrade',
                    style: TextStyle(
                      color: textDark,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTitle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Text(
        'Explore',
        style: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w900,
          color: textDark,
          letterSpacing: -0.5,
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: divider, width: 1)),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: primaryGold,
        unselectedLabelColor: textMuted,
        indicatorColor: primaryGold,
        indicatorWeight: 2.5,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
        tabs: const [
          Tab(text: 'Stocks'),
          Tab(text: 'Funds'),
          Tab(text: 'Baskets'),
        ],
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          _buildFilterChip(Icons.tune_rounded, '1'),
          const SizedBox(width: 8),
          _buildDropdownChip('🇳🇬', _selectedRegion),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('·', style: TextStyle(color: textMuted, fontSize: 18)),
          ),
          Expanded(
            child: Text(
              _selectedSort,
              style: TextStyle(color: textMuted, fontSize: 13, fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(IconData icon, String badge) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: divider),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: textDark),
          const SizedBox(width: 4),
          Text(badge, style: TextStyle(color: textDark, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildDropdownChip(String flag, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: divider),
      ),
      child: Row(
        children: [
          Text(flag, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: textDark, fontWeight: FontWeight.w500, fontSize: 13)),
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: textMuted),
        ],
      ),
    );
  }

  Widget _buildStockList() {
    return TabBarView(
      controller: _tabController,
      children: [
        _buildStocksTab(),
        _buildComingSoon('Funds'),
        _buildBasketsTab(),
      ],
    );
  }

  Widget _buildStocksTab() {
    return Consumer<StockProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.ngxStocks.isEmpty) {
          return const Center(child: CircularProgressIndicator(color: primaryGold));
        }
        if (provider.ngxStocks.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('No stocks available'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _fetchStocks,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGold,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: _fetchStocks,
          color: primaryGold,
          backgroundColor: Colors.white,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            itemCount: provider.ngxStocks.length,
            separatorBuilder: (_, __) => const Divider(color: divider, height: 1),
            itemBuilder: (context, index) => _buildStockRow(provider.ngxStocks[index]),
          ),
        );
      },
    );
  }

  Widget _buildStockRow(dynamic company) {
    final statusObj = company['status'];
    final statusStr = statusObj != null ? statusObj['status'].toString().toUpperCase() : 'QUESTIONABLE';
    final isCompliant = statusStr == 'HALAL';
    
    double latestPrice = 0.0;
    double priceChange = 0.0;
    double changePct = 0.0;
    
    final dailyPrices = company['daily_prices'] as List<dynamic>? ?? [];
    if (dailyPrices.isNotEmpty) {
      latestPrice = double.tryParse(dailyPrices[0]['price']?.toString() ?? '0') ?? 0.0;
      if (dailyPrices.length > 1) {
        final prevPrice = double.tryParse(dailyPrices[1]['price']?.toString() ?? '0') ?? 0.0;
        if (prevPrice > 0) {
          priceChange = latestPrice - prevPrice;
          changePct = (priceChange / prevPrice) * 100;
        }
      }
    }
    
    final isPositive = priceChange >= 0;
    final priceStr = '₦ ${latestPrice.toStringAsFixed(2)}';
    final changeStr = '${isPositive ? '+' : ''}${changePct.toStringAsFixed(2)}%';

    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/stock_details', arguments: company),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left: Symbol + Status Badge + Name + Flag
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        company['symbol'],
                        style: TextStyle(
                          color: textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildStatusBadge(statusStr, isCompliant),
                      const SizedBox(width: 6),
                      Icon(Icons.flag_outlined, size: 14, color: textMuted),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    company['name'],
                    style: TextStyle(color: textMuted, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Right: Price + Change
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  priceStr,
                  style: TextStyle(
                    color: textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  changeStr,
                  style: TextStyle(
                    color: isPositive ? compliantGreen : Colors.red,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isCompliant) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isCompliant
            ? const Color(0xFFDCFCE7)
            : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: isCompliant ? compliantGreen : questionableAmber,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildComingSoon(String label) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline_rounded, size: 48, color: textMuted),
          const SizedBox(height: 16),
          Text(
            '$label coming soon',
            style: TextStyle(color: textMuted, fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'Upgrade to access all asset classes',
            style: TextStyle(color: textMuted.withOpacity(0.6), fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildBasketsTab() {
    if (_isLoadingBaskets) {
      return const Center(child: CircularProgressIndicator(color: primaryGold));
    }
    if (_baskets.isEmpty) {
      return const Center(child: Text('No curated baskets available.', style: TextStyle(color: textMuted)));
    }
    return RefreshIndicator(
      color: primaryGold,
      onRefresh: _fetchBaskets,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _baskets.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final basket = _baskets[index];
          return _buildBasketCard(basket);
        },
      ),
    );
  }

  Widget _buildBasketCard(dynamic basket) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/basket_details', arguments: basket),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: divider),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (basket['image_url'] != null)
              Image.network(
                basket['image_url'],
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 140,
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.image_not_supported, color: textMuted),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (basket['category'] != null) ...[
                    Text(
                      basket['category'].toString().toUpperCase(),
                      style: const TextStyle(color: primaryGold, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1),
                    ),
                    const SizedBox(height: 6),
                  ],
                  Text(
                    basket['name'] ?? 'Unnamed Basket',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, fontSize: 18),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    basket['description'] ?? '',
                    style: const TextStyle(color: textMuted, fontSize: 13, height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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

// Keep HomeScreen as alias for backward compatibility
class HomeScreen extends ExploreScreen {
  const HomeScreen({super.key});
}
