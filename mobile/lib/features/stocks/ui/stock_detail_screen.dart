import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/stock_repository.dart';
import '../../profile/data/user_activity_repository.dart';
import 'ai_analysis_sheet.dart';
import 'aaoifi_screening_screen.dart';
import 'trade_bottom_sheet.dart';
import 'alert_bottom_sheet.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../../../core/api/api_service.dart';
import '../../../core/widgets/company_avatar.dart';
class StockDetailScreen extends StatefulWidget {
  final Map<String, dynamic> stock;

  const StockDetailScreen({super.key, required this.stock});

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  final _stockRepository = StockRepository();
  final _activityRepository = UserActivityRepository();
  late Map<String, dynamic> _currentStock;
  bool _isLoading = false;
  bool _isFavoriting = false;
  bool _isLoadingDetails = true; // True until full status data (incl. purification) is confirmed
  final TextEditingController _purificationController = TextEditingController();
  double _purificationResult = 0;
  bool _isAlreadyFavorited = false;
  int _selectedTab = 1;
  List<dynamic> _news = [];
  bool _isLoadingNews = true;

  double _parseDouble(dynamic val) {
    if (val == null) return 0.0;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    return num.tryParse(val.toString())?.toDouble() ?? 0.0;
  }

  @override
  void initState() {
    super.initState();
    _currentStock = widget.stock;
    _fetchNews();
    _fetchFullDetails();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final auth = Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
        if (auth) {
          _checkIfFavorited();
          _activityRepository.trackAction('check', _currentStock['symbol']);
        }
      }
    });
  }

  void _fetchNews() async {
    try {
      final response = await ApiService().get('news?symbol=${_currentStock['symbol']}');
      if (mounted) {
        setState(() {
          _news = response.data['data'] ?? [];
          _isLoadingNews = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingNews = false);
    }
  }

  void _fetchFullDetails() async {
    try {
      // Always bypass cache for the details page to ensure purification_required,
      // haram_revenue_percent and verified_by_scholar are always accurate.
      final fullData = await _stockRepository.getStockDetails(_currentStock['symbol']);
      if (fullData != null && mounted) {
        setState(() {
          // Replace status entirely from fullData (never merge shallow list status)
          _currentStock = {..._currentStock, ...fullData};
          if (fullData['status'] != null) {
            _currentStock['status'] = fullData['status'];
          }
          _isLoadingDetails = false;
        });
      } else {
        if (mounted) setState(() => _isLoadingDetails = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingDetails = false);
    }
  }

  void _checkIfFavorited() async {
    final favorites = await _activityRepository.getFavorites();
    if (mounted) {
      setState(() {
        _isAlreadyFavorited = favorites.any((f) => f['reference_id'] == _currentStock['id'].toString() || f['reference_id'] == _currentStock['id']);
      });
    }
  }

  void _onFavorite() async {
    setState(() => _isFavoriting = true);
    final success = await _activityRepository.addToFavorites('stock', _currentStock['id']);
    if (success) {
      if (mounted) {
        setState(() => _isAlreadyFavorited = true);
        Provider.of<AppStateProvider>(context, listen: false).incrementWatchlist();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Added to watchlist'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: context.textDark,
          ),
        );
      }
    }
    setState(() => _isFavoriting = false);
  }

  void _runScreening() async {
    setState(() => _isLoading = true);
    try {
      final updatedStock = await _stockRepository.checkStock(_currentStock['symbol']);
      if (updatedStock != null) {
        setState(() => _currentStock = updatedStock);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: context.haram, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _calculatePurification(String value, double nonCompliantRevenuePercent) {
    if (value.isEmpty) {
      setState(() => _purificationResult = 0);
      return;
    }
    final amount = double.tryParse(value) ?? 0;
    setState(() {
      _purificationResult = amount * (nonCompliantRevenuePercent / 100);
    });
  }

  @override
  Widget build(BuildContext context) {
    final rawStatus = _currentStock['status'];
    String status = 'doubtful';
    String reason = 'This stock is currently under review or lacks sufficient data for a definitive Shariah ruling.';
    bool isScholarVerified = false;

    if (rawStatus is Map) {
      status = rawStatus['status']?.toString().toLowerCase() ?? 'doubtful';
      isScholarVerified = rawStatus['verified_by_scholar'] == true;
      if (status == 'non-halal') {
        reason = rawStatus['reason'] ?? 'The core business operations involve non-compliant activities.';
      } else if (status == 'doubtful') {
        reason = rawStatus['reason'] ?? 'This stock is currently under review or lacks sufficient data for a definitive Shariah ruling.';
      } else {
        status = 'halal';
        reason = rawStatus['reason'] ?? 'The core business operations of this company have been verified to be in a Halal industry, with no significant involvement in prohibited activities like conventional finance, alcohol, gambling, or tobacco.';
      }
    } else if (rawStatus is String) {
      if (rawStatus.toLowerCase() == 'non-halal') {
        status = 'non-halal';
        reason = 'Automated business activity analysis.';
      } else if (rawStatus.toLowerCase() == 'doubtful') {
        status = 'doubtful';
        reason = 'This stock is currently under review or lacks sufficient data for a definitive Shariah ruling.';
      } else {
        status = 'halal';
      }
    }

    // NOTE: We do NOT recalculate/override the verdict locally from financial ratios.
    // The backend is the single source of truth for verdicts — especially for scholar-verified statuses.
    // Financial data below is used only for the AAOIFI breakdown display panel, never to change the verdict.

    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);
    
    bool purificationRequired = false;
    double haramRevenuePercent = 0.0;
    if (rawStatus is Map) {
      purificationRequired = rawStatus['purification_required'] == true || rawStatus['purification_required'] == 'true';
      haramRevenuePercent = double.tryParse(rawStatus['haram_revenue_percent']?.toString() ?? '0') ?? 0.0;
    }

    String statusLabel = 'DOUBTFUL';
    if (_isLoadingDetails) {
      // Don't commit to purification label until full details confirmed
      statusLabel = isHalal ? 'SHARIAH COMPLIANT' : (isNonHalal ? 'SHARIAH NON-COMPLIANT' : 'DOUBTFUL');
    } else if (isHalal) {
      statusLabel = 'SHARIAH COMPLIANT';
    } else if (isNonHalal) {
      statusLabel = 'SHARIAH NON-COMPLIANT';
    }

    final financials = _currentStock['financials'];
    final latestFin = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    final hasFinancialHighlights = latestFin != null && (
      _parseDouble(latestFin['total_assets']) > 0 ||
      _parseDouble(latestFin['total_debt']) > 0 ||
      _parseDouble(latestFin['total_revenue']) > 0 ||
      _parseDouble(latestFin['interest_income']) > 0
    );

    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CompanyAvatar(
                logoUrl: _currentStock['logo_url'],
                symbol: _currentStock['symbol'] ?? 'S',
                size: 28,
                borderRadius: 6,
                fontSize: 12,
              ),
            ),
            Text(_currentStock['symbol'], style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
          ],
        ),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_active_outlined, color: context.textDark, size: 22),
            onPressed: () => AlertBottomSheet.show(context, _currentStock),
          ),
          IconButton(
            icon: Icon(_isAlreadyFavorited ? Icons.favorite_rounded : Icons.favorite_outline_rounded, 
              color: _isAlreadyFavorited ? context.haram : context.textDark, size: 22),
            onPressed: _isAlreadyFavorited ? null : (_isFavoriting ? null : _onFavorite),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: BoxDecoration(
          color: context.bgAlt,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text('PRICE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted)),
                   const SizedBox(height: 4),
                   Text('₦ ${latestPrice.toStringAsFixed(2)}', 
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark)),
                   if (_currentStock.containsKey('price_change_pct'))
                     Padding(
                       padding: const EdgeInsets.only(top: 2),
                       child: Text(
                         '${(double.tryParse(_currentStock['price_change_pct']?.toString() ?? '0') ?? 0.0) >= 0 ? '+' : ''}${_currentStock['price_change_pct']}%',
                         style: TextStyle(
                           fontSize: 12, 
                           fontWeight: FontWeight.w700, 
                           color: (double.tryParse(_currentStock['price_change_pct']?.toString() ?? '0') ?? 0.0) >= 0 ? context.primary : context.haram
                         )
                       ),
                     )
                ],
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Coming Soon: Live brokerage integration is under development.'),
                        backgroundColor: context.primary,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)), // Pill
                    elevation: 0,
                  ),
                  child: const Text('Buy Now', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status Header
            _buildStatusHeader(statusColor, badgeBg, statusLabel, 
              purificationRequired: !_isLoadingDetails && purificationRequired, 
              percent: haramRevenuePercent, 
              scholarVerified: isScholarVerified),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),

                  // About Company
                  if (_currentStock['overview'] != null && _currentStock['overview'].toString().trim().isNotEmpty) ...[
                    _buildSectionHeader('About Company'),
                    const SizedBox(height: 12),
                    _buildAboutCompany(),
                    const SizedBox(height: 32),
                  ],

                  if (_selectedTab == 0) ...[
                    const SizedBox(height: 16),
                    _buildDetailedOverview(),
                    _buildCompanyInfo(),
                  ],
                  
                  if (_selectedTab == 1) ...[
                    const SizedBox(height: 24),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: statusColor.withOpacity(0.6), width: 1.5),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              statusLabel.contains('COMPLIANT') && !statusLabel.contains('NON') ? Icons.verified_rounded :
                              statusLabel.contains('NON-COMPLIANT') ? Icons.cancel_rounded : Icons.help_rounded,
                              color: statusColor,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              statusLabel,
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 0.3),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                      _buildSectionHeader('Shariah Compliance Dashboard'),
                      const SizedBox(height: 12),
                      _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                      const SizedBox(height: 32),
                    ],
                  ],
                  
                  if (_selectedTab == 2) ...[
                    const SizedBox(height: 32),
                    Center(
                      child: Text('Performance data & Historical metrics', style: TextStyle(color: context.textMuted)),
                    ),
                  ],


                  // Advanced Metrics (SWS)
                  _buildAdvancedMetrics(),
                  
                  // Analyst Rating
                  _buildAnalystRating(),

                  // AI Halal Assistant Button
                  _buildAiAssistantButton(),
                  const SizedBox(height: 32),

                  // Purification
                  if ((_currentStock['financials'] ?? []).isNotEmpty && isHalal) ...[
                    _buildPurificationCard(),
                    const SizedBox(height: 48),
                  ],
                  
                  // Action Button
                  _buildScreeningButton(statusColor),
                  const SizedBox(height: 24),
                  
                  // News Section
                  if (_selectedTab == 3 && (_isLoadingNews || _news.isNotEmpty)) ...[
                    _buildSectionHeader('Latest News'),
                    const SizedBox(height: 12),
                    _buildNewsSection(),
                    const SizedBox(height: 32),
                  ],

                  // Company Profile
                  _buildCompanyProfile(),

                  // Scholar/Admin Override Button
                  _buildAdminOverrideButton(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminOverrideButton() {
    final user = Provider.of<AppStateProvider>(context).userProfile;
    final role = user?['role'] ?? 'user';
    if (role != 'admin' && role != 'scholar') {
      return const SizedBox.shrink();
    }
    
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        onPressed: () => _showAdminOverrideDialog(),
        icon: const Icon(Icons.admin_panel_settings_rounded, size: 18, color: Colors.orange),
        label: const Text('SCHOLAR OVERRIDE', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.orange, letterSpacing: 0.5)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.orange, width: 2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        ),
      ),
    );
  }

  void _showAdminOverrideDialog() {
    String selectedStatus = 'halal';
    final reasonController = TextEditingController();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Container(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Override Compliance Status', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark)),
                  const SizedBox(height: 8),
                  Text('Update the status manually as a scholar or admin.', style: TextStyle(color: context.textMuted)),
                  const SizedBox(height: 24),
                  
                  Text('Status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: selectedStatus,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: context.bg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'halal', child: Text('Halal')),
                      DropdownMenuItem(value: 'doubtful', child: Text('Doubtful')),
                      DropdownMenuItem(value: 'non-halal', child: Text('Non-Halal')),
                    ],
                    onChanged: (v) => setModalState(() => selectedStatus = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  Text('Reason', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: reasonController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Explanation for override...',
                      filled: true,
                      fillColor: context.bg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (reasonController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a reason')));
                          return;
                        }
                        
                        Navigator.pop(ctx);
                        setState(() => _isLoading = true);
                        try {
                          final updated = await _stockRepository.updateStockStatus(
                            _currentStock['symbol'], 
                            selectedStatus, 
                            reasonController.text.trim()
                          );
                          if (updated != null && mounted) {
                            setState(() => _currentStock = updated);
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status overridden successfully')));
                          }
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: context.haram));
                        } finally {
                          if (mounted) setState(() => _isLoading = false);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: const Text('Confirm Override', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  )
                ],
              ),
            ),
          );
        }
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 4,
          height: 12,
          decoration: BoxDecoration(
            color: context.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1),
        ),
      ],
    );
  }


  Widget _buildTabItem(int index, String title) {
    bool isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.only(bottom: 6),
        decoration: isSelected 
            ? BoxDecoration(border: Border(bottom: BorderSide(color: context.textDark, width: 2)))
            : null,
        child: Text(
          title, 
          style: TextStyle(
            color: isSelected ? context.textDark : context.textMuted, 
            fontSize: 13, 
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700
          ),
        ),
      ),
    );
  }
  Widget _buildStatusHeader(Color color, Color bg, String label, {bool purificationRequired = false, double percent = 0.0, bool scholarVerified = false}) {
    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;
    final priceChange = _currentStock['price_change_pct'] != null ? double.tryParse(_currentStock['price_change_pct'].toString()) : null;
    final isUp = (priceChange ?? 0) >= 0;
    
    final absChangeStr = _currentStock['price_change']?.toString() ?? '0.00';
    final pctChangeStr = priceChange?.toStringAsFixed(2) ?? '0.00';

    String mainLabel = label;
    if (purificationRequired) {
      mainLabel = 'SHARIAH COMPLIANT';
    }

    return Container(
      width: double.infinity,
      color: context.bg,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_currentStock['symbol'] ?? '', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                  const SizedBox(height: 2),
                  Text(_currentStock['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₦${latestPrice.toStringAsFixed(2)}', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                  const SizedBox(height: 2),
                  Text(
                    '${isUp ? '+' : '-'}₦$absChangeStr (${isUp ? '+' : ''}$pctChangeStr%)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: isUp ? context.halal : context.haram,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          if ((_currentStock['daily_prices'] ?? []).isNotEmpty && (_currentStock['daily_prices'] as List).any((p) => (double.tryParse(p['price']?.toString() ?? '0') ?? 0) > 0))
            _buildPriceChart(),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTabItem(0, 'Summary'),
              _buildTabItem(1, 'Shariah'),
              _buildTabItem(2, 'Performance'),
              _buildTabItem(3, 'News'),
            ],
          ),

        ],
      ),
    );
  }


  Widget _buildPriceChart() {
    List<dynamic> pricesRaw = _currentStock['daily_prices'] ?? [];
    
    if (pricesRaw.length < 2) {
      return Container(
        height: 220,
        margin: const EdgeInsets.only(top: 24, bottom: 12),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(24),
        ),
        alignment: Alignment.center,
        child: Text(
          'Not enough historical data',
          style: TextStyle(color: context.textMuted, fontSize: 14, fontWeight: FontWeight.w600),
        ),
      );
    }

    List<FlSpot> spots = [];
    List<dynamic> reversedPrices = pricesRaw.reversed.toList();
    for (int i = 0; i < reversedPrices.length; i++) {
      double price = double.tryParse(reversedPrices[i]['price'].toString()) ?? 0;
      spots.add(FlSpot(i.toDouble(), price));
    }

    // Determine Y axis range
    double minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
    double maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    minY = (minY * 0.9).floorToDouble();
    maxY = (maxY * 1.1).ceilToDouble();

    return Container(
      height: 220,
      padding: const EdgeInsets.only(right: 16, left: 0, top: 24, bottom: 12),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
      ),
      child: LineChart(
        LineChartData(
          minX: 0,
          maxX: (spots.length - 1).toDouble(),
          minY: minY,
          maxY: maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: (maxY - minY) / 4 > 0 ? (maxY - minY) / 4 : 1,
            getDrawingHorizontalLine: (value) {
              return FlLine(color: context.divider.withValues(alpha: 0.5), strokeWidth: 1, dashArray: [4, 4]);
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: (maxY - minY) / 4 > 0 ? (maxY - minY) / 4 : 1,
                reservedSize: 42,
                getTitlesWidget: (value, meta) {
                  return Text(value.toInt().toString(), style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w600));
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: context.primary,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    context.primary.withValues(alpha: 0.2),
                    context.primary.withValues(alpha: 0.0),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
             touchTooltipData: LineTouchTooltipData(
               getTooltipColor: (touchedSpot) => context.textDark,
               getTooltipItems: (touchedSpots) {
                 return touchedSpots.map((LineBarSpot touchedSpot) {
                   return LineTooltipItem(
                     '₦ ${touchedSpot.y.toStringAsFixed(2)}',
                     TextStyle(color: context.bg, fontWeight: FontWeight.bold),
                   );
                 }).toList();
               },
             ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailedOverview() {
    final sector = _currentStock['sector'] ?? 'Unknown';
    final industry = _currentStock['industry'] ?? 'Unknown';
    final analystTarget = _currentStock['analysts_target'] != null ? '₦ ${_currentStock['analysts_target']}' : 'N/A';
    
    Widget buildRow(String label, String value, {bool isVerified = false}) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
            Row(
              children: [
                if (isVerified) const Icon(Icons.verified, color: Colors.blue, size: 16),
                if (isVerified) const SizedBox(width: 4),
                Text(value, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Overview'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              buildRow('Sector', sector),
              buildRow('Industry', industry),
              buildRow('Exchange', 'Stock Exchange'),
              buildRow('Analyst Target', analystTarget),
              buildRow('SEC Registration', 'Verified', isVerified: true),
            ],
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildCompanyProfile() {
    final address = _currentStock['address'] ?? 'N/A';
    final phone = _currentStock['phone'] ?? 'N/A';
    final website = _currentStock['website'] ?? 'N/A';
    
    if (address == 'N/A' && phone == 'N/A' && website == 'N/A') return const SizedBox.shrink();

    Widget buildRow(IconData icon, String value) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: context.textMuted, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(value, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Company Profile'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              if (address != 'N/A') buildRow(Icons.location_on_outlined, address),
              if (phone != 'N/A') buildRow(Icons.phone_outlined, phone),
              if (website != 'N/A') buildRow(Icons.language_outlined, website),
            ],
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildAnalystRating() {
    final rating = _currentStock['analysts_rating'] ?? 'N/A';
    if (rating == 'N/A') return const SizedBox.shrink();
    
    Color ratingColor;
    IconData ratingIcon;
    if (rating.toLowerCase().contains('buy') || rating.toLowerCase().contains('strong buy')) {
      ratingColor = context.halal;
      ratingIcon = Icons.thumb_up_rounded;
    } else if (rating.toLowerCase().contains('sell')) {
      ratingColor = context.haram;
      ratingIcon = Icons.thumb_down_rounded;
    } else {
      ratingColor = context.questionable;
      ratingIcon = Icons.drag_handle_rounded;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Analysts Rating'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          width: double.infinity,
          decoration: BoxDecoration(
            color: ratingColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ratingColor.withValues(alpha: 0.25)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: ratingColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(ratingIcon, color: ratingColor, size: 24),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CONSENSUS', style: TextStyle(color: ratingColor.withValues(alpha: 0.7), fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                  const SizedBox(height: 4),
                  Text(rating.toUpperCase(), style: TextStyle(color: ratingColor, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildCompanyInfo() {
    String formatAmt(double amt) {
      if (amt == 0) return '0';
      String s = amt.toStringAsFixed(0);
      return s.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }

    final mcap = _currentStock['market_cap'] != null ? double.tryParse(_currentStock['market_cap'].toString()) ?? 0.0 : 0.0;
    final pe = _currentStock['pe_ratio']?.toString() ?? '—';
    final divYield = _currentStock['div_yield'] != null ? '${_currentStock['div_yield']}%' : '—';
    final roe = _currentStock['roe']?.toString() ?? '—';

    String formatMcap(double amt) {
      if (amt == 0) return '—';
      if (amt >= 1e12) return '₦${(amt / 1e12).toStringAsFixed(2)}T';
      if (amt >= 1e9) return '₦${(amt / 1e9).toStringAsFixed(2)}B';
      if (amt >= 1e6) return '₦${(amt / 1e6).toStringAsFixed(2)}M';
      return '₦${amt.toStringAsFixed(0)}';
    }

    List<Widget> availableMetrics = [];
    if (mcap > 0) availableMetrics.add(_buildMetricCard('MARKET CAP', formatMcap(mcap), icon: Icons.pie_chart_outline_rounded));
    if (pe != '—') availableMetrics.add(_buildMetricCard('P/E RATIO', pe, icon: Icons.bar_chart_rounded));
    if (divYield != '—') availableMetrics.add(_buildMetricCard('DIV. YIELD', divYield, icon: Icons.savings_outlined));
    if (roe != '—') availableMetrics.add(_buildMetricCard('ROE', roe != '—' && !roe.contains('%') ? '$roe%' : roe, icon: Icons.show_chart_rounded));

    if (availableMetrics.isEmpty) return const SizedBox.shrink();

    List<Widget> rows = [];
    for (int i = 0; i < availableMetrics.length; i += 2) {
      rows.add(
        Row(
          children: [
            Expanded(child: availableMetrics[i]),
            if (i + 1 < availableMetrics.length) ...[
              const SizedBox(width: 12),
              Expanded(child: availableMetrics[i + 1]),
            ] else ...[
              const SizedBox(width: 12),
              const Spacer(),
            ],
          ],
        ),
      );
      if (i + 2 < availableMetrics.length) {
        rows.add(const SizedBox(height: 12));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(children: rows),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildAdvancedMetrics() {
    final valuation = _currentStock['valuation_info'] ?? 'N/A';
    final growth = _currentStock['growth_info'] ?? 'N/A';
    
    if (valuation == 'N/A' && growth == 'N/A') return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Advanced Metrics'),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMetricCard('VALUATION', valuation, icon: Icons.analytics_outlined)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('GROWTH FORECAST', growth, icon: Icons.rocket_launch_outlined)),
          ],
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildNewsSection() {
    if (_isLoadingNews) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        child: CircularProgressIndicator(color: context.primary),
      );
    }
    
    if (_news.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(Icons.article_outlined, color: context.textMuted, size: 32),
            SizedBox(height: 12),
            Text('No recent news found for this stock.', style: TextStyle(color: context.textMuted)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _news.length,
          separatorBuilder: (ctx, i) => Divider(color: context.divider, height: 1, indent: 16, endIndent: 16),
          itemBuilder: (ctx, i) {
            final article = _news[i];
            final date = DateTime.tryParse(article['published_at'] ?? '');
            final now = DateTime.now();
            String dateStr;
            if (date != null) {
              final diff = now.difference(date);
              if (diff.inHours < 24) dateStr = '${diff.inHours}h ago';
              else if (diff.inDays < 7) dateStr = '${diff.inDays}d ago';
              else dateStr = '${date.day}/${date.month}/${date.year}';
            } else {
              dateStr = 'Recent';
            }

            return InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: context.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  article['source']?.toUpperCase() ?? 'NEWS',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.primary),
                                ),
                              ),
                              const Spacer(),
                              Text(dateStr, style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w500)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            article['title'] ?? '',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark, height: 1.4),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.textMuted),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }



  Widget _buildMetricCard(String label, String value, {IconData? icon, Color? valueColor}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 13, color: context.textMuted),
                const SizedBox(width: 5),
              ],
              Expanded(
                child: Text(label, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5), maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: valueColor ?? context.textDark, fontSize: 15, fontWeight: FontWeight.w800), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }


  Widget _buildComplianceDashboard(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    final debtRatio = latest != null && latest['interest_bearing_debt_ratio'] != null 
        ? (double.tryParse(latest['interest_bearing_debt_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    final interestRatio = latest != null && latest['interest_income_ratio'] != null 
        ? (double.tryParse(latest['interest_income_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    final cashRatio = latest != null && latest['cash_and_equivalents_ratio'] != null 
        ? (double.tryParse(latest['cash_and_equivalents_ratio'].toString()) ?? 0.0)
        : 0.0;
        
    Widget buildGauge(String title, double value, double limit) {
      bool isPass = value <= limit;
      Color gaugeColor = isPass ? context.halal : context.haram;
      double percentage = value / limit;
      if (percentage > 1.0) percentage = 1.0;
      if (percentage < 0.0) percentage = 0.0;
      
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.divider.withOpacity(0.5)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 70,
                width: 70,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      value: 1.0,
                      backgroundColor: Colors.transparent,
                      color: context.divider.withOpacity(0.2),
                      strokeWidth: 6,
                    ),
                    CircularProgressIndicator(
                      value: percentage,
                      backgroundColor: Colors.transparent,
                      color: gaugeColor,
                      strokeWidth: 6,
                      strokeCap: StrokeCap.round,
                    ),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('${value.toStringAsFixed(1)}%', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 13)),
                          Text('<${limit.toStringAsFixed(0)}%', style: TextStyle(color: context.textMuted, fontSize: 9, fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(title, style: TextStyle(color: context.textMuted, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isPass ? context.halalBg : context.haramBg,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  isPass ? 'PASS' : 'FAIL',
                  style: TextStyle(color: isPass ? context.halal : context.haram, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildGauge('DEBT', debtRatio, 30.0),
            const SizedBox(width: 12),
            buildGauge('CASH', cashRatio, 30.0),
            const SizedBox(width: 12),
            buildGauge('INCOME', interestRatio, 5.0),
          ],
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: statusColor.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.feed_outlined, color: statusColor, size: 20),
                  const SizedBox(width: 8),
                  Text('Compliance Justification', style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w900)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                reason,
                style: TextStyle(color: context.textDark.withOpacity(0.8), fontSize: 13, height: 1.6, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ],
    );
  }


  Widget _buildAaoifiProgressBar(double value, double limit, bool isFail) {
    final progress = (value / (limit * 1.5)).clamp(0.0, 1.0);
    return Stack(
      children: [
        Container(
          height: 8,
          width: double.infinity,
          decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(4)),
        ),
        Container(
          height: 8,
          width: (MediaQuery.of(context).size.width - 88) * progress,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isFail ? [Colors.redAccent, context.haram] : [Colors.greenAccent, context.halal],
            ),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ],
    );
  }

  Widget _buildPurificationCard() {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    final nonCompliantRev = latest != null && latest['non_compliant_income_ratio'] != null 
        ? _parseDouble(latest['non_compliant_income_ratio']) 
        : 0.0; 
    final interestRatio = latest != null && latest['interest_income_ratio'] != null 
        ? _parseDouble(latest['interest_income_ratio']) 
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgAlt, 
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.volunteer_activism_rounded, color: context.primary, size: 20),
              const SizedBox(width: 10),
              Text('Purification (Zakat al-Mustaghalat)', 
                style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          Text('Received non-halal dividends from this stock? Calculate your purification due.', 
            style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.4)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Non-Halal Revenue', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${nonCompliantRev.toStringAsFixed(2)}%', style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Interest Income Ratio', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${interestRatio.toStringAsFixed(2)}%', style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _purificationController,
            keyboardType: TextInputType.number,
            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              hintText: 'Dividend amount...',
              hintStyle: TextStyle(color: context.textDisabled, fontWeight: FontWeight.w400),
              filled: true,
              fillColor: context.bg,
              prefixText: '₦ ',
              prefixStyle: TextStyle(color: context.primary, fontWeight: FontWeight.w800),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide(color: context.divider)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide(color: context.primary, width: 2)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            ),
            onChanged: (v) => _calculatePurification(v, nonCompliantRev),
          ),
          if (_purificationResult > 0) ...[
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: context.divider)),
              child: Column(
                children: [
                  Text('PURIFICATION AMOUNT', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text('₦ ${_purificationResult.toStringAsFixed(2)}', 
                    style: TextStyle(color: context.primary, fontSize: 32, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text('Purification rate: $nonCompliantRev%', 
                    style: TextStyle(color: context.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAiAssistantButton() {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(100),
        gradient: LinearGradient(
          colors: [Colors.blue.withValues(alpha: 0.15), Colors.purple.withValues(alpha: 0.15)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: ElevatedButton(
        onPressed: () => AiAnalysisSheet.show(context, _currentStock['symbol']),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.blue,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('✨', style: TextStyle(fontSize: 18)),
            SizedBox(width: 8),
            Text('Ask Irshad', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: context.textDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildScreeningButton(Color color) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AaoifiScreeningScreen(stock: _currentStock),
            ),
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: context.bgAlt,
          foregroundColor: context.textDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
          elevation: 0,
        ),
        child: const Text('VIEW AAOIFI REPORT', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      ),
    );
  }

  Widget _buildAboutCompany() {
    final sector = _currentStock['sector'] ?? 'Unknown';
    final name = _currentStock['name'] ?? 'This company';
    final overview = _currentStock['overview'] ?? '$name operates within the $sector sector. Its primary business activities include the production, provision, and distribution of goods and services specific to the $sector industry. As a publicly traded entity on the Nigerian Exchange, it focuses on delivering sustainable value to its stakeholders.';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.business_rounded, color: context.primary.withValues(alpha: 0.7), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              overview,
              style: TextStyle(color: context.textDark, height: 1.6, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _purificationController.dispose();
    super.dispose();
  }
}
