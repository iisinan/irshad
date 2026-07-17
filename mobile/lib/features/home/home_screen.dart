import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_service.dart';
import '../stocks/providers/stock_provider.dart';
import '../../core/theme/app_theme.dart';
import '../stocks/ui/stock_search_screen.dart';
import '../portfolio/ui/portfolio_screen.dart';
import '../portfolio/ui/zakat_calculator_screen.dart';
import '../stocks/ui/ngx_market_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _baskets = [];
  bool _isLoadingBaskets = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshData();
    });
  }

  Future<void> _refreshData() async {
    Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
    await _fetchBaskets();
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primary,
          onRefresh: _refreshData,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _buildHeader()),
              SliverToBoxAdapter(child: _buildSearchBar(context)),
              SliverToBoxAdapter(child: _buildMarketSnapshotWidget()),
              SliverToBoxAdapter(child: _buildQuickActionsGrid(context)),
              SliverToBoxAdapter(child: _buildTopMoversWidget()),
              SliverToBoxAdapter(child: _buildBasketsWidget()),
              const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Salam, Investor',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textDark,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('EEEE, MMM d').format(DateTime.now()),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, '/notifications');
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: const Icon(Icons.notifications_none_rounded, color: AppTheme.textDark, size: 24),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: GestureDetector(
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const StockSearchScreen()));
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.divider, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.search_rounded, color: AppTheme.textMuted, size: 22),
              const SizedBox(width: 12),
              Text(
                'Search for stocks, symbols...',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMarketSnapshotWidget() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Market Snapshot',
                  style: _widgetTitleStyle(),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentSoft,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'OPEN',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NGX All-Share',
                      style: TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '97,745.73',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.halal.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.trending_up_rounded, color: AppTheme.halal, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        '+1.24%',
                        style: TextStyle(color: AppTheme.halal, fontWeight: FontWeight.w800, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionsGrid(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        children: [
          Expanded(child: _buildActionCard(context, Icons.radar_rounded, 'Screener', AppTheme.primary, () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const StockSearchScreen()));
          })),
          const SizedBox(width: 12),
          Expanded(child: _buildActionCard(context, Icons.pie_chart_rounded, 'Portfolio', const Color(0xFF3B82F6), () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const PortfolioScreen()));
          })),
          const SizedBox(width: 12),
          Expanded(child: _buildActionCard(context, Icons.calculate_rounded, 'Zakat', const Color(0xFFF59E0B), () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const ZakatCalculatorScreen()));
          })),
        ],
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, IconData icon, String title, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: _cardDecoration(),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                color: AppTheme.textDark,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopMoversWidget() {
    return Consumer<StockProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.ngxStocks.isEmpty) {
          return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
        }

        final stocks = provider.ngxStocks.take(3).toList();
        if (stocks.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Top Movers', style: _widgetTitleStyle()),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const NgxMarketScreen()));
                      },
                      child: Text('View All', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...stocks.map((stock) => _buildMoverRow(stock)).toList(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMoverRow(dynamic stock) {
    final price = stock['close_price']?.toString() ?? '0.00';
    final change = stock['change_percent'] ?? 0.0;
    final isPos = change >= 0;
    final color = isPos ? AppTheme.halal : AppTheme.haram;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.bgSection,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                stock['symbol'].substring(0, 1),
                style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(stock['symbol'], style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textDark, fontSize: 15)),
                Text(
                  stock['name'] ?? '',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('₦$price', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textDark, fontSize: 15)),
              Text(
                '${isPos ? '+' : ''}${change.toStringAsFixed(2)}%',
                style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBasketsWidget() {
    if (_isLoadingBaskets && _baskets.isEmpty) {
      return const SizedBox.shrink();
    }
    if (_baskets.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text('Curated Themes', style: _widgetTitleStyle()),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 140,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _baskets.length,
              itemBuilder: (context, index) {
                final b = _baskets[index];
                return _buildThemeCard(b);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeCard(dynamic basket) {
    return Container(
      width: 130,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.accentSoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.category_rounded, color: AppTheme.primary, size: 20),
          ),
          const Spacer(),
          Text(
            basket['name'],
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.textDark, height: 1.2),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            '${basket['stocks_count'] ?? 0} Stocks',
            style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.black.withOpacity(0.03)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 16,
          offset: const Offset(0, 8),
        )
      ],
    );
  }

  TextStyle _widgetTitleStyle() {
    return TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w800,
      color: AppTheme.textDark,
      letterSpacing: -0.3,
    );
  }
}
