import 'package:flutter/material.dart';
import 'dart:async';
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
import '../../profile/ui/widgets/add_assets_bottom_sheet.dart';
import '../../portfolio/ui/tabs/portfolio_overview_tab.dart';
import '../../portfolio/providers/portfolio_provider.dart';
import '../../portfolio/ui/widgets/charities_bottom_sheet.dart';
class StockDetailScreen extends StatefulWidget {
  final Map<String, dynamic> args;

  const StockDetailScreen({super.key, required this.args});

  static Future<void> openWithLoading(BuildContext context, Map<String, dynamic> initialStock) async {
    final repository = StockRepository();
    final symbol = initialStock['symbol'];
    
    // Show spinner and wait for network
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withOpacity(0.4),
      builder: (context) => _LoadingDialog(symbol: symbol),
    );

    try {
      final futures = await Future.wait([
        repository.getStockDetails(symbol),
        repository.fetchAaoifiScreening(symbol).catchError((_) => null),
      ]);
      
      final fullData = futures[0] ?? {};
      final aaoifiData = futures[1] as Map<String, dynamic>?;

      if (context.mounted) Navigator.pop(context);

      if (context.mounted) {
        Navigator.pushNamed(context, '/stock_details', arguments: {
          'prefetched': true,
          'needs_refresh': false,
          'stock': {...initialStock, ...fullData},
          'aaoifiData': aaoifiData,
        });
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      
      // Fallback to cache if network fails
      final cachedStock = repository.getCachedDataForUrl('stocks/$symbol');
      final cachedAaoifi = repository.getCachedDataForUrl('stocks/$symbol/aaoifi-screening');
      
      Map<String, dynamic> mergedStock = {...initialStock};
      if (cachedStock != null) {
        mergedStock = {...mergedStock, ...cachedStock};
        if (cachedStock['status'] != null) mergedStock['status'] = cachedStock['status'];
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(cachedStock != null 
                ? 'Network error. Showing offline data. Please check your connection.'
                : 'Network error. Please check your internet connection.'),
            backgroundColor: context.haram,
            behavior: SnackBarBehavior.floating,
          )
        );

        if (cachedStock != null) {
          Navigator.pushNamed(context, '/stock_details', arguments: {
            'prefetched': true,
            'needs_refresh': true, // attempt refresh later if we fell back to cache
            'stock': mergedStock,
            'aaoifiData': cachedAaoifi,
          });
        }
      }
    }
  }

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> with TickerProviderStateMixin {
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
  final ScrollController _scrollController = ScrollController();
  final ScrollController _tabScrollController = ScrollController();
  Map<String, dynamic>? _aaoifiData;

  // Alert button animation
  late AnimationController _alertPulseController;
  late AnimationController _alertScaleController;
  late Animation<double> _alertScaleAnimation;
  late Animation<double> _alertPulseAnimation;

  double _parseDouble(dynamic val) {
    if (val == null) return 0.0;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    return num.tryParse(val.toString())?.toDouble() ?? 0.0;
  }

  @override
  void initState() {
    super.initState();

    // Alert button animations
    _alertScaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _alertScaleAnimation = Tween<double>(begin: 1.0, end: 0.94).animate(
      CurvedAnimation(parent: _alertScaleController, curve: Curves.easeInOut),
    );
    _alertPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _alertPulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _alertPulseController, curve: Curves.easeInOut),
    );
    
    if (widget.args.containsKey('prefetched') && widget.args['prefetched'] == true) {
      _currentStock = widget.args['stock'];
      _aaoifiData = widget.args['aaoifiData'];
      _isLoadingDetails = false;
      
      if (widget.args['needs_refresh'] == true) {
        _fetchFullDetails();
      }
    } else {
      _currentStock = widget.args.containsKey('stock') ? widget.args['stock'] : widget.args;
      _isLoadingDetails = true;
      _fetchFullDetails();
    }
    
    _fetchNews();
    
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
      // 1. Instant optimistic UI with stale cache (if any)
      final symbol = _currentStock['symbol'];
      final cachedStock = _stockRepository.getCachedDataForUrl('stocks/$symbol');
      final cachedAaoifi = _stockRepository.getCachedDataForUrl('stocks/$symbol/aaoifi-screening');
      
      bool hasStaleData = false;
      if (cachedStock != null) {
        _currentStock = {..._currentStock, ...cachedStock};
        if (cachedStock['status'] != null) _currentStock['status'] = cachedStock['status'];
        hasStaleData = true;
      }
      if (cachedAaoifi != null) {
        _aaoifiData = cachedAaoifi;
        hasStaleData = true;
      }
      
      // 2. Network fetch (Concurrent)
      final futures = await Future.wait([
        _stockRepository.getStockDetails(symbol),
        _stockRepository.fetchAaoifiScreening(symbol).catchError((_) => null),
      ]);
      
      final fullData = futures[0];
      final aaoifiData = futures[1] as Map<String, dynamic>?;
      
      if (fullData != null && mounted) {
        setState(() {
          // Replace status entirely from fullData (never merge shallow list status)
          _currentStock = {..._currentStock, ...fullData};
          if (fullData['status'] != null) {
            _currentStock['status'] = fullData['status'];
            
            // Inject the highly polished status reason from the AAOIFI screening endpoint
            if (aaoifiData != null && aaoifiData['status_reason'] != null) {
              if (_currentStock['status'] is Map) {
                _currentStock['status']['reason'] = aaoifiData['status_reason'];
              }
            }
          }
          _aaoifiData = aaoifiData;
          _isLoadingDetails = false;
        });
      } else if (!hasStaleData) {
        if (mounted) setState(() => _isLoadingDetails = false);
      }
    } catch (e) {
      debugPrint('Failed to load full details: $e');
      if (mounted) setState(() => _isLoadingDetails = false);
    }
  }

  void _checkIfFavorited() async {
    final watchlist = await _activityRepository.getWatchlist();
    if (mounted) {
      final isAlerted = watchlist.any((w) => w['symbol'] == _currentStock['symbol']);
      setState(() {
        _isAlreadyFavorited = isAlerted;
      });
      if (isAlerted) {
        _alertPulseController.repeat(reverse: true);
      }
    }
  }

  void _onFavorite() async {
    // Press animation
    _alertScaleController.forward().then((_) => _alertScaleController.reverse());
    setState(() => _isFavoriting = true);
    
    if (_isAlreadyFavorited) {
      final success = await _activityRepository.removeFromWatchlist(_currentStock['symbol']);
      if (success && mounted) {
        _alertPulseController.stop();
        _alertPulseController.reset();
        setState(() => _isAlreadyFavorited = false);
        Provider.of<AppStateProvider>(context, listen: false).decrementWatchlist();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed ${_currentStock['symbol']} from alerts'), behavior: SnackBarBehavior.floating, backgroundColor: context.textDark),
        );
      }
    } else {
      final success = await _activityRepository.addToWatchlist(_currentStock['symbol']);
      if (success && mounted) {
        setState(() => _isAlreadyFavorited = true);
        // Start pulse animation loop
        _alertPulseController.repeat(reverse: true);
        Provider.of<AppStateProvider>(context, listen: false).incrementWatchlist();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Added ${_currentStock['symbol']} to alerts'), behavior: SnackBarBehavior.floating, backgroundColor: context.textDark),
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
      if (status == 'non-halal' || status == 'non-compliant' || status == 'fail') {
        reason = rawStatus['reason'] ?? 'The core business operations involve non-compliant activities.';
      } else if (status == 'doubtful') {
        reason = rawStatus['reason'] ?? 'This stock is currently under review or lacks sufficient data for a definitive Shariah ruling.';
      } else {
        status = 'halal';
        reason = rawStatus['reason'] ?? 'The core business operations of this company have been verified to be in a Halal industry, with no significant involvement in prohibited activities like conventional finance, alcohol, gambling, or tobacco.';
      }
    } else if (rawStatus is String) {
      if (rawStatus.toLowerCase() == 'non-halal' || rawStatus.toLowerCase() == 'non-compliant' || rawStatus.toLowerCase() == 'fail') {
        status = 'non-compliant';
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

    bool isHalal = status == 'halal' || status == 'pass';
    bool isNonHalal = status == 'non-halal' || status == 'non-compliant' || status == 'fail';
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);
    
    bool purificationRequired = false;
    double haramRevenuePercent = 0.0;
    String justification = '';
    if (rawStatus is Map) {
      purificationRequired = rawStatus['purification_required'] == true || rawStatus['purification_required'] == 'true';
      haramRevenuePercent = double.tryParse(rawStatus['haram_revenue_percent']?.toString() ?? '0') ?? 0.0;
      // Prefer aaoifi status_reason (most detailed) → status.reason → business_reasoning
      justification = _aaoifiData?['status_reason']?.toString().isNotEmpty == true
          ? _aaoifiData!['status_reason'].toString()
          : (rawStatus['reason']?.toString().isNotEmpty == true
              ? rawStatus['reason'].toString()
              : (_aaoifiData?['business_reasoning']?.toString() ?? ''));
    } else {
      justification = _aaoifiData?['status_reason']?.toString() ?? '';
    }

    // Strip Additionally it passes all AAOIFI... for non-trading stocks for parity with frontend
    final isNotTrading = _currentStock['is_active'] == false || _currentStock['is_active'] == 0 || _currentStock['is_active'] == '0';
    if (isNotTrading && justification.isNotEmpty) {
      justification = justification.replaceAll(RegExp(r'\s*Additionally, it passes all AAOIFI quantitative financial screening ratios\.?', caseSensitive: false), '');
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

    if (_isLoadingDetails) {
      return Scaffold(
        backgroundColor: context.bg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: CircularProgressIndicator(color: context.primary),
        ),
      );
    }

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: CompanyAvatar(
          logoUrl: _currentStock['logo_url'],
          symbol: _currentStock['symbol'] ?? 'S',
          size: 28,
          borderRadius: 6,
          fontSize: 12,
        ),
        backgroundColor: statusColor.withOpacity(0.06),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_isAlreadyFavorited ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, 
              color: _isAlreadyFavorited ? context.primary : context.textDark, size: 22),
            onPressed: _isFavoriting ? null : _onFavorite,
          ),
          IconButton(
            tooltip: 'Add to Holdings',
            icon: Icon(Icons.add_chart_rounded, color: context.textDark, size: 22),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => AddHoldingBottomSheet(
                  preSelectedSymbol: _currentStock['symbol'],
                  preSelectedPrice: num.tryParse(_currentStock['latest_price']?.toString() ?? '0')?.toDouble(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            // Status Header
            _buildStatusHeader(statusColor, badgeBg, statusLabel, 
              purificationRequired: !_isLoadingDetails && purificationRequired, 
              percent: haramRevenuePercent, 
              scholarVerified: isScholarVerified,
              justification: justification,
              symbol: _currentStock['symbol']),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),


                  if (_selectedTab == 0) ...[
                    const SizedBox(height: 16),
                    _buildDetailedOverview(),
                  ],
                  if (_selectedTab == 1) ...[_buildStage1Tab()],
                  
                  if (_selectedTab == 2) ...[
                    const SizedBox(height: 32),
                    if ((_currentStock['financials'] ?? []).isNotEmpty || _aaoifiData != null) ...[

                      _buildComplianceDashboard(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                      const SizedBox(height: 32),
                    ] else ...[
                      Center(
                        child: Text('Financial screening data not available', style: TextStyle(color: context.textMuted)),
                      ),
                    ],

                  ],


                  // Price & Market Data
                  if (_selectedTab == 3) ...[
                    _buildPriceAndMarketData(),
                    _buildAdvancedMetrics(),
                    _buildAnalystRating(),
                  ],
                  
                  // News Section
                  if (_selectedTab == 4 && (_isLoadingNews || _news.isNotEmpty)) ...[
                    _buildSectionHeader('Latest News'),
                    const SizedBox(height: 12),
                    _buildNewsSection(),
                    const SizedBox(height: 32),
                  ],

                  // Company Profile
                  if (_selectedTab == 0) ...[
                    _buildCompanyProfile(),
                  ],
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
                      DropdownMenuItem(value: 'halal', child: Text('Shariah Compliant')),
                      DropdownMenuItem(value: 'doubtful', child: Text('Doubtful')),
                      DropdownMenuItem(value: 'non-compliant', child: Text('Shariah Non-Compliant')),
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
      behavior: HitTestBehavior.opaque,
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
  Widget _buildStatusHeader(Color color, Color bg, String label, {bool purificationRequired = false, double percent = 0.0, bool scholarVerified = false, String justification = '', String symbol = ''}) {
    final portfolioProvider = context.watch<PortfolioProvider>();
    final isHolding = portfolioProvider.holdings.any((h) => h['symbol'] == symbol);
    final holdingPurification = portfolioProvider.purifications.firstWhere(
      (h) => h['symbol'] == symbol,
      orElse: () => null,
    );
    final amountDue = holdingPurification != null 
        ? (num.tryParse(holdingPurification['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0)
        : 0.0;
    
    final bool showPurificationBtn = isHolding && purificationRequired;
    final bool isDonated = amountDue == 0.0;
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
      decoration: BoxDecoration(
        color: context.bg,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            color.withOpacity(0.06),
            context.bg,
          ],
        ),
      ),
      padding: const EdgeInsets.only(left: 24, right: 24, top: 0, bottom: 8),
      child: Column(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Ticker Symbol & Price
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_currentStock['symbol'] ?? '', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1.0, height: 1.0)),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: '₦ ', 
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: context.textMuted, letterSpacing: 0),
                        ),
                        TextSpan(
                          text: latestPrice.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},'), 
                          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1.0, height: 1.0),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              // Row 2: Company Name & Price Change
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        final symbol = _currentStock['symbol']?.toString().trim().toUpperCase() ?? '';
                        final name = _currentStock['name']?.toString().trim().toUpperCase() ?? '';
                        
                        if (name.isEmpty || symbol == name) {
                          return const SizedBox.shrink();
                        }
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentStock['name'] ?? '', 
                              style: TextStyle(color: context.textMuted, fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: -0.2),
                              maxLines: 1, 
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: context.divider.withOpacity(0.5),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text('NGX Listed', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.textDark)),
                                ),
                                if (_currentStock['is_active'] == false || _currentStock['is_active'] == 0 || _currentStock['is_active'] == '0')
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.info_outline, size: 10, color: Colors.red),
                                        const SizedBox(width: 4),
                                        const Text('currently not trading on ngx', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.red)),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        );
                      }
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isUp ? context.halal.withOpacity(0.12) : context.haram.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '${isUp ? '+' : '-'}₦$absChangeStr (${isUp ? '+' : ''}$pctChangeStr%)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: isUp ? context.halal : context.haram,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Row 3: Verdict Badges
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (purificationRequired)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.opacity, color: Color(0xFFF59E0B), size: 14),
                            const SizedBox(width: 6),
                            Text(
                              'With Purification ${percent > 0 ? '${percent.toStringAsFixed(2)}%' : ''}',
                              style: const TextStyle(
                                color: Color(0xFFF59E0B),
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: bg,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(mainLabel, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                      ),
                      if (showPurificationBtn)
                        GestureDetector(
                          onTap: isDonated ? null : () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => Padding(
                                padding: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
                                child: CharitiesBottomSheet(amountDue: amountDue, symbol: symbol),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isDonated ? context.halal.withOpacity(0.3) : const Color(0xFFF59E0B).withOpacity(0.3),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isDonated ? context.halal.withOpacity(0.15) : const Color(0xFFF59E0B).withOpacity(0.15),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Icon(Icons.opacity, color: isDonated ? context.halal : const Color(0xFFD97706), size: 20),
                          ),
                        ),

                    ],
                  ),
                ],
              ),
              if (justification.isNotEmpty) ...[
                Builder(
                  builder: (context) {
                    String shortJ = '';
                    String longJ = justification;
                    if (justification.contains('|||')) {
                      final parts = justification.split('|||');
                      if (parts.length >= 2) {
                        longJ = parts[0].trim();
                        shortJ = parts[1].trim();
                      }
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (shortJ.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Icon(Icons.auto_awesome, size: 16, color: color),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  shortJ,
                                  style: TextStyle(
                                    color: context.textDark.withOpacity(0.9),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (longJ.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: context.bg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: color.withOpacity(0.15)),
                              boxShadow: [
                                BoxShadow(
                                  color: color.withOpacity(0.04),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  longJ,
                                  style: TextStyle(
                                    color: context.textDark.withOpacity(0.9),
                                    fontSize: 13,
                                    height: 1.5,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                                // Reporting period
                                if (_aaoifiData?['reporting_period'] != null) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Icon(Icons.calendar_today_outlined, size: 11, color: context.textMuted),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Reporting period: ${_aaoifiData!["reporting_period"]}'
                                        '${_aaoifiData!["reporting_year"] != null ? " (${_aaoifiData!["reporting_year"]})" : ""}',
                                        style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ],
                    );
                  }
                ),
              ],
              // Alert CTA for stocks that pass Stage 1 and fail Stage 2
              if (!_isLoadingDetails) ...[
                Builder(
                  builder: (context) {
                    bool passesStage1 = (_currentStock['business_status'] != 'fail' && _currentStock['business_status'] != 'non-halal' && _currentStock['business_status'] != 'non-compliant') &&
                                        (_aaoifiData == null || (_aaoifiData!['business_status'] != 'fail' && _aaoifiData!['stage1']?['status'] != 'non-halal' && _aaoifiData!['stage1']?['status'] != 'non-compliant'));
                    bool isNonCompliant = label.toUpperCase().contains('NON-COMPLIANT');

                    if (passesStage1 && isNonCompliant) {
                      return Column(
                        children: [
                          const SizedBox(height: 12),
                          Center(
                            child: AnimatedBuilder(
                              animation: Listenable.merge([_alertScaleAnimation, _alertPulseAnimation]),
                              builder: (context, child) {
                                return Transform.scale(
                                  scale: _alertScaleAnimation.value,
                                  child: GestureDetector(
                                    onTapDown: (_) => _alertScaleController.forward(),
                                    onTapUp: (_) {
                                      _alertScaleController.reverse();
                                      if (!_isFavoriting) _onFavorite();
                                    },
                                    onTapCancel: () => _alertScaleController.reverse(),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 350),
                                      curve: Curves.easeInOutCubic,
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                                      decoration: BoxDecoration(
                                        color: _isAlreadyFavorited ? color : Colors.transparent,
                                        borderRadius: BorderRadius.circular(30),
                                        border: Border.all(
                                          color: _isAlreadyFavorited ? color : color.withOpacity(0.4),
                                          width: _isAlreadyFavorited ? 0 : 1.5,
                                        ),
                                        boxShadow: _isAlreadyFavorited ? [
                                          BoxShadow(
                                            color: color.withOpacity(0.25 * _alertPulseAnimation.value),
                                            blurRadius: 14 * _alertPulseAnimation.value,
                                            spreadRadius: 2 * _alertPulseAnimation.value,
                                          )
                                        ] : [],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          AnimatedSwitcher(
                                            duration: const Duration(milliseconds: 250),
                                            switchInCurve: Curves.elasticOut,
                                            switchOutCurve: Curves.easeIn,
                                            transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                                            child: _isFavoriting
                                              ? SizedBox(
                                                  key: const ValueKey('spinner'),
                                                  width: 15,
                                                  height: 15,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    color: _isAlreadyFavorited ? Colors.white : color,
                                                  ),
                                                )
                                              : Icon(
                                                  _isAlreadyFavorited ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                                                  key: ValueKey(_isAlreadyFavorited),
                                                  size: 15,
                                                  color: _isAlreadyFavorited ? Colors.white : color,
                                                ),
                                          ),
                                          const SizedBox(width: 8),
                                          AnimatedSwitcher(
                                            duration: const Duration(milliseconds: 300),
                                            child: Text(
                                              _isFavoriting
                                                ? (_isAlreadyFavorited ? 'Removing...' : 'Adding...')
                                                : (_isAlreadyFavorited ? 'Alert active · tap to remove' : 'Alert me when compliance changes'),
                                              key: ValueKey('$_isFavoriting-$_isAlreadyFavorited'),
                                              style: TextStyle(
                                                color: _isAlreadyFavorited ? Colors.white : color,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: -0.2,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  }
                ),
              ],
            ],
          ),
          const SizedBox(height: 32),

          SingleChildScrollView(
            controller: _tabScrollController,
            scrollDirection: Axis.horizontal,
            physics: const AlwaysScrollableScrollPhysics(),
            child: Row(
              children: [
                _buildTabItem(0, 'About'),
                const SizedBox(width: 24),
                _buildTabItem(1, 'Stage 1 Screening'),
                Builder(
                  builder: (context) {
                    final rawStatus = _currentStock['status'];
                    String currentStatus = 'doubtful';
                    if (rawStatus is Map) {
                      currentStatus = rawStatus['status']?.toString().toLowerCase() ?? 'doubtful';
                    } else if (rawStatus is String) {
                      currentStatus = rawStatus.toLowerCase();
                    }
                    
                    bool hasFinancials = false;
                    if ((_currentStock['financials'] ?? []).isNotEmpty) {
                      hasFinancials = true;
                    } else if (_aaoifiData != null) {
                      double _getDouble(dynamic val) {
                        if (val == null) return 0.0;
                        return double.tryParse(val.toString()) ?? 0.0;
                      }
                      
                      final used = _aaoifiData!['financial_data_used'];
                      if (used != null && (_getDouble(used['total_assets']) > 0 || _getDouble(used['total_revenue']) > 0)) {
                        hasFinancials = true;
                      }
                      if (!hasFinancials && (_getDouble(_aaoifiData!['debt_ratio']) > 0 || 
                          _getDouble(_aaoifiData!['cash_ratio']) > 0 || 
                          _getDouble(_aaoifiData!['impermissible_income_ratio']) > 0)) {
                        hasFinancials = true;
                      }
                    }
                    
                    if (hasFinancials && 
                        currentStatus != 'doubtful' && 
                        (_currentStock['business_status'] != 'fail' && _currentStock['business_status'] != 'non-halal' && _currentStock['business_status'] != 'non-compliant') &&
                        (_aaoifiData == null || (_aaoifiData!['business_status'] != 'fail' && _aaoifiData!['stage1']?['status'] != 'non-halal' && _aaoifiData!['stage1']?['status'] != 'non-compliant'))) {
                      return Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(width: 24),
                          _buildTabItem(2, 'Stage 2 Screening'),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  }
                ),
                const SizedBox(width: 24),
                _buildTabItem(3, 'Price & Market Data'),
                const SizedBox(width: 24),
                _buildTabItem(4, 'News'),
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

  Widget _buildDetailedOverview() {
    final sector = _currentStock['sector'] ?? 'Unknown';
    final industry = _currentStock['industry'] ?? 'Unknown';
    final analystTarget = _currentStock['analysts_target'] != null ? '₦ ${_currentStock['analysts_target']}' : 'N/A';

    Widget buildRow(IconData icon, String label, String value, {bool isLast = false, bool isVerified = false}) {
      return Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: context.divider.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 15, color: context.textMuted),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: context.textMuted)),
                ),
                if (isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_rounded, size: 11, color: Color(0xFF3B82F6)),
                        SizedBox(width: 4),
                        Text('Verified', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF3B82F6))),
                      ],
                    ),
                  )
                else
                  Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark)),
              ],
            ),
          ),
          if (!isLast) Divider(height: 0, thickness: 0.5, color: context.divider.withOpacity(0.5)),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Overview'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              buildRow(Icons.category_outlined, 'Sector', sector),
              buildRow(Icons.factory_outlined, 'Industry', industry),
              buildRow(Icons.account_balance_outlined, 'Exchange', 'Stock Exchange'),
              buildRow(Icons.track_changes_rounded, 'Analyst Target', analystTarget),
              buildRow(Icons.shield_outlined, 'SEC Registration', 'Verified', isLast: true, isVerified: true),
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

    final items = <Map<String, dynamic>>[
      if (address != 'N/A') {'icon': Icons.location_on_rounded, 'value': address},
      if (phone != 'N/A') {'icon': Icons.phone_rounded, 'value': phone},
      if (website != 'N/A') {'icon': Icons.language_rounded, 'value': website},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Company Profile'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: List.generate(items.length, (i) {
              final item = items[i];
              final isLast = i == items.length - 1;
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: context.divider.withOpacity(0.4),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(item['icon'] as IconData, size: 15, color: context.textMuted),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(item['value'] as String,
                            style: TextStyle(color: context.textDark, fontSize: 13, fontWeight: FontWeight.w600, height: 1.4)),
                        ),
                      ],
                    ),
                  ),
                  if (!isLast) Divider(height: 0, thickness: 0.5, color: context.divider.withOpacity(0.5)),
                ],
              );
            }),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildAnalystRating() {
    final rating = _currentStock['analysts_rating'] ?? 'N/A';
    final analystTarget = _currentStock['analysts_target']?.toString() ?? 'N/A';
    if (rating == 'N/A') return const SizedBox.shrink();

    Color ratingColor;
    IconData ratingIcon;
    String sentiment;
    if (rating.toLowerCase().contains('strong buy')) {
      ratingColor = context.halal; ratingIcon = Icons.trending_up_rounded; sentiment = 'Strongly Bullish';
    } else if (rating.toLowerCase().contains('buy')) {
      ratingColor = context.halal; ratingIcon = Icons.thumb_up_rounded; sentiment = 'Bullish';
    } else if (rating.toLowerCase().contains('sell')) {
      ratingColor = context.haram; ratingIcon = Icons.thumb_down_rounded; sentiment = 'Bearish';
    } else {
      ratingColor = context.questionable; ratingIcon = Icons.drag_handle_rounded; sentiment = 'Neutral';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Analysts Rating'),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              // Top accent + consensus
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ratingColor.withOpacity(0.07),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  border: Border(bottom: BorderSide(color: ratingColor.withOpacity(0.15))),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: ratingColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(ratingIcon, color: ratingColor, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ANALYST CONSENSUS', style: TextStyle(color: ratingColor.withOpacity(0.7), fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
                        const SizedBox(height: 3),
                        Text(rating.toUpperCase(), style: TextStyle(color: ratingColor, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: ratingColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(sentiment, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: ratingColor)),
                    ),
                  ],
                ),
              ),
              // Target price row
              if (analystTarget != 'N/A')
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(color: context.divider.withOpacity(0.4), borderRadius: BorderRadius.circular(8)),
                        child: Icon(Icons.gps_fixed_rounded, size: 15, color: context.textMuted),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text('Price Target', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: context.textMuted))),
                      Text('₦$analystTarget', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: context.textDark)),
                    ],
                  ),
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

  Widget _buildDataCard(String title, IconData icon, Color iconBg, Color iconColor, List<Map<String, dynamic>> items) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(child: Icon(icon, color: iconColor, size: 20)),
              ),
              const SizedBox(width: 16),
              Text(
                title.toUpperCase(),
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Rows
          ...items.asMap().entries.map((entry) {
            int idx = entry.key;
            var item = entry.value;
            bool isLast = idx == items.length - 1;
            
            return Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['label'], style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                        if (item['sub'] != null) ...[
                          const SizedBox(height: 2),
                          Text(item['sub'], style: TextStyle(color: context.primary, fontSize: 10, fontWeight: FontWeight.w700)),
                        ],
                      ],
                    ),
                    Text(
                      item['value'] ?? '—', 
                      style: TextStyle(color: context.textDark, fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                    ),
                  ],
                ),
                if (!isLast) ...[
                  const SizedBox(height: 14),
                  Divider(color: context.divider.withOpacity(0.5), height: 1),
                  const SizedBox(height: 14),
                ],
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPriceAndMarketData() {
    String formatRaw(dynamic val) {
      if (val == null || val.toString().isEmpty) return '—';
      double? parsed = double.tryParse(val.toString());
      if (parsed == null) return '—';
      
      String s = parsed.toStringAsFixed(2);
      List<String> parts = s.split('.');
      parts[0] = parts[0].replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
      return '₦${parts.join('.')}';
    }

    String formatCount(dynamic val) {
      if (val == null || val.toString().isEmpty) return '—';
      double? amt = double.tryParse(val.toString());
      if (amt == null || amt == 0) return '—';
      if (amt >= 1e12) return '${(amt / 1e12).toStringAsFixed(2)}T';
      if (amt >= 1e9) return '${(amt / 1e9).toStringAsFixed(2)}B';
      if (amt >= 1e6) return '${(amt / 1e6).toStringAsFixed(2)}M';
      if (amt >= 1e3) return '${(amt / 1e3).toStringAsFixed(2)}K';
      return amt.toStringAsFixed(0);
    }
    
    String formatMcap(dynamic val) {
      if (val == null || val.toString().isEmpty) return '—';
      double? amt = double.tryParse(val.toString());
      if (amt == null || amt == 0) return '—';
      if (amt >= 1e12) return '₦${(amt / 1e12).toStringAsFixed(2)}T';
      if (amt >= 1e9) return '₦${(amt / 1e9).toStringAsFixed(2)}B';
      if (amt >= 1e6) return '₦${(amt / 1e6).toStringAsFixed(2)}M';
      return '₦${amt.toStringAsFixed(0)}';
    }

    String formatDate(dynamic dateStr) {
      if (dateStr == null) return '';
      DateTime? d = DateTime.tryParse(dateStr.toString());
      if (d == null) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    }

    List<Map<String, dynamic>> priceItems = [
      {'label': 'Open', 'value': formatRaw(_currentStock['open_price'])},
      {'label': 'Previous Close', 'value': formatRaw(_currentStock['previous_close'])},
      {'label': 'Day High', 'value': formatRaw(_currentStock['day_high'])},
      {'label': 'Day Low', 'value': formatRaw(_currentStock['day_low'])},
      {'label': '52W High', 'value': formatRaw(_currentStock['fifty_two_week_high'])},
      {'label': '52W Low', 'value': formatRaw(_currentStock['fifty_two_week_low'])},
    ];
    priceItems.removeWhere((item) => item['value'] == '—');

    List<Map<String, dynamic>> marketItems = [
      {'label': 'Market Cap', 'value': formatMcap(_currentStock['market_cap'])},
      {'label': 'Shares Out.', 'value': formatCount(_currentStock['shares_outstanding'])},
      {'label': 'Volume Today', 'value': formatCount(_currentStock['volume'])},
      {'label': 'P/E Ratio', 'value': _currentStock['pe_ratio']?.toString() ?? '—'},
      {'label': 'EPS', 'value': _currentStock['eps']?.toString() ?? '—'},
    ];
    
    if (_currentStock['last_paid_dividend'] != null) {
      marketItems.add({
        'label': 'Last Div.',
        'sub': formatDate(_currentStock['last_paid_dividend']['pay_date']),
        'value': formatRaw(_currentStock['last_paid_dividend']['amount'])
      });
    }
    
    if (_currentStock['upcoming_dividend'] != null) {
      marketItems.add({
        'label': 'Next Div.',
        'sub': formatDate(_currentStock['upcoming_dividend']['pay_date']),
        'value': formatRaw(_currentStock['upcoming_dividend']['amount'])
      });
    }
    
    if (_currentStock['div_yield'] != null) {
      marketItems.add({
        'label': 'Div. Yield',
        'value': '${_currentStock['div_yield']}%'
      });
    }
    marketItems.removeWhere((item) => item['value'] == '—');

    return Column(
      children: [
        if (priceItems.isNotEmpty)
          _buildDataCard('PRICE DATA', Icons.bar_chart_rounded, context.primary.withOpacity(0.1), context.primary, priceItems),
        if (marketItems.isNotEmpty)
          _buildDataCard('MARKET DATA', Icons.trending_up_rounded, context.primary.withOpacity(0.1), context.primary, marketItems),
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) Container(
                width: 26, height: 26,
                decoration: BoxDecoration(
                  color: context.divider.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 13, color: context.textMuted),
              ),
              if (icon != null) const SizedBox(width: 8),
              Expanded(
                child: Text(label, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5), maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(color: valueColor ?? context.textDark, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.3), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }


  Widget _buildComplianceDashboard(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    double _getDouble(dynamic value) {
      if (value == null) return 0.0;
      return double.tryParse(value.toString()) ?? 0.0;
    }

    double debtRatio = 0.0;
    double cashRatio = 0.0;
    double interestRatio = 0.0;
    String denominatorLabel = 'Market Cap';
    
    double denominator = 0.0;
    double totalDebt = 0.0;
    double cash = 0.0;
    double securities = 0.0;
    double interestIncome = 0.0;
    double totalRevenue = 0.0;

    if (_aaoifiData != null) {
      debtRatio = _getDouble(_aaoifiData!['debt_ratio']);
      cashRatio = _getDouble(_aaoifiData!['cash_ratio']);
      interestRatio = _getDouble(_aaoifiData!['impermissible_income_ratio']);
      
      final used = _aaoifiData!['financial_data_used'];
      if (used != null) {
        double usedMcap = _getDouble(used['market_cap']);
        double usedAssets = _getDouble(used['total_assets']);
        
        if (_aaoifiData!['denominator_used'] != null) {
          denominatorLabel = _aaoifiData!['denominator_used'].toString();
          denominator = denominatorLabel.toLowerCase().contains('asset') ? usedAssets : usedMcap;
        } else {
          denominatorLabel = usedMcap > 0 ? 'Market Cap' : 'Total Assets';
          denominator = usedMcap > 0 ? usedMcap : usedAssets;
        }
        
        totalDebt = _getDouble(used['total_debt']);
        cash = _getDouble(used['cash_and_equivalents'] ?? used['cash']);
        securities = _getDouble(used['interest_bearing_securities']);
        interestIncome = _getDouble(used['interest_income']);
        totalRevenue = _getDouble(used['total_revenue']);
      }
    } else {
      double marketCap = latest != null ? _getDouble(latest['market_cap']) : 0.0;
      if (marketCap == 0.0) {
        marketCap = _getDouble(_currentStock['market_capitalisation']);
      }
      double totalAssets = latest != null ? _getDouble(latest['total_assets']) : 0.0;
      
      denominator = marketCap > 0 ? marketCap : totalAssets;
      denominatorLabel = marketCap > 0 ? 'Market Cap' : 'Total Assets';

      totalDebt = latest != null ? _getDouble(latest['total_debt']) : 0.0;
      cash = latest != null ? _getDouble(latest['cash_and_equivalents']) : 0.0;
      securities = latest != null ? _getDouble(latest['interest_bearing_securities']) : 0.0;
      interestIncome = latest != null ? _getDouble(latest['interest_income']) : 0.0;
      totalRevenue = latest != null ? _getDouble(latest['total_revenue']) : 0.0;

      debtRatio = denominator > 0 ? (totalDebt / denominator) * 100 : 0.0;
      cashRatio = denominator > 0 ? ((cash + securities) / denominator) * 100 : 0.0;
      
      double apiInterestRatio = latest != null ? _getDouble(latest['interest_income_ratio']) : 0.0;
      interestRatio = apiInterestRatio > 0 
          ? apiInterestRatio 
          : (totalRevenue > 0 ? (interestIncome / totalRevenue) * 100 : 0.0);
    }
        
    String formatCompact(double amt) {
      if (amt == 0) return '0';
      final abs = amt.abs();
      final sign = amt < 0 ? '-' : '';
      if (abs >= 1e12) return '$sign${(abs / 1e12).toStringAsFixed(2)}T';
      if (abs >= 1e9)  return '$sign${(abs / 1e9).toStringAsFixed(2)}B';
      if (abs >= 1e6)  return '$sign${(abs / 1e6).toStringAsFixed(2)}M';
      if (abs >= 1e3)  return '$sign${(abs / 1e3).toStringAsFixed(2)}K';
      return '$sign${abs.toStringAsFixed(2)}';
    }
        
    Widget buildRatioCard(int number, String title, String formula, double value, double limit, String numLabel, String denLabel, String numValStr, String denValStr) {
      bool isPass = value <= limit;
      bool isClickable = numValStr != '0' && numValStr != '0 + 0' && numValStr != '0.00' && numValStr != '—';
      
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          if (!isClickable) return;

          showModalBottomSheet(
            context: context,
            backgroundColor: context.bgSection,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
            builder: (context) {
              Widget _row(String label, String val, {bool isBold = false, Color? valColor}) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(label, style: TextStyle(fontSize: 14, fontWeight: isBold ? FontWeight.w800 : FontWeight.w500, color: isBold ? context.textDark : context.textMuted)),
                      Text(val, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: valColor ?? context.textDark)),
                    ],
                  ),
                );
              }

              return SafeArea(
                child: Container(
                  padding: const EdgeInsets.only(top: 10, left: 16, right: 16, bottom: 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Drag handle
                      Container(
                        width: 32, height: 3,
                        decoration: BoxDecoration(color: context.divider, borderRadius: BorderRadius.circular(10)),
                      ),
                      const SizedBox(height: 14),

                      // Header row
                      Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.calculate_rounded, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3)),
                              Text('AAOIFI Shariah — ${limit.toInt()}% limit', style: TextStyle(fontSize: 10, color: context.textMuted)),
                            ],
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: isPass ? context.halalBg : context.haramBg,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isPass ? context.halal.withOpacity(0.3) : context.haram.withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(isPass ? Icons.check_rounded : Icons.close_rounded, size: 10, color: isPass ? context.halal : context.haram),
                                const SizedBox(width: 4),
                                Text(isPass ? 'PASS' : 'FAIL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isPass ? context.halal : context.haram, letterSpacing: 0.5)),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Single unified formula card
                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: context.bgSection,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: context.divider.withOpacity(0.5)),
                        ),
                        child: Column(
                          children: [
                            // Formula section
                            Padding(
                              padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Fraction block
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(numLabel.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: Color(0xFF8B5CF6), letterSpacing: 1.0)),
                                        const SizedBox(height: 2),
                                        Text(numValStr, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3), overflow: TextOverflow.ellipsis, maxLines: 1),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          child: Container(height: 2, decoration: BoxDecoration(
                                            gradient: LinearGradient(colors: [context.textDark, context.textDark.withOpacity(0.2)]),
                                            borderRadius: BorderRadius.circular(2),
                                          )),
                                        ),
                                        Text(denLabel.toUpperCase(), style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: context.textMuted, letterSpacing: 1.0)),
                                        const SizedBox(height: 2),
                                        Text(denValStr, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3), overflow: TextOverflow.ellipsis, maxLines: 1),
                                      ],
                                    ),
                                  ),

                                  // Operators
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 14),
                                    child: Column(
                                      children: [
                                        Text('×100', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: context.textMuted)),
                                        const SizedBox(height: 4),
                                        Text('=', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w300, color: context.textMuted)),
                                      ],
                                    ),
                                  ),

                                  // Result
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${value.toStringAsFixed(2)}%',
                                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: isPass ? context.halal : context.haram, letterSpacing: -0.5),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            // Footer strip
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                              decoration: BoxDecoration(
                                color: isPass ? context.halalBg.withOpacity(0.6) : context.haramBg.withOpacity(0.6),
                                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
                                border: Border(top: BorderSide(color: isPass ? context.halal.withOpacity(0.15) : context.haram.withOpacity(0.15))),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isPass ? '${(limit - value).toStringAsFixed(2)}pp below the ${limit.toInt()}% limit' : '${(value - limit).toStringAsFixed(2)}pp above the ${limit.toInt()}% limit',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isPass ? context.halal : context.haram),
                                  ),
                                  Icon(isPass ? Icons.check_circle_rounded : Icons.cancel_rounded, size: 16, color: isPass ? context.halal : context.haram),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 12),

                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: double.infinity,
                          height: 44,
                          decoration: BoxDecoration(
                            color: context.textDark,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Text('Done', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: context.bgSection)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: context.bgSection,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.divider.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 20, height: 20,
                  decoration: BoxDecoration(color: isPass ? context.halalBg : context.haramBg, borderRadius: BorderRadius.circular(5)),
                  child: Center(child: Text('$number', style: TextStyle(color: isPass ? context.halal : context.haram, fontSize: 10, fontWeight: FontWeight.w900))),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: context.textDark))),
                          if (isClickable) ...[
                            const SizedBox(width: 4),
                            Icon(Icons.arrow_outward, size: 10, color: context.textMuted),
                          ]
                        ]
                      ),
                      const SizedBox(height: 2),
                      Text(formula, style: TextStyle(fontSize: 10, color: context.textMuted, height: 1.2)),
                    ]
                  ),
                ),
                const SizedBox(width: 6),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('${value.toStringAsFixed(2)}%', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: isPass ? context.halal : context.haram)),
                  ]
                )
              ]
            ),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                double visualMax = limit * 2.5;
                if (value > visualMax) visualMax = value * 1.2;
                if (visualMax == 0) visualMax = 1;
                
                double fillWidth = (value / visualMax) * constraints.maxWidth;
                double limitPos = (limit / visualMax) * constraints.maxWidth;
                
                return Stack(
                  alignment: Alignment.centerLeft,
                  clipBehavior: Clip.none,
                  children: [
                    Container(height: 6, decoration: BoxDecoration(color: context.divider.withOpacity(0.4), borderRadius: BorderRadius.circular(100))),
                    Container(width: fillWidth.clamp(0.0, constraints.maxWidth), height: 6, decoration: BoxDecoration(color: isPass ? context.halal : context.haram, borderRadius: BorderRadius.circular(100))),
                    Positioned(
                      left: limitPos - 1.5,
                      child: Container(width: 3, height: 20, decoration: BoxDecoration(color: context.haram, borderRadius: BorderRadius.circular(2))),
                    ),
                    Positioned(
                      left: limitPos - 22,
                      top: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(color: context.bgSection, border: Border.all(color: context.haram.withOpacity(0.3)), borderRadius: BorderRadius.circular(4)),
                        child: Text('${limit.toInt()}% limit', style: TextStyle(color: context.haram, fontSize: 8, fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ]
                );
              }
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: isPass ? context.halalBg : context.haramBg, borderRadius: BorderRadius.circular(100)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isPass ? Icons.check : Icons.close, size: 10, color: isPass ? context.halal : context.haram),
                      const SizedBox(width: 4),
                      Text(
                        isPass ? 'PASS • ${(limit - value).toStringAsFixed(2)}pp headroom' : 'FAIL • ${(value - limit).toStringAsFixed(2)}pp excess',
                        style: TextStyle(color: isPass ? context.halal : context.haram, fontSize: 10, fontWeight: FontWeight.w800),
                      ),
                    ]
                  ),
                )
              ]
            )
          ]
        ),
      ),
    );
  }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.bar_chart, color: Color(0xFF8B5CF6), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quantitative Financial Ratios', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),

                ],
              ),
            ),
          ]
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(border: Border.all(color: context.divider), borderRadius: BorderRadius.circular(20)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.tune, size: 14, color: Color(0xFF8B5CF6)),
              const SizedBox(width: 6),
              Text('Denominator: $denominatorLabel', style: TextStyle(fontSize: 12, color: context.textMuted, fontWeight: FontWeight.w800)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        buildRatioCard(1, 'Debt ratio', 'Total Debt / $denominatorLabel × 100', debtRatio, 30, 
          'Total Debt', denominatorLabel, formatCompact(totalDebt), formatCompact(denominator)),
        buildRatioCard(2, 'Cash ratio', '(Cash + Securities) / $denominatorLabel × 100', cashRatio, 30, 
          'Cash + Securities', denominatorLabel, '${formatCompact(cash)} + ${formatCompact(securities)}', formatCompact(denominator)),
        buildRatioCard(3, 'Impure revenue', 'Impure Income / Total Revenue × 100', interestRatio, 5, 
          'Impure Income', 'Total Revenue', formatCompact(interestIncome), formatCompact(totalRevenue)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFBF5FF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE9D5FF), width: 1.5),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, color: Color(0xFF7C3AED), size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: TextStyle(color: context.textDark.withOpacity(0.8), fontSize: 13, height: 1.5, fontFamily: 'Manrope'),
                    children: [
                      TextSpan(text: 'Important: ', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark)),
                      const TextSpan(text: 'AAOIFI applies strict thresholds with no buffer zones. For example, a company at 30.01% debt is non-halal. Click any bar to see the full calculation breakdown.'),
                    ]
                  )
                )
              )
            ]
          )
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

  Widget _buildStage1Tab() {
    final rawStatus = _currentStock['status'];
    String stage1Status = 'doubtful';
    String stage1Reason = 'Permissible core activity.';
    double haramRevenuePercent = 0.0;
    
    if (_aaoifiData != null && _aaoifiData!['stage1'] != null) {
      stage1Status = _aaoifiData!['stage1']['status'] ?? 'doubtful';
      stage1Reason = _aaoifiData!['stage1']['reason'] ?? stage1Reason;
      haramRevenuePercent = double.tryParse(_aaoifiData!['stage1']['haram_revenue_percent']?.toString() ?? '0') ?? 0.0;
    } else if (_aaoifiData != null) {
      stage1Status = _aaoifiData!['business_status'] ?? 'doubtful';
      stage1Reason = _aaoifiData!['business_reasoning'] ?? stage1Reason;
    } else if (rawStatus is Map) {
       stage1Status = rawStatus['status']?.toString().toLowerCase() ?? 'doubtful';
       if (stage1Status == 'non-halal' || stage1Status == 'non-compliant') stage1Reason = rawStatus['reason'] ?? 'The core business operations involve non-compliant activities.';
       haramRevenuePercent = double.tryParse(rawStatus['haram_revenue_percent']?.toString() ?? '0') ?? 0.0;
    } else if (rawStatus is String) {
       stage1Status = rawStatus.toLowerCase();
    }
    
    bool stage1Pass = stage1Status == 'halal' || stage1Status == 'pass';
    bool stage1Fail = stage1Status == 'non-halal' || stage1Status == 'non-compliant' || stage1Status == 'fail';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Row(
          children: [
            const Icon(Icons.psychology_outlined, color: Color(0xFF8B5CF6), size: 22),
            const SizedBox(width: 8),
            Text('Screening Reasoning', style: TextStyle(color: context.textDark, fontSize: 17, fontWeight: FontWeight.w900)),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: context.bgSection,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.divider.withOpacity(0.5), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 5,
                    color: const Color(0xFF8B5CF6),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(
                        stage1Reason,
                        style: TextStyle(color: context.textDark.withOpacity(0.85), fontSize: 15, fontWeight: FontWeight.w600, height: 1.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (stage1Fail && haramRevenuePercent > 5) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.haramBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.haram.withOpacity(0.2)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning_amber_rounded, color: context.haram, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Prohibited Activities Exceed Limit', style: TextStyle(color: context.haram, fontWeight: FontWeight.w800, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text('Non-compliant revenue ($haramRevenuePercent%) exceeds the 5% threshold.', style: TextStyle(color: context.haram, fontSize: 13, height: 1.4)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 32),
        if (stage1Pass || stage1Fail)
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 14),
              decoration: BoxDecoration(
                color: stage1Pass ? context.halalBg : context.haramBg,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: stage1Pass ? context.halal.withOpacity(0.6) : context.haram.withOpacity(0.6), 
                  width: 1.5
                ),
              ),
              child: Text(
                stage1Pass ? 'PASS' : 'FAIL',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: stage1Pass ? context.halal : context.haram,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),
      ],
    );
  }



  @override
  void dispose() {
    _purificationController.dispose();
    _scrollController.dispose();
    _tabScrollController.dispose();
    _alertPulseController.dispose();
    _alertScaleController.dispose();
    super.dispose();
  }
}

class _LoadingDialog extends StatefulWidget {
  final String symbol;
  const _LoadingDialog({required this.symbol});

  @override
  State<_LoadingDialog> createState() => _LoadingDialogState();
}

class _LoadingDialogState extends State<_LoadingDialog>
    with TickerProviderStateMixin {
  static const _steps = [
    _LoadingStep(icon: Icons.download_rounded,   label: 'Fetching market data'),
    _LoadingStep(icon: Icons.bar_chart_rounded,  label: 'Analyzing financials'),
    _LoadingStep(icon: Icons.balance_rounded,    label: 'AAOIFI screening'),
    _LoadingStep(icon: Icons.verified_rounded,   label: 'Finalizing results'),
  ];

  int _currentStep = 0;
  Timer? _timer;

  // Card entrance
  late AnimationController _entranceController;
  late Animation<double> _entranceScale;
  late Animation<double> _entranceFade;

  // Avatar spinning border
  late AnimationController _spinController;

  // Avatar ripple rings
  late AnimationController _ripple1Controller;
  late AnimationController _ripple2Controller;
  late Animation<double> _ripple1Scale, _ripple1Opacity;
  late Animation<double> _ripple2Scale, _ripple2Opacity;

  // Step label crossfade + icon bounce
  late AnimationController _labelController;
  late Animation<double> _labelFade;
  late Animation<Offset> _labelSlide;

  late AnimationController _iconBounceController;
  late Animation<double> _iconBounce;

  // Progress bar
  late AnimationController _progressController;
  late Animation<double> _progressAnim;

  // Shimmer sweep across progress fill
  late AnimationController _shimmerController;
  late Animation<double> _shimmerAnim;

  @override
  void initState() {
    super.initState();

    // --- Entrance ---
    _entranceController = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));
    _entranceScale = Tween<double>(begin: 0.82, end: 1.0).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOutBack),
    );
    _entranceFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _entranceController, curve: const Interval(0, 0.6, curve: Curves.easeOut)),
    );
    _entranceController.forward();

    // --- Spinning border (slow continuous rotation) ---
    _spinController = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();

    // --- Ripple rings ---
    _ripple1Controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();
    _ripple1Scale   = Tween<double>(begin: 0.6, end: 1.6).animate(CurvedAnimation(parent: _ripple1Controller, curve: Curves.easeOut));
    _ripple1Opacity = Tween<double>(begin: 0.5, end: 0.0).animate(CurvedAnimation(parent: _ripple1Controller, curve: Curves.easeOut));

    _ripple2Controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();
    _ripple2Scale   = Tween<double>(begin: 0.6, end: 1.6).animate(CurvedAnimation(parent: _ripple2Controller, curve: Curves.easeOut));
    _ripple2Opacity = Tween<double>(begin: 0.35, end: 0.0).animate(CurvedAnimation(parent: _ripple2Controller, curve: Curves.easeOut));
    Future.delayed(const Duration(milliseconds: 800), () { if (mounted) _ripple2Controller.forward(from: 0.5); });

    // --- Label crossfade ---
    _labelController = AnimationController(vsync: this, duration: const Duration(milliseconds: 260))..value = 1.0;
    _labelFade  = CurvedAnimation(parent: _labelController, curve: Curves.easeInOut);
    _labelSlide = Tween<Offset>(begin: const Offset(0, 0.25), end: Offset.zero).animate(
      CurvedAnimation(parent: _labelController, curve: Curves.easeOut),
    );

    // --- Icon bounce (plays once per step change) ---
    _iconBounceController = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _iconBounce = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _iconBounceController, curve: Curves.elasticOut),
    );
    _iconBounceController.value = 1.0; // start shown

    // --- Progress bar ---
    _progressController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))..value = 1 / _steps.length;
    _progressAnim = _progressController;

    // --- Shimmer sweep (repeating) ---
    _shimmerController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _shimmerAnim = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut),
    );

    // --- Step timer ---
    _timer = Timer.periodic(const Duration(milliseconds: 1400), (_) async {
      if (!mounted) return;
      await _labelController.reverse();
      if (!mounted) return;
      setState(() { _currentStep = (_currentStep + 1) % _steps.length; });
      _progressController.animateTo(
        (_currentStep + 1) / _steps.length,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
      // Icon bounce on step change
      _iconBounceController.forward(from: 0.0);
      _labelController.forward();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _entranceController.dispose();
    _spinController.dispose();
    _ripple1Controller.dispose();
    _ripple2Controller.dispose();
    _labelController.dispose();
    _iconBounceController.dispose();
    _progressController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final primary = context.primary;
    final step = _steps[_currentStep];

    return Center(
      child: FadeTransition(
        opacity: _entranceFade,
        child: ScaleTransition(
          scale: _entranceScale,
          child: Material(
            color: Colors.transparent,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 28),
              padding: const EdgeInsets.fromLTRB(28, 36, 28, 32),
              decoration: BoxDecoration(
                color: context.bg,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.20), blurRadius: 50, offset: const Offset(0, 24)),
                  BoxShadow(color: primary.withOpacity(0.12), blurRadius: 80, offset: const Offset(0, 12)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [

                  // ── Avatar + spinning arc + ripple rings ──────────────
                  SizedBox(
                    width: 110,
                    height: 110,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Ripple 2
                        AnimatedBuilder(
                          animation: _ripple2Controller,
                          builder: (_, __) => Transform.scale(
                            scale: _ripple2Scale.value,
                            child: Container(
                              width: 88, height: 88,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: primary.withOpacity(_ripple2Opacity.value), width: 2),
                              ),
                            ),
                          ),
                        ),
                        // Ripple 1
                        AnimatedBuilder(
                          animation: _ripple1Controller,
                          builder: (_, __) => Transform.scale(
                            scale: _ripple1Scale.value,
                            child: Container(
                              width: 88, height: 88,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: primary.withOpacity(_ripple1Opacity.value), width: 2),
                              ),
                            ),
                          ),
                        ),
                        // Spinning arc border
                        AnimatedBuilder(
                          animation: _spinController,
                          builder: (_, __) => Transform.rotate(
                            angle: _spinController.value * 2 * 3.14159,
                            child: CustomPaint(
                              size: const Size(84, 84),
                              painter: _ArcBorderPainter(color: primary),
                            ),
                          ),
                        ),
                        // Avatar
                        CompanyAvatar(
                          logoUrl: null,
                          symbol: widget.symbol,
                          size: 68,
                          borderRadius: 20,
                          fontSize: 28,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ── Step segment track ────────────────────────────────
                  Row(
                    children: List.generate(_steps.length, (i) {
                      final isActive = i == _currentStep;
                      final isDone  = i < _currentStep;
                      return Expanded(
                        child: Row(
                          children: [
                            Expanded(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 350),
                                curve: Curves.easeInOut,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: isDone ? context.halal : isActive ? primary : context.divider,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ),
                            if (i < _steps.length - 1) const SizedBox(width: 4),
                          ],
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 28),

                  // ── Icon bounce + label slide ─────────────────────────
                  FadeTransition(
                    opacity: _labelFade,
                    child: SlideTransition(
                      position: _labelSlide,
                      child: Column(
                        children: [
                          // Bouncing icon
                          ScaleTransition(
                            scale: _iconBounce,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Radial glow
                                Container(
                                  width: 72, height: 72,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: RadialGradient(
                                      colors: [primary.withOpacity(0.18), primary.withOpacity(0.0)],
                                    ),
                                  ),
                                ),
                                // Icon circle
                                Container(
                                  width: 52, height: 52,
                                  decoration: BoxDecoration(
                                    color: primary.withOpacity(0.12),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: primary.withOpacity(0.25), width: 1.5),
                                  ),
                                  child: Icon(step.icon, color: primary, size: 24),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            step.label,
                            style: TextStyle(color: context.textDark, fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: -0.4),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 5),
                          Text(
                            '${_currentStep + 1} / ${_steps.length}',
                            style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Progress bar with shimmer ─────────────────────────
                  AnimatedBuilder(
                    animation: Listenable.merge([_progressAnim, _shimmerAnim]),
                    builder: (_, __) {
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: SizedBox(
                          height: 6,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Track
                              Container(color: context.divider),
                              // Gradient fill
                              FractionallySizedBox(
                                widthFactor: _progressAnim.value,
                                alignment: Alignment.centerLeft,
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [primary.withOpacity(0.65), primary],
                                    ),
                                  ),
                                ),
                              ),
                              // Shimmer sweep (clipped to fill width)
                              FractionallySizedBox(
                                widthFactor: _progressAnim.value,
                                alignment: Alignment.centerLeft,
                                child: ShaderMask(
                                  shaderCallback: (rect) => LinearGradient(
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                    colors: [
                                      Colors.transparent,
                                      Colors.white.withOpacity(0.45),
                                      Colors.transparent,
                                    ],
                                    stops: [
                                      (_shimmerAnim.value - 0.3).clamp(0.0, 1.0),
                                      _shimmerAnim.value.clamp(0.0, 1.0),
                                      (_shimmerAnim.value + 0.3).clamp(0.0, 1.0),
                                    ],
                                  ).createShader(rect),
                                  blendMode: BlendMode.srcATop,
                                  child: Container(color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Paints a partial arc (dashed-look via short arc) used as the spinning border.
class _ArcBorderPainter extends CustomPainter {
  final Color color;
  const _ArcBorderPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    // Draw three short arcs, evenly spaced, for a "dashed ring" feel
    const gap = 0.35; // radians gap between arcs
    const sweep = (2 * 3.14159 - gap * 3) / 3;
    for (int i = 0; i < 3; i++) {
      final start = i * (sweep + gap);
      canvas.drawArc(rect, start, sweep, false, paint);
    }
  }

  @override
  bool shouldRepaint(_ArcBorderPainter old) => old.color != color;
}

class _LoadingStep {
  final IconData icon;
  final String label;
  const _LoadingStep({required this.icon, required this.label});
}

