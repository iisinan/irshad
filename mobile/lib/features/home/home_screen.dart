import 'package:flutter/material.dart';
import '../stocks/ui/stock_search_screen.dart';

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
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color compliantGreen = Color(0xFF16A34A);
  static const Color questionableAmber = Color(0xFFD97706);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  final List<Map<String, dynamic>> _stocks = [
    {'symbol': 'DANGCEM', 'name': 'Dangote Cement PLC', 'status': 'COMPLIANT', 'price': '₦ 448.00', 'change': '+1.25%', 'positive': true},
    {'symbol': 'MTNN', 'name': 'MTN Nigeria Communications PLC', 'status': 'COMPLIANT', 'price': '₦ 245.50', 'change': '+0.45%', 'positive': true},
    {'symbol': 'BUACEMENT', 'name': 'BUA Cement PLC', 'status': 'COMPLIANT', 'price': '₦ 105.00', 'change': '+2.10%', 'positive': true},
    {'symbol': 'NESTLE', 'name': 'Nestle Nigeria PLC', 'status': 'QUESTIONABLE', 'price': '₦ 1,150.00', 'change': '-0.15%', 'positive': false},
    {'symbol': 'OKOMUOIL', 'name': 'Okomu Oil Palm PLC', 'status': 'COMPLIANT', 'price': '₦ 265.00', 'change': '+1.10%', 'positive': true},
    {'symbol': 'PRESCO', 'name': 'Presco PLC', 'status': 'COMPLIANT', 'price': '₦ 195.00', 'change': '+0.85%', 'positive': true},
    {'symbol': 'DANGSUGAR', 'name': 'Dangote Sugar Refinery PLC', 'status': 'COMPLIANT', 'price': '₦ 65.40', 'change': '+1.45%', 'positive': true},
    {'symbol': 'FRIESLAND', 'name': 'FrieslandCampina WAMCO Nigeria PLC', 'status': 'QUESTIONABLE', 'price': '₦ 75.20', 'change': '-0.40%', 'positive': false},
    {'symbol': 'JULI', 'name': 'Juli PLC', 'status': 'COMPLIANT', 'price': '₦ 9.42', 'change': '+9.98%', 'positive': true},
    {'symbol': 'UPDC', 'name': 'UPDC PLC', 'status': 'QUESTIONABLE', 'price': '₦ 1.55', 'change': '0.00%', 'positive': true},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
          Icon(Icons.settings_outlined, color: textDark, size: 26),
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
        labelColor: primaryGreen,
        unselectedLabelColor: textMuted,
        indicatorColor: primaryGreen,
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
        _buildComingSoon('Baskets'),
      ],
    );
  }

  Widget _buildStocksTab() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      itemCount: _stocks.length,
      separatorBuilder: (_, __) => Divider(color: divider, height: 1),
      itemBuilder: (context, index) => _buildStockRow(_stocks[index]),
    );
  }

  Widget _buildStockRow(Map<String, dynamic> stock) {
    final isCompliant = stock['status'] == 'COMPLIANT';
    final isPositive = stock['positive'] as bool;

    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/stock_details', arguments: stock),
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
                        stock['symbol'],
                        style: TextStyle(
                          color: textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildStatusBadge(stock['status'], isCompliant),
                      const SizedBox(width: 6),
                      Icon(Icons.flag_outlined, size: 14, color: textMuted),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    stock['name'],
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
                  stock['price'],
                  style: TextStyle(
                    color: textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stock['change'],
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
}

// Keep HomeScreen as alias for backward compatibility
class HomeScreen extends ExploreScreen {
  const HomeScreen({super.key});
}
