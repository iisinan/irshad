import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/api/api_service.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> {
  // Theme Constants
  static const Color bgColor = Color(0xFFF5F0E8);
  static const Color primaryGold = Color(0xFFC9A84C);
  static const Color textDark = Color(0xFF1A1208);
  static const Color textMuted = Color(0xFF9A8C70);
  static const Color divider = Color(0xFFE8E2D9);
  static const Color doubtfulColor = Color(0xFFF59E0B);
  static const Color nonHalalColor = Color(0xFFEF4444);

  // Chart Colors
  final List<Color> _chartColors = [
    const Color(0xFF0284C7),
    const Color(0xFFEAB308),
    const Color(0xFF2E7D32),
    const Color(0xFF9333EA),
    const Color(0xFFF97316),
  ];

  bool isLoading = true;
  String errorMessage = '';

  Map<String, dynamic> summary = {
    'total_balance': 0.0,
    'purification_due': 0.0,
    'health_percentage': 100.0,
  };
  List<dynamic> holdings = [];

  bool _isGuest = false;

  @override
  void initState() {
    super.initState();
    _fetchPortfolio();
  }

  Future<void> _fetchPortfolio() async {
    // Check if user has a token before hitting the API
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'access_token');
    if (token == null) {
      setState(() { _isGuest = true; isLoading = false; });
      return;
    }
    try {
      final response = await ApiService().get('portfolio');
      if (response.data['status'] == 'success') {
        setState(() {
          summary = response.data['data']['summary'];
          holdings = response.data['data']['holdings'];
          isLoading = false;
        });
      } else {
        setState(() { isLoading = false; });
      }
    } catch (e) {
      setState(() {
        // If 401, treat as guest
        _isGuest = true;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calculate_outlined, color: textDark),
            tooltip: 'Zakat Calculator',
            onPressed: () => Navigator.pushNamed(context, '/zakat_calculator'),
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryGold))
          : _isGuest
              ? _buildGuestView()
              : SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildBalanceCard(),
                        const SizedBox(height: 24),
                        const Text(
                          'Allocation',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textDark),
                        ),
                        const SizedBox(height: 16),
                        if (holdings.isNotEmpty) _buildPieChart(),
                        if (holdings.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            alignment: Alignment.center,
                            child: const Text('No assets in your portfolio.', style: TextStyle(color: textMuted)),
                          ),
                        const SizedBox(height: 32),
                        const Text(
                          'Holdings',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textDark),
                        ),
                        const SizedBox(height: 12),
                        ...holdings.asMap().entries.map((entry) => _buildHoldingItem(entry.value, entry.key)),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
      floatingActionButton: _isGuest ? null : FloatingActionButton(
        onPressed: _showAddHoldingSheet,
        backgroundColor: textDark,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildGuestView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.pie_chart_outline_rounded, size: 40, color: primaryGold),
            ),
            const SizedBox(height: 24),
            const Text('Track Your Halal Portfolio',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textDark),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'Sign in to track your NGX holdings, monitor Shariah compliance and calculate your Zakat.',
              style: TextStyle(color: textMuted, fontSize: 15, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGold,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/register'),
              child: const Text('Create a free account →', style: TextStyle(color: primaryGold, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: textDark,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Total Balance',
            style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(
            '₦ ${summary['total_balance'].toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: summary['health_percentage'] < 100 ? doubtfulColor.withOpacity(0.2) : primaryGold.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Icon(summary['health_percentage'] < 100 ? Icons.warning_rounded : Icons.check_circle_rounded, color: summary['health_percentage'] < 100 ? doubtfulColor : primaryGold, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      '${summary['health_percentage']}% Halal',
                      style: TextStyle(color: summary['health_percentage'] < 100 ? doubtfulColor : primaryGold, fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (summary['purification_due'] > 0) ...[
                const SizedBox(width: 8),
                Text(
                  'Purify: ₦${summary['purification_due'].toStringAsFixed(2)}',
                  style: const TextStyle(color: doubtfulColor, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ]
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPieChart() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: divider),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: holdings.asMap().entries.map((entry) {
                  final h = entry.value;
                  final idx = entry.key;
                  return PieChartSectionData(
                    color: _chartColors[idx % _chartColors.length],
                    value: (h['total_value'] as num).toDouble(),
                    title: '',
                    radius: 25,
                  );
                }).toList(),
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: holdings.asMap().entries.map((entry) {
                final h = entry.value;
                final idx = entry.key;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: _chartColors[idx % _chartColors.length],
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        h['symbol'],
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textDark),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildHoldingItem(dynamic holding, int index) {
    bool isHalal = holding['is_halal'];
    double returnPct = (holding['return_percentage'] as num).toDouble();
    double val = (holding['total_value'] as num).toDouble();

    return GestureDetector(
      onTap: () => _showEditHoldingSheet(holding),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isHalal ? divider : nonHalalColor.withOpacity(0.3)),
        ),
        child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left: Symbol and Name
          Row(
            children: [
              Container(
                width: 4,
                height: 40,
                decoration: BoxDecoration(
                  color: _chartColors[index % _chartColors.length],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        holding['symbol'],
                        style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, fontSize: 16),
                      ),
                      if (!isHalal) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.warning_rounded, color: nonHalalColor, size: 14),
                      ]
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${holding['shares']} shares',
                    style: const TextStyle(color: textMuted, fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
          // Right: Value and Change
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₦ ${val.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.w800, color: textDark, fontSize: 15),
              ),
              const SizedBox(height: 4),
              Text(
                '${returnPct >= 0 ? '+' : ''}${returnPct.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: returnPct >= 0 ? primaryGold : nonHalalColor, 
                  fontWeight: FontWeight.w700, 
                  fontSize: 13
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

  void _showAddHoldingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => DefaultTabController(
        length: 2,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.7,
          padding: const EdgeInsets.only(top: 24),
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Add Assets', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textDark)),
                    CloseButton(),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const TabBar(
                labelColor: textDark,
                unselectedLabelColor: textMuted,
                indicatorColor: primaryGold,
                tabs: [
                  Tab(text: 'Link Brokerage'),
                  Tab(text: 'Manual Entry'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    // Link Brokerage
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.account_balance_rounded, size: 64, color: primaryGold),
                          const SizedBox(height: 24),
                          const Text('Connect your NGX Broker', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textDark)),
                          const SizedBox(height: 12),
                          const Text('Securely sync your holdings directly from your broker. Currently supporting Stanbic IBTC, Meristem, and ARM.', textAlign: TextAlign.center, style: TextStyle(color: textMuted)),
                          const SizedBox(height: 32),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: textDark, 
                              foregroundColor: Colors.white, 
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Connect Broker'),
                          )
                        ],
                      ),
                    ),
                    // Manual Entry
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          const TextField(decoration: InputDecoration(labelText: 'Symbol', border: OutlineInputBorder())),
                          const SizedBox(height: 16),
                          const TextField(decoration: InputDecoration(labelText: 'Quantity', border: OutlineInputBorder())),
                          const SizedBox(height: 16),
                          const TextField(decoration: InputDecoration(labelText: 'Average Price', border: OutlineInputBorder())),
                          const Spacer(),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: textDark, 
                              foregroundColor: Colors.white, 
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Add Holding'),
                          )
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditHoldingSheet(dynamic holding) {
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Edit ${holding['symbol']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textDark)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: qtyController,
              decoration: const InputDecoration(labelText: 'Quantity', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: priceController,
              decoration: const InputDecoration(labelText: 'Average Buy Price', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      await ApiService().delete('portfolio/${holding['id']}');
                      if (mounted) Navigator.pop(context);
                      _fetchPortfolio();
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      minimumSize: const Size(0, 50),
                    ),
                    child: const Text('Delete'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      await ApiService().put('portfolio/${holding['id']}', {
                        'shares': double.parse(qtyController.text),
                        'average_buy_price': double.parse(priceController.text),
                      });
                      if (mounted) Navigator.pop(context);
                      _fetchPortfolio();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: textDark, 
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      minimumSize: const Size(0, 50),
                    ),
                    child: const Text('Save'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
