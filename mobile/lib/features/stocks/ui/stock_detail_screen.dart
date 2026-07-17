import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/stock_repository.dart';
import '../../profile/data/user_activity_repository.dart';
import 'ai_analysis_sheet.dart';
import 'trade_bottom_sheet.dart';
import 'alert_bottom_sheet.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../../../core/api/api_service.dart';
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

  @override
  void initState() {
    super.initState();
    _currentStock = widget.stock;
    _checkIfFavorited();
    _fetchNews();
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
          const SnackBar(
            content: Text('Added to watchlist'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.textDark,
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
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.haram, behavior: SnackBarBehavior.floating),
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
    String reason = 'Manual screening recommended.';

    if (rawStatus is Map) {
      status = rawStatus['status']?.toString().toLowerCase() ?? 'doubtful';
      reason = rawStatus['reason'] ?? 'Manual screening recommended.';
    } else if (rawStatus is String) {
      status = rawStatus.toLowerCase() == 'compliant' ? 'halal' : (rawStatus.toLowerCase() == 'non-halal' ? 'non-halal' : 'doubtful');
      reason = 'Automated business activity analysis.';
    }
    
    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? AppTheme.halal : (isNonHalal ? AppTheme.haram : AppTheme.questionable);
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));
    String statusLabel = isHalal ? 'SHARIAH COMPLIANT' : (isNonHalal ? 'NOT COMPLIANT' : 'QUESTIONABLE');

    final financials = _currentStock['financials'];
    final latestFin = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    final hasFinancialHighlights = latestFin != null && (
      (latestFin['total_assets']?.toDouble() ?? 0.0) > 0 ||
      (latestFin['total_debt']?.toDouble() ?? 0.0) > 0 ||
      (latestFin['total_revenue']?.toDouble() ?? 0.0) > 0 ||
      (latestFin['interest_income']?.toDouble() ?? 0.0) > 0
    );

    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_currentStock['logo_url'] != null)
              Container(
                margin: const EdgeInsets.only(right: 8),
                width: 28, height: 28,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  image: DecorationImage(image: NetworkImage(_currentStock['logo_url']), fit: BoxFit.contain)
                ),
              )
            else
              Container(
                margin: const EdgeInsets.only(right: 8),
                width: 28, height: 28,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: AppTheme.primary,
                ),
                alignment: Alignment.center,
                child: Text((_currentStock['symbol'] ?? 'S')[0], style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            Text(_currentStock['symbol'], style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
          ],
        ),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined, color: AppTheme.textDark, size: 22),
            onPressed: () => AlertBottomSheet.show(context, _currentStock),
          ),
          IconButton(
            icon: Icon(_isAlreadyFavorited ? Icons.favorite_rounded : Icons.favorite_outline_rounded, 
              color: _isAlreadyFavorited ? AppTheme.haram : AppTheme.textDark, size: 22),
            onPressed: _isAlreadyFavorited ? null : (_isFavoriting ? null : _onFavorite),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
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
                   const Text('PRICE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
                   const SizedBox(height: 4),
                   Text('₦ ${latestPrice.toStringAsFixed(2)}', 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
                   if (_currentStock.containsKey('price_change_pct'))
                     Padding(
                       padding: const EdgeInsets.only(top: 2),
                       child: Text(
                         '${_currentStock['price_change_pct'] >= 0 ? '+' : ''}${_currentStock['price_change_pct']}%',
                         style: TextStyle(
                           fontSize: 12, 
                           fontWeight: FontWeight.w700, 
                           color: _currentStock['price_change_pct'] >= 0 ? AppTheme.primary : AppTheme.haram
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
                  onPressed: () => TradeBottomSheet.show(context, _currentStock),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
                   const SizedBox(height: 24),
                  // About Company
                  _buildSectionHeader('About Company'),
                  const SizedBox(height: 12),
                  _buildAboutCompany(),
                  const SizedBox(height: 32),

                  // Company Metadata
                  _buildSectionHeader('Overview'),
                  const SizedBox(height: 12),
                  _buildCompanyInfo(),
                  const SizedBox(height: 32),
                  
                  // Advanced Metrics (SWS)
                  _buildSectionHeader('Advanced Metrics'),
                  const SizedBox(height: 12),
                  _buildAdvancedMetrics(),
                  const SizedBox(height: 32),

                  // Price Chart
                  _buildSectionHeader('Price History'),
                  const SizedBox(height: 12),
                  _buildPriceChart(),
                  const SizedBox(height: 32),
                  
                  // Financial Ratios
                  _buildSectionHeader('Financial Ratios (AAOIFI)'),
                  const SizedBox(height: 12),
                  _buildFinancialRatios(statusColor),
                  const SizedBox(height: 32),
                  
                  // Financial Highlights
                  if (hasFinancialHighlights) ...[
                    _buildSectionHeader('Financial Highlights'),
                    const SizedBox(height: 12),
                    _buildFinancialHighlights(),
                    const SizedBox(height: 32),
                  ],
                  
                  // Business Screening
                  _buildSectionHeader('Business Screening'),
                  const SizedBox(height: 12),
                  _buildBusinessScreening(statusColor, badgeBg, statusLabel, reason),
                  const SizedBox(height: 32),

                  // AI Halal Assistant Button
                  _buildAiAssistantButton(),
                  const SizedBox(height: 32),

                  // Purification
                  _buildPurificationCard(),
                  const SizedBox(height: 48),
                  
                  // Action Button
                  _buildScreeningButton(statusColor),
                  const SizedBox(height: 24),
                  
                  // News Section
                  _buildSectionHeader('Latest News'),
                  const SizedBox(height: 12),
                  _buildNewsSection(),
                  const SizedBox(height: 32),

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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Override Compliance Status', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
                  const SizedBox(height: 8),
                  const Text('Update the status manually as a scholar or admin.', style: TextStyle(color: AppTheme.textMuted)),
                  const SizedBox(height: 24),
                  
                  const Text('Status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: selectedStatus,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppTheme.bg,
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
                  
                  const Text('Reason', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: reasonController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Explanation for override...',
                      filled: true,
                      fillColor: AppTheme.bg,
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
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.haram));
                        } finally {
                          if (mounted) setState(() => _isLoading = false);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1),
    );
  }

  Widget _buildStatusHeader(Color color, Color bg, String label) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: bg,
              shape: BoxShape.circle,
            ),
            child: Icon(
              label == 'SHARIAH COMPLIANT' ? Icons.check_circle_rounded : 
              label == 'NOT COMPLIANT' ? Icons.cancel_rounded : Icons.help_rounded,
              color: color, 
              size: 56
            ),
          ),
          const SizedBox(height: 24),
          Text(label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(_currentStock['name'] ?? 'N/A', 
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 15, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildPriceChart() {
    // If daily_prices array exists, use it. Otherwise fake some data points
    List<dynamic> pricesRaw = _currentStock!['daily_prices'] ?? [];
    List<FlSpot> spots = [];
    
    if (pricesRaw.isNotEmpty) {
       List<dynamic> reversedPrices = pricesRaw.reversed.toList();
       for (int i = 0; i < reversedPrices.length; i++) {
          double price = double.tryParse(reversedPrices[i]['price'].toString()) ?? 0;
          spots.add(FlSpot(i.toDouble(), price));
       }
    } else {
       spots = const [
         FlSpot(0, 150), FlSpot(1, 155), FlSpot(2, 148), 
         FlSpot(3, 160), FlSpot(4, 165), FlSpot(5, 172)
       ];
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider),
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
              return FlLine(color: AppTheme.divider, strokeWidth: 1);
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
                  return Text(value.toInt().toString(), style: const TextStyle(color: AppTheme.textMuted, fontSize: 10));
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: AppTheme.primary,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppTheme.primary.withOpacity(0.1),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
             touchTooltipData: LineTouchTooltipData(
               getTooltipColor: (touchedSpot) => AppTheme.textDark,
               getTooltipItems: (touchedSpots) {
                 return touchedSpots.map((LineBarSpot touchedSpot) {
                   return LineTooltipItem(
                     '₦ ${touchedSpot.y.toStringAsFixed(2)}',
                     const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
    final pe = _currentStock['pe_ratio']?.toString() ?? 'N/A';
    final divYield = _currentStock['div_yield'] != null ? '${_currentStock['div_yield']}%' : 'N/A';
    final roe = _currentStock['roe']?.toString() ?? 'N/A';

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('MARKET CAP', mcap > 0 ? '₦ ${formatAmt(mcap)}' : 'N/A')),
            const SizedBox(width: 16),
            Expanded(child: _buildMetricCard('P/E RATIO', pe)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildMetricCard('DIVIDEND YIELD', divYield)),
            const SizedBox(width: 16),
            Expanded(child: _buildMetricCard('ROE', roe != 'N/A' ? '$roe%' : 'N/A')),
          ],
        ),
      ],
    );
  }

  Widget _buildAdvancedMetrics() {
    final valuation = _currentStock['valuation_info'] ?? 'N/A';
    final growth = _currentStock['growth_info'] ?? 'N/A';
    
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('VALUATION', style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Text(valuation, style: const TextStyle(color: AppTheme.textDark, fontSize: 14, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('GROWTH FORECAST', style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Text(growth, style: const TextStyle(color: AppTheme.textDark, fontSize: 14, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNewsSection() {
    if (_isLoadingNews) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        child: const CircularProgressIndicator(color: AppTheme.primary),
      );
    }
    
    if (_news.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Column(
          children: const [
            Icon(Icons.article_outlined, color: AppTheme.textMuted, size: 32),
            SizedBox(height: 12),
            Text('No recent news found for this stock.', style: TextStyle(color: AppTheme.textMuted)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _news.length,
        separatorBuilder: (ctx, i) => const Divider(color: AppTheme.divider, height: 1),
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
                          color: AppTheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(article['source']?.toUpperCase() ?? 'NEWS', 
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                      ),
                      Text(dateStr, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(article['title'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textDark, height: 1.4)),
                  if (article['excerpt'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(article['excerpt'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.5)),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }



  Widget _buildMetricCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: AppTheme.textDark, fontSize: 14, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildFinancialHighlights() {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    final assets = latest?['total_assets']?.toDouble() ?? 0.0;
    final debt = latest?['total_debt']?.toDouble() ?? 0.0;
    final revenue = latest?['total_revenue']?.toDouble() ?? 0.0;
    final interest = latest?['interest_income']?.toDouble() ?? 0.0;

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

  Widget _buildFinancialRatios(Color statusColor) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    
    final debt = latest?['total_debt']?.toDouble() ?? 0.0;
    final assets = latest?['total_assets']?.toDouble() ?? 0.0;
    final safeAssets = assets > 0 ? assets : 1.0;
    
    final interest = latest?['interest_income']?.toDouble() ?? 0.0;
    
    final rawRevenue = latest?['total_revenue']?.toDouble() ?? 0.0;
    final revenue = rawRevenue > 0.0 ? rawRevenue : safeAssets;
    
    final debtRatio = assets > 0 ? (debt / assets) * 100 : 0.0;
    final interestRatio = revenue > 0 ? (interest / revenue) * 100 : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        children: [
          _buildRatioBar('Debt to Asset Ratio', debtRatio, 33.0),
          const SizedBox(height: 24),
          _buildRatioBar('Cash & Interest Ratio', interestRatio, 5.0),
        ],
      ),
    );
  }

  Widget _buildRatioBar(String title, double value, double limit) {
    final isFail = value > limit;
    final progress = (value / (limit * 1.5)).clamp(0.0, 1.0);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w700, fontSize: 14)),
            Text('${value.toStringAsFixed(2)}% / ${limit.toInt()}%', 
              style: TextStyle(color: isFail ? AppTheme.haram : AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 12),
        Stack(
          children: [
            Container(
              height: 8,
              width: double.infinity,
              decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(4)),
            ),
            Container(
              height: 8,
              width: (MediaQuery.of(context).size.width - 80) * progress,
              decoration: BoxDecoration(
                color: isFail ? AppTheme.haram : AppTheme.primary, 
                borderRadius: BorderRadius.circular(4)
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBusinessScreening(Color statusColor, Color bg, String label, String reason) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(label == 'NOT COMPLIANT' ? Icons.error_outline : Icons.check_circle_outline, 
                color: statusColor, size: 20),
              const SizedBox(width: 10),
              Text(label == 'NOT COMPLIANT' ? 'Non-Halal Activities detected' : 'Business activities are Halal', 
                style: TextStyle(color: statusColor, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            reason,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.5, fontSize: 14, fontWeight: FontWeight.w400),
          ),
        ],
      ),
    );
  }

  Widget _buildPurificationCard() {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    final nonCompliantRev = latest != null && latest['non_compliant_income_ratio'] != null 
        ? latest['non_compliant_income_ratio'].toDouble() 
        : 0.0; 

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.textDark, 
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.volunteer_activism_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text('Purification (Zakat al-Mustaghalat)', 
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Received non-halal dividends from this stock? Calculate your purification due.', 
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
          const SizedBox(height: 24),
          TextField(
            controller: _purificationController,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              hintText: 'Dividend amount...',
              hintStyle: const TextStyle(color: Colors.white24, fontWeight: FontWeight.w400),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              prefixText: '₦ ',
              prefixStyle: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            onChanged: (v) => _calculatePurification(v, nonCompliantRev),
          ),
          if (_purificationResult > 0) ...[
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  const Text('PURIFICATION AMOUNT', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('₦ ${_purificationResult.toStringAsFixed(2)}', 
                    style: const TextStyle(color: AppTheme.primary, fontSize: 32, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text('Purification rate: $nonCompliantRev%', 
                    style: const TextStyle(color: Colors.white30, fontSize: 11)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAiAssistantButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () => AiAnalysisSheet.show(context, _currentStock['symbol']),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue.withOpacity(0.1),
          foregroundColor: Colors.blue,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('✨', style: TextStyle(fontSize: 18)),
            SizedBox(width: 8),
            Text('Ask AI Assistant', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
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
        onPressed: _isLoading ? null : _runScreening,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.textDark,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        child: _isLoading 
          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('REFRESH SCREENING', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Text(
        overview,
        style: const TextStyle(color: AppTheme.textMuted, height: 1.6, fontSize: 14),
      ),
    );
  }

  @override
  void dispose() {
    _purificationController.dispose();
    super.dispose();
  }
}
