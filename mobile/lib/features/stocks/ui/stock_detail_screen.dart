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
  final TextEditingController _purificationController = TextEditingController();
  double _purificationResult = 0;
  bool _isAlreadyFavorited = false;
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
      final fullData = await _stockRepository.getStockDetails(_currentStock['symbol']);
      if (fullData != null && mounted) {
        setState(() {
          _currentStock = {..._currentStock, ...fullData};
        });
      }
    } catch (e) {
      // ignore silently
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
    String status = 'halal';
    String reason = 'The core business operations of this company have been verified to be in a Halal industry, with no significant involvement in prohibited activities like conventional finance, alcohol, gambling, or tobacco.';

    if (rawStatus is Map) {
      status = rawStatus['status']?.toString().toLowerCase() ?? 'halal';
      if (status == 'non-halal') {
        reason = rawStatus['reason'] ?? 'The core business operations involve non-compliant activities.';
      } else {
        status = 'halal';
        reason = rawStatus['reason'] ?? reason;
      }
    } else if (rawStatus is String) {
      if (rawStatus.toLowerCase() == 'non-halal') {
        status = 'non-halal';
        reason = 'Automated business activity analysis.';
      } else {
        status = 'halal';
      }
    }
    
    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);
    String statusLabel = isHalal ? 'SHARIAH COMPLIANT' : (isNonHalal ? 'NOT COMPLIANT' : 'QUESTIONABLE');

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
            _buildStatusHeader(statusColor, badgeBg, statusLabel),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  // Price Chart
                  if ((_currentStock['daily_prices'] ?? []).isNotEmpty) ...[
                    _buildPriceChart(),
                    const SizedBox(height: 32),
                  ],

                  // About Company
                  if (_currentStock['overview'] != null && _currentStock['overview'].toString().trim().isNotEmpty) ...[
                    _buildSectionHeader('About Company'),
                    const SizedBox(height: 12),
                    _buildAboutCompany(),
                    const SizedBox(height: 32),
                  ],

                  // Company Metadata
                  _buildCompanyInfo(),
                  
                  // AAOIFI Screening Breakdown
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('AAOIFI Screening Breakdown'),
                    const SizedBox(height: 12),
                    _buildAaoifiBreakdown(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],

                  // Financial Highlights
                  if (hasFinancialHighlights) ...[
                    _buildSectionHeader('Financial Highlights'),
                    const SizedBox(height: 12),
                    _buildFinancialHighlights(),
                    const SizedBox(height: 32),
                  ],

                  // Advanced Metrics (SWS)
                  _buildAdvancedMetrics(),

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
                  if (_isLoadingNews || _news.isNotEmpty) ...[
                    _buildSectionHeader('Latest News'),
                    const SizedBox(height: 12),
                    _buildNewsSection(),
                    const SizedBox(height: 32),
                  ],

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
    return Text(
      title.toUpperCase(),
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1),
    );
  }

  Widget _buildStatusHeader(Color color, Color bg, String label) {
    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;
    final priceChange = _currentStock['price_change_pct'] != null ? double.tryParse(_currentStock['price_change_pct'].toString()) : null;

    return Container(
      width: double.infinity,
      color: context.bg,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(_currentStock['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('₦${latestPrice.toStringAsFixed(2)}', style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1)),
          if (priceChange != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '${priceChange >= 0 ? '+' : ''}$priceChange%',
                style: TextStyle(
                  fontSize: 16, 
                  fontWeight: FontWeight.w700, 
                  color: priceChange >= 0 ? context.primary : context.haram
                )
              ),
            ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(100), // Pill badge
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  label == 'SHARIAH COMPLIANT' ? Icons.check_circle_rounded : 
                  label == 'NOT COMPLIANT' ? Icons.cancel_rounded : Icons.help_rounded,
                  color: color, 
                  size: 16
                ),
                const SizedBox(width: 8),
                Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color, letterSpacing: 0.5)),
              ],
            ),
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

    List<Widget> availableMetrics = [];
    if (mcap > 0) availableMetrics.add(_buildMetricCard('MARKET CAP', '₦ ${formatAmt(mcap)}'));
    if (pe != '—') availableMetrics.add(_buildMetricCard('P/E RATIO', pe));
    if (divYield != '—') availableMetrics.add(_buildMetricCard('DIVIDEND YIELD', divYield));
    if (roe != '—') availableMetrics.add(_buildMetricCard('ROE', roe != '—' && !roe.contains('%') ? '$roe%' : roe));

    if (availableMetrics.isEmpty) return const SizedBox.shrink();

    List<Widget> rows = [];
    for (int i = 0; i < availableMetrics.length; i += 2) {
      rows.add(
        Row(
          children: [
            Expanded(child: availableMetrics[i]),
            if (i + 1 < availableMetrics.length) ...[
              const SizedBox(width: 16),
              Expanded(child: availableMetrics[i + 1]),
            ] else ...[
              const SizedBox(width: 16),
              const Spacer(),
            ],
          ],
        ),
      );
      if (i + 2 < availableMetrics.length) {
        rows.add(const SizedBox(height: 16));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Overview'),
        const SizedBox(height: 12),
        Column(children: rows),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildAdvancedMetrics() {
    final valuation = _currentStock['valuation_info'] ?? 'N/A';
    final growth = _currentStock['growth_info'] ?? 'N/A';
    
    Widget buildCard(String title, String value) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w700)),
          ],
        ),
      );
    }
    
    List<Widget> cards = [];
    cards.add(Expanded(child: buildCard('VALUATION', valuation)));
    cards.add(Expanded(child: buildCard('GROWTH FORECAST', growth)));

    Widget metricsRow = Row(children: [cards[0], const SizedBox(width: 16), cards[1]]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Advanced Metrics'),
        const SizedBox(height: 12),
        metricsRow,
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
        borderRadius: BorderRadius.circular(24),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _news.length,
          separatorBuilder: (ctx, i) => Divider(color: context.divider, height: 1, indent: 16, endIndent: 16),
        itemBuilder: (ctx, i) {
          final article = _news[i];
          final date = DateTime.tryParse(article['published_at'] ?? '');
          final dateStr = date != null ? '${date.day}/${date.month}/${date.year}' : 'Recent';
          
          return InkWell(
            onTap: () {
              // Open URL logic could go here
            },
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(article['source']?.toUpperCase() ?? 'NEWS', 
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.primary)),
                      ),
                      Text(dateStr, style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(article['title'] ?? '', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark, height: 1.4)),
                  if (article['excerpt'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(article['excerpt'], maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
                    ),
                ],
              ),
            ),
          );
        },
      ),
      ),
    );
  }



  Widget _buildMetricCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildFinancialHighlights() {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    final assets = _parseDouble(latest?['total_assets']);
    final debt = _parseDouble(latest?['total_debt']);
    final revenue = _parseDouble(latest?['total_revenue']);
    final interest = _parseDouble(latest?['interest_income']);

    String formatAmt(double amt) {
      if (amt == 0) return '0';
      String s = amt.toStringAsFixed(0);
      return s.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('TOTAL ASSETS', assets > 0 ? '₦ ${formatAmt(assets)}' : 'N/A')),
            const SizedBox(width: 16),
            Expanded(child: _buildMetricCard('TOTAL DEBT', debt > 0 ? '₦ ${formatAmt(debt)}' : '0')),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildMetricCard('TOTAL REVENUE', revenue > 0 ? '₦ ${formatAmt(revenue)}' : 'N/A')),
            const SizedBox(width: 16),
            Expanded(child: _buildMetricCard('INTEREST INCOME', interest > 0 ? '₦ ${formatAmt(interest)}' : '0')),
          ],
        ),
      ],
    );
  }

  Widget _buildAaoifiBreakdown(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    
    final debt = _parseDouble(latest?['total_debt']);
    final marketCap = _parseDouble(latest?['market_cap']);
    final safeMarketCap = marketCap > 0 ? marketCap : 1.0;
    
    final interest = _parseDouble(latest?['interest_income']);
    final rawRevenue = _parseDouble(latest?['total_revenue']);
    final revenue = rawRevenue > 0.0 ? rawRevenue : safeMarketCap;
    
    final cashAndEquivalents = _parseDouble(latest?['cash_and_equivalents']);
    final interestBearingSecurities = _parseDouble(latest?['interest_bearing_securities']);
    final cash = cashAndEquivalents + interestBearingSecurities;

    final debtRatio = marketCap > 0 ? (debt / marketCap) * 100 : 0.0;
    final interestRatio = revenue > 0 ? (interest / revenue) * 100 : 0.0;
    final cashRatio = marketCap > 0 ? (cash / marketCap) * 100 : 0.0;

    String formatAmt(double amt) {
      if (amt == 0) return '0';
      String s = amt.toStringAsFixed(0);
      return s.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }

    final rawDebtFail = debtRatio > 30.0;
    final rawInterestFail = interestRatio > 5.0;
    final rawCashFail = cashRatio > 30.0;

    final lowerReason = reason.toLowerCase();
    final isDebtFail = rawDebtFail || lowerReason.contains('rule 2') || lowerReason.contains('debt limit');
    final isInterestFail = rawInterestFail || lowerReason.contains('rule 4') || lowerReason.contains('interest income');
    final isCashFail = rawCashFail || lowerReason.contains('rule 3') || lowerReason.contains('cash & securities');

    final isBusinessFail = lowerReason.contains('rule 1') ||
        lowerReason.contains('business activity') ||
        lowerReason.contains('sector check') ||
        lowerReason.contains('prohibited') ||
        lowerReason.contains('banking') ||
        lowerReason.contains('financial business') ||
        lowerReason.contains('alcohol') ||
        (isNonHalal && !isDebtFail && !isInterestFail && !isCashFail);

    Widget buildCalculationCard(String numLabel, String denLabel, String numVal, String denVal) {
      return Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: context.bg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orangeAccent.withValues(alpha: 0.3)),
            ),
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            child: Column(
              children: [
                Text('CALCULATION', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                const SizedBox(height: 16),
                Text(numLabel, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Container(height: 1, width: 200, color: context.divider),
                const SizedBox(height: 8),
                Text(denLabel, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(numLabel, style: TextStyle(color: context.textMuted, fontSize: 13)),
              Text('₦$numVal', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: context.divider, height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(denLabel, style: TextStyle(color: context.textMuted, fontSize: 13)),
              Text('₦$denVal', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        ],
      );
    }

    final nonCompliantRev = latest != null && latest['non_compliant_income_ratio'] != null 
        ? _parseDouble(latest['non_compliant_income_ratio']) 
        : (isNonHalal ? 100.0 : 0.0);
    final compliantRev = 100.0 - nonCompliantRev;

    Widget buildSegmentStat(String title, double val, Color color) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 4, height: 32, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text('${val.toStringAsFixed(2)}%', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 14)),
            ],
          ),
        ],
      );
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(Icons.shield_rounded, color: Colors.orangeAccent, size: 22),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'AAOIFI Screening Breakdown',
                          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeBg.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: badgeBg.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isHalal ? Icons.check_circle : (isNonHalal ? Icons.cancel : Icons.info), color: statusColor, size: 12),
                      const SizedBox(width: 4),
                      Text(isHalal ? '100% COMPLIANT' : (isNonHalal ? 'NON-COMPLIANT' : 'UNDER REVIEW'), 
                        style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(color: context.divider, height: 1),

          // A. Business Activity
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('A. Business Activity', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 15)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isBusinessFail ? context.haram.withValues(alpha: 0.15) : context.halal.withValues(alpha: 0.15), 
                        borderRadius: BorderRadius.circular(20)
                      ),
                      child: Text(isBusinessFail ? 'FAIL' : 'PASS', 
                        style: TextStyle(
                          color: isBusinessFail ? context.haram : context.halal, 
                          fontSize: 10, 
                          fontWeight: FontWeight.w900
                        )
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  isBusinessFail
                      ? reason
                      : "The core business operations of this company have been verified to be in a Halal industry, with no significant involvement in prohibited activities like conventional finance, alcohol, gambling, or tobacco.",
                  style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
          Divider(color: context.divider, height: 1, indent: 24, endIndent: 24),

          // B. Financial Screen (Impermissible Income)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(isInterestFail ? Icons.cancel : Icons.check_circle, color: isInterestFail ? context.haram : context.halal, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('Financial Screen (Impermissible Income)', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 14)),
                          ),
                        ]
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('${interestRatio.toStringAsFixed(2)}%', style: TextStyle(color: isInterestFail ? context.haram : context.halal, fontWeight: FontWeight.w900, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildAaoifiProgressBar(interestRatio, 5.0, isInterestFail),
                const SizedBox(height: 16),
                Text('Measures how much of a company\'s income is derived from impermissible sources like interest. According to AAOIFI standards, this should not exceed 5%.', style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5)),
                const SizedBox(height: 24),
                buildCalculationCard('Interest Income', 'Total Revenue', formatAmt(interest), formatAmt(rawRevenue)),
              ],
            ),
          ),
          Divider(color: context.divider, height: 1, indent: 24, endIndent: 24),

          // C. Interest Bearing Debt
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(isDebtFail ? Icons.cancel : Icons.check_circle, color: isDebtFail ? context.haram : context.halal, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('Interest-bearing Debt', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 14)),
                          ),
                        ]
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('${debtRatio.toStringAsFixed(2)}%', style: TextStyle(color: isDebtFail ? context.haram : context.halal, fontWeight: FontWeight.w900, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildAaoifiProgressBar(debtRatio, 30.0, isDebtFail),
                const SizedBox(height: 16),
                Text('Measures the company\'s exposure to interest-bearing debt relative to its market capitalization. A lower ratio indicates less reliance on debt financing. According to AAOIFI standards, this should not exceed 30%.', style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5)),
                const SizedBox(height: 24),
                buildCalculationCard('Total Debt', 'Market Cap', formatAmt(debt), formatAmt(marketCap)),
              ],
            ),
          ),
          Divider(color: context.divider, height: 1, indent: 24, endIndent: 24),

          // D. Cash & Securities
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(isCashFail ? Icons.cancel : Icons.check_circle, color: isCashFail ? context.haram : context.halal, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('Cash & Securities', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 14)),
                          ),
                        ]
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('${cashRatio.toStringAsFixed(2)}%', style: TextStyle(color: isCashFail ? context.haram : context.halal, fontWeight: FontWeight.w900, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildAaoifiProgressBar(cashRatio, 30.0, isCashFail),
                const SizedBox(height: 16),
                Text('Measures the company\'s liquid cash and interest-bearing securities relative to its market capitalization. According to AAOIFI standards, this should not exceed 30%.', style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.5)),
                const SizedBox(height: 24),
                buildCalculationCard('Cash & Securities', 'Market Cap', formatAmt(cash), formatAmt(marketCap)),
              ],
            ),
          ),
        ],
      ),
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
            Text('Ask AI Assistant', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: context.textDark)),
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Text(
        overview,
        style: TextStyle(color: context.textMuted, height: 1.6, fontSize: 14),
      ),
    );
  }

  @override
  void dispose() {
    _purificationController.dispose();
    super.dispose();
  }
}
