import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_service.dart';
import '../../../../core/widgets/company_avatar.dart';
import '../../providers/portfolio_provider.dart';
import '../../../stocks/providers/stock_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class PortfolioOverviewTab extends StatefulWidget {
  const PortfolioOverviewTab({super.key});

  @override
  State<PortfolioOverviewTab> createState() => _PortfolioOverviewTabState();
}

class _PortfolioOverviewTabState extends State<PortfolioOverviewTab> {
  String _selectedFilter = 'All';

  List<Color> get _chartColors => [
    context.theme.colorScheme.secondary,
    Color(0xFF2A6F73),
    context.halal,
    Color(0xFF8B5CF6),
    context.primary,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Consumer<PortfolioProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.summary['total_balance'] == 0) {
            return Center(child: CircularProgressIndicator(color: context.primary));
          }

          if (provider.isGuest) {
            return _buildGuestView(context);
          }

          List<dynamic> filteredHoldings = provider.holdings.where((h) {
            bool isHalal = h['is_halal'] ?? false;
            if (_selectedFilter == 'All') return true;
            if (_selectedFilter == 'Compliant') return isHalal;
            if (_selectedFilter == 'Non-Compliant') return !isHalal;
            // Purify and Doubtful could be handled if we have data for it. For now map to true/false.
            return true;
          }).toList();

          return RefreshIndicator(
            onRefresh: provider.fetchPortfolio,
            color: context.primary,
            backgroundColor: context.bgAlt,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 100.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBalanceCard(context, provider),
                    const SizedBox(height: 24),
                    _buildFilterTabs(context),
                    const SizedBox(height: 24),
                    if (provider.holdings.isNotEmpty) _buildPieChart(context, provider.holdings),
                    if (provider.holdings.isNotEmpty) const SizedBox(height: 32),
                    if (provider.holdings.isNotEmpty)
                      Text(
                        'Holdings',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
                      ),
                    if (provider.holdings.isNotEmpty) const SizedBox(height: 12),
                    if (filteredHoldings.isEmpty && provider.holdings.isEmpty) _buildEmptyState(context),
                    if (filteredHoldings.isEmpty && provider.holdings.isNotEmpty) 
                      Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(child: Text('No holdings match this filter.', style: TextStyle(color: context.textMuted))),
                      ),
                    ...filteredHoldings.asMap().entries.map((entry) => _buildHoldingItem(context, entry.value, entry.key)),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterTabs(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildFilterChip('All', Icons.layers),
                _buildFilterChip('Compliant', Icons.verified_user_outlined),
                _buildFilterChip('Compliant (Purify)', Icons.water_drop_outlined),
                _buildFilterChip('Doubtful', Icons.help_outline),
                _buildFilterChip('Non-Compliant', Icons.warning_amber_rounded),
              ],
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton.icon(
            onPressed: () => _showAddHoldingSheet(context),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Add Holding', style: TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.textDark,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, IconData icon) {
    bool isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? context.bg : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))] : [],
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isSelected ? context.primary : context.textMuted),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? context.primary : context.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestView(BuildContext context) {
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
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

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      alignment: Alignment.center,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(28),
            ),
            child: Icon(Icons.account_balance_wallet_outlined, size: 48, color: context.primary),
          ),
          const SizedBox(height: 24),
          Text(
            'Your Portfolio is Empty',
            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Start tracking your investments and ensure they align with Islamic financial principles.',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.textMuted, height: 1.6, fontSize: 15),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => _showAddHoldingSheet(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Your First Asset', style: TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, PortfolioProvider provider) {
    return Container(
      width: double.infinity,
      height: 140,
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.divider.withOpacity(0.5)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -30,
            top: -40,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: context.halal.withOpacity(0.1), width: 16),
              ),
            ),
          ),
          Positioned(
            right: 40,
            bottom: -50,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: context.primary.withOpacity(0.05), width: 14),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '₦${provider.summary['total_balance'].toStringAsFixed(0)}',
                  style: TextStyle(
                    color: context.textDark,
                    fontSize: 42,
                    fontWeight: FontWeight.w900,
                    height: 1.0,
                    letterSpacing: -1.5,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.verified_user_outlined, color: context.halal, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Compliant ',
                      style: TextStyle(color: context.textMuted, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      provider.holdings.where((h) => h['is_halal'] == true).length.toString(),
                      style: TextStyle(color: context.textDark, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieChart(BuildContext context, List<dynamic> holdings) {
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
                    value: num.tryParse(h['total_value']?.toString() ?? '0')?.toDouble() ?? 0.0,
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

  Widget _buildHoldingItem(BuildContext context, dynamic holding, int index) {
    bool isHalal = holding['is_halal'] ?? false;
    double returnPct = num.tryParse(holding['return_percentage']?.toString() ?? '0')?.toDouble() ?? 0.0;
    double val = num.tryParse(holding['total_value']?.toString() ?? '0')?.toDouble() ?? 0.0;

    return GestureDetector(
      onTap: () => _showEditHoldingSheet(context, holding),
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
                CompanyAvatar(
                  logoUrl: holding['logo_url'],
                  symbol: holding['symbol'] ?? 'S',
                  size: 40,
                  borderRadius: 12,
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

  void _showAddHoldingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddHoldingBottomSheet(),
    );
  }

  void _showEditHoldingSheet(BuildContext context, dynamic holding) {
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.bgAlt,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (bottomSheetContext) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Edit ${holding['symbol']}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: context.textDark)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(bottomSheetContext)),
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
                        if (mounted) Navigator.pop(bottomSheetContext);
                        if (mounted) Provider.of<PortfolioProvider>(context, listen: false).fetchPortfolio();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(bottomSheetContext).showSnackBar(
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
                        final shares = double.tryParse(qtyController.text) ?? 0.0;
                        final price = double.tryParse(priceController.text) ?? 0.0;
                        await ApiService().put('portfolio/${holding['id']}', {
                          'shares': shares,
                          'average_buy_price': price,
                        });
                        if (mounted) Navigator.pop(bottomSheetContext);
                        if (mounted) Provider.of<PortfolioProvider>(context, listen: false).fetchPortfolio();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(bottomSheetContext).showSnackBar(
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

class _HoldingFormData {
  final TextEditingController symbol = TextEditingController();
  final TextEditingController shares = TextEditingController();
  final TextEditingController price = TextEditingController();
  final TextEditingController date = TextEditingController();
  final FocusNode symbolFocus = FocusNode();

  void dispose() {
    symbol.dispose();
    shares.dispose();
    price.dispose();
    date.dispose();
    symbolFocus.dispose();
  }
}

class _AddHoldingBottomSheet extends StatefulWidget {
  const _AddHoldingBottomSheet({Key? key}) : super(key: key);
  @override
  State<_AddHoldingBottomSheet> createState() => _AddHoldingBottomSheetState();
}

class _AddHoldingBottomSheetState extends State<_AddHoldingBottomSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<_HoldingFormData> _holdings = [];
  double _estimatedTotal = 0.0;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _addNewHoldingForm();
  }

  void _addNewHoldingForm() {
    final form = _HoldingFormData();
    form.shares.addListener(_calculateTotal);
    form.price.addListener(_calculateTotal);
    setState(() {
      _holdings.add(form);
    });
  }

  void _calculateTotal() {
    double total = 0.0;
    for (var form in _holdings) {
      double shares = double.tryParse(form.shares.text) ?? 0.0;
      double price = double.tryParse(form.price.text) ?? 0.0;
      total += (shares * price);
    }
    setState(() {
      _estimatedTotal = total;
    });
  }

  @override
  void dispose() {
    for (var form in _holdings) {
      form.shares.removeListener(_calculateTotal);
      form.price.removeListener(_calculateTotal);
      form.dispose();
    }
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _submitHoldings() async {
    List<Map<String, dynamic>> payload = [];
    for (var form in _holdings) {
      if (form.symbol.text.trim().isEmpty) continue;
      payload.add({
        'symbol': form.symbol.text.trim().toUpperCase(),
        'shares': double.tryParse(form.shares.text) ?? 0,
        'average_buy_price': double.tryParse(form.price.text) ?? 0,
        'purchase_date': form.date.text.trim().isEmpty ? null : form.date.text.trim(),
      });
    }

    if (payload.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter at least one holding with a symbol.'), backgroundColor: context.haram));
      return;
    }

    setState(() => _isSubmitting = true);
    final provider = Provider.of<PortfolioProvider>(context, listen: false);
    bool success = await provider.bulkAddHoldings(payload);
    setState(() => _isSubmitting = false);

    if (success) {
      if (mounted) Navigator.pop(context);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to add holdings.'), backgroundColor: context.haram));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add Holdings', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark)),
                    const SizedBox(height: 4),
                    Text('Update your portfolio tracking.', style: TextStyle(fontSize: 14, color: context.textMuted)),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.divider),
                    ),
                    child: Icon(Icons.close, size: 16, color: context.textMuted),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: context.primary,
            unselectedLabelColor: context.textMuted,
            indicatorColor: context.primary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w700),
            padding: const EdgeInsets.symmetric(horizontal: 24),
            tabs: const [
              Tab(text: 'Manual Entry'),
              Tab(icon: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.description_outlined, size: 16), SizedBox(width: 4), Text('Import Statement')])),
              Tab(icon: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.lock_outline, size: 16), SizedBox(width: 4), Text('Link Broker')])),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildManualEntryTab(),
                _buildPlaceholderTab('Import Statement feature coming soon.'),
                _buildPlaceholderTab('Link Broker feature coming soon.'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualEntryTab() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              for (int i = 0; i < _holdings.length; i++)
                _buildHoldingForm(i),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _addNewHoldingForm,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: context.bgAlt,
                    border: Border.all(color: context.primary.withOpacity(0.5), style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add, color: context.primary, size: 20),
                      const SizedBox(width: 8),
                      Text('Add Another Holding', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border(top: BorderSide(color: context.divider)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Estimated Total', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 16)),
                  Text('₦${_estimatedTotal.toStringAsFixed(2)}', style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 24)),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Cancel', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitHoldings,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isSubmitting 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Confirm Addition', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHoldingForm(int index) {
    final form = _holdings[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('HOLDING #${index + 1}', style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
              if (_holdings.length > 1)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      form.shares.removeListener(_calculateTotal);
                      form.price.removeListener(_calculateTotal);
                      _holdings.removeAt(index);
                      _calculateTotal();
                    });
                  },
                  child: Icon(Icons.close, size: 16, color: context.textMuted),
                )
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildTickerSymbolField(form)),
              const SizedBox(width: 16),
              Expanded(child: _buildTextField('Shares', controller: form.shares, hint: '0', keyboardType: TextInputType.numberWithOptions(decimal: true))),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildTextField('Avg Price (₦)', controller: form.price, hint: '0.00', keyboardType: TextInputType.numberWithOptions(decimal: true))),
              const SizedBox(width: 16),
              Expanded(child: _buildTextField('Purchase Date', controller: form.date, hint: 'yyyy-mm-dd', suffixIcon: Icons.calendar_today_outlined)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTickerSymbolField(_HoldingFormData form) {
    return RawAutocomplete<Map<String, dynamic>>(
      textEditingController: form.symbol,
      focusNode: form.symbolFocus,
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text == '') {
          return const Iterable<Map<String, dynamic>>.empty();
        }
        final stocks = Provider.of<StockProvider>(context, listen: false).ngxStocks;
        return stocks.where((stock) {
          final symbol = stock['symbol']?.toString().toLowerCase() ?? '';
          final name = stock['name']?.toString().toLowerCase() ?? '';
          final query = textEditingValue.text.toLowerCase();
          return symbol.contains(query) || name.contains(query);
        });
      },
      displayStringForOption: (option) => option['symbol']?.toString() ?? '',
      onSelected: (Map<String, dynamic> selection) {
        form.price.text = selection['latest_price']?.toString() ?? '0.00';
        _calculateTotal();
      },
      fieldViewBuilder: (BuildContext context, TextEditingController textEditingController, FocusNode focusNode, VoidCallback onFieldSubmitted) {
        return _buildTextField(
          'Ticker Symbol',
          controller: textEditingController,
          focusNode: focusNode,
          prefixIcon: Icons.search,
          hint: 'CMFC',
        );
      },
      optionsViewBuilder: (BuildContext context, AutocompleteOnSelected<Map<String, dynamic>> onSelected, Iterable<Map<String, dynamic>> options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Material(
              elevation: 12.0,
              borderRadius: BorderRadius.circular(16),
              color: context.bg,
              shadowColor: Colors.black.withOpacity(0.5),
              clipBehavior: Clip.antiAlias,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: 260,
                  maxWidth: MediaQuery.of(context).size.width - 88,
                  minWidth: MediaQuery.of(context).size.width - 88,
                ),
                child: ListView.separated(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  itemCount: options.length,
                  separatorBuilder: (context, index) => Divider(height: 1, color: context.divider.withOpacity(0.3)),
                  itemBuilder: (BuildContext context, int index) {
                    final option = options.elementAt(index);
                    return InkWell(
                      onTap: () => onSelected(option),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                        child: Row(
                          children: [
                            CompanyAvatar(symbol: option['symbol'] ?? '', logoUrl: option['logo_url'], size: 28),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(option['symbol'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 15)),
                                  const SizedBox(height: 2),
                                  Text(option['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text('₦${option['latest_price'] ?? '0.00'}', style: TextStyle(fontWeight: FontWeight.w800, color: context.primary, fontSize: 14)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTextField(String label, {required TextEditingController controller, FocusNode? focusNode, String? hint, IconData? prefixIcon, IconData? suffixIcon, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: context.textMuted, size: 20) : null,
            suffixIcon: suffixIcon != null ? Icon(suffixIcon, color: context.textMuted, size: 20) : null,
            filled: true,
            fillColor: context.bg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.divider.withOpacity(0.5))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholderTab(String msg) {
    return Center(child: Text(msg, style: TextStyle(color: context.textMuted)));
  }
}
