import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/api/api_service.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class PortfolioOverviewTab extends StatefulWidget {
  const PortfolioOverviewTab({super.key});

  @override
  State<PortfolioOverviewTab> createState() => _PortfolioOverviewTabState();
}

class _PortfolioOverviewTabState extends State<PortfolioOverviewTab> {
  // Theme Constants

  List<Color> get _chartColors => [
    context.theme.colorScheme.secondary,
    Color(0xFF2A6F73),
    context.halal,
    Color(0xFF8B5CF6),
    context.primary,
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
    const storage = FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
    final token = await storage.read(key: 'access_token');
    if (token == null) {
      if (mounted) {
        setState(() { _isGuest = true; isLoading = false; });
      }
      return;
    }
    try {
      final response = await ApiService().get('portfolio');
      if (response.data['status'] == 'success') {
        if (mounted) {
          setState(() {
            summary = response.data['data']['summary'];
            holdings = response.data['data']['holdings'];
            isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() { isLoading = false; });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isGuest = true;
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : _isGuest
              ? _buildGuestView()
              : RefreshIndicator(
                  onRefresh: _fetchPortfolio,
                  color: context.primary,
                  backgroundColor: context.bgAlt,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Padding(
                      padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 100.0),
                      child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildBalanceCard(),
                        const SizedBox(height: 24),
                        Text(
                          'Allocation',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
                        ),
                        const SizedBox(height: 16),
                        if (holdings.isNotEmpty) _buildPieChart(),
                        if (holdings.isEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                            alignment: Alignment.center,
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: context.primary.withValues(alpha: 0.05),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.account_balance_wallet_rounded, size: 48, color: context.primary),
                                ),
                                const SizedBox(height: 24),
                                Text('Your Portfolio is Empty', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 20)),
                                const SizedBox(height: 12),
                                Text(
                                  'Track your halal investments and automatically calculate required purification across your assets.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
                                ),
                                const SizedBox(height: 32),
                                ElevatedButton.icon(
                                  onPressed: () => Navigator.pushNamed(context, '/brokerage/link'),
                                  icon: const Icon(Icons.link_rounded),
                                  label: const Text('Link Brokerage Account', style: TextStyle(fontWeight: FontWeight.w700)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: context.textDark,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    minimumSize: const Size(double.infinity, 56),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const SizedBox(height: 32),
                        Text(
                          'Holdings',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
                        ),
                        const SizedBox(height: 12),
                        ...holdings.asMap().entries.map((entry) => _buildHoldingItem(entry.value, entry.key)),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
      floatingActionButton: _isGuest ? null : FloatingActionButton(
        onPressed: _showAddHoldingSheet,
        backgroundColor: context.textDark,
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
                color: context.accentSoft,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(Icons.pie_chart_outline_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text('Track Your Halal Portfolio',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: context.textDark),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Sign in to track your NGX holdings, monitor Shariah compliance and calculate your Zakat.',
              style: TextStyle(color: context.textMuted, fontSize: 15, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)), // Pill
                  elevation: 0,
                ),
                child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/register'),
              child: Text('Create a free account →', style: TextStyle(color: context.primary, fontWeight: FontWeight.w600)),
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
        gradient: LinearGradient(
          colors: [
            context.primary,
            Color.lerp(context.primary, Colors.black, 0.2) ?? context.primary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: context.primary.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: summary['health_percentage'] < 100 ? context.questionable.withValues(alpha: 0.2) : context.halal.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Icon(summary['health_percentage'] < 100 ? Icons.warning_rounded : Icons.check_circle_rounded, color: summary['health_percentage'] < 100 ? context.questionable : context.halal, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      '${summary['health_percentage']}% Halal',
                      style: TextStyle(color: summary['health_percentage'] < 100 ? context.questionable : context.halal, fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (summary['purification_due'] > 0) ...[
                const SizedBox(width: 8),
                Text(
                  'Purify: ₦${summary['purification_due'].toStringAsFixed(2)}',
                  style: TextStyle(color: context.questionable, fontSize: 13, fontWeight: FontWeight.w600),
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
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.divider),
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
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textDark),
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
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          border: Border(bottom: BorderSide(color: context.divider, width: 1)),
        ),
        child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
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
                        style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16),
                      ),
                      if (!isHalal) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.warning_rounded, color: context.haram, size: 14),
                      ]
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${holding['shares']} shares',
                    style: TextStyle(color: context.textMuted, fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₦ ${val.toStringAsFixed(2)}',
                style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 15),
              ),
              const SizedBox(height: 4),
              Text(
                '${returnPct >= 0 ? '+' : ''}${returnPct.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: returnPct >= 0 ? context.primary : context.haram, 
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
      backgroundColor: context.bgAlt,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => DefaultTabController(
        length: 2,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.7,
          padding: const EdgeInsets.only(top: 24),
          child: Column(
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Add Assets', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: context.textDark)),
                    CloseButton(),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TabBar(
                labelColor: context.textDark,
                unselectedLabelColor: context.textMuted,
                indicatorColor: context.primary,
                tabs: [
                  Tab(text: 'Link Brokerage'),
                  Tab(text: 'Manual Entry'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.account_balance_rounded, size: 64, color: context.primary),
                          const SizedBox(height: 24),
                          Text('Connect your NGX Broker', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark)),
                          const SizedBox(height: 12),
                          Text('Securely sync your holdings directly from your broker. Currently supporting Stanbic IBTC, Meristem, and ARM.', textAlign: TextAlign.center, style: TextStyle(color: context.textMuted)),
                          const SizedBox(height: 32),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: context.primary, 
                              foregroundColor: Colors.white, 
                              minimumSize: const Size(double.infinity, 56),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)), // Pill
                              elevation: 0,
                            ),
                            child: const Text('Connect Broker', style: TextStyle(fontWeight: FontWeight.w800)),
                          )
                        ],
                      ),
                    ),
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
                              backgroundColor: context.primary, 
                              foregroundColor: Colors.white, 
                              minimumSize: const Size(double.infinity, 56),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                              elevation: 0,
                            ),
                            child: const Text('Add Holding', style: TextStyle(fontWeight: FontWeight.w800)),
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
      backgroundColor: context.bgAlt,
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
                Text('Edit ${holding['symbol']}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: context.textDark)),
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
                      try {
                        await ApiService().delete('portfolio/${holding['id']}');
                        if (mounted) Navigator.pop(context);
                        _fetchPortfolio();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to delete: $e'), backgroundColor: context.haram),
                          );
                        }
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: context.haram,
                      side: BorderSide(color: context.haram),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      minimumSize: const Size(0, 56),
                    ),
                    child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      try {
                        final shares = double.parse(qtyController.text);
                        final price = double.parse(priceController.text);
                        await ApiService().put('portfolio/${holding['id']}', {
                          'shares': shares,
                          'average_buy_price': price,
                        });
                        if (mounted) Navigator.pop(context);
                        _fetchPortfolio();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to save: $e'), backgroundColor: context.haram),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.primary, 
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      elevation: 0,
                      minimumSize: const Size(0, 56),
                    ),
                    child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w800)),
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
