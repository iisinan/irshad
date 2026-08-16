import 'package:flutter/material.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import '../../stocks/ui/stock_screener_screen.dart';
import '../../scanner/ui/scanner_screen.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/widgets/company_avatar.dart';
import 'package:irshad_mobile/features/profile/data/user_activity_repository.dart';
import 'package:irshad_mobile/core/providers/app_state_provider.dart';
import 'package:irshad_mobile/features/profile/ui/widgets/alert_preferences_bottom_sheet.dart';
import 'package:irshad_mobile/features/profile/ui/widgets/add_assets_bottom_sheet.dart';

class FavoritesScreen extends StatefulWidget {
  final bool isTab;
  const FavoritesScreen({super.key, this.isTab = false});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> with WidgetsBindingObserver {
  final _activityRepository = UserActivityRepository();
  List<Map<String, dynamic>> _watchlists = []; // Stocks from /watchlist
  List<Map<String, dynamic>> _favorites = []; // Products (and legacy stocks) from /favorites
  bool _isLoading = true;
  String _currentFilter = 'all';
  Timer? _syncTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchData();
    // Auto-sync every 15 seconds to keep in sync with frontend
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) => _syncDataSilently());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _syncTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _syncDataSilently();
    }
  }

  Future<void> _syncDataSilently() async {
    final isAuth = Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
    if (!isAuth) return;

    final favs = await _activityRepository.getFavorites();
    final watchlists = await _activityRepository.getWatchlist();

    if (mounted) {
      Provider.of<AppStateProvider>(context, listen: false).setWatchlistCount(favs.length + watchlists.length);
      setState(() {
        _favorites = favs;
        _watchlists = watchlists;
      });
    }
  }

  Future<void> _fetchData() async {
    final isAuth = Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
    if (!isAuth) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    setState(() => _isLoading = true);
    final favs = await _activityRepository.getFavorites();
    final watchlists = await _activityRepository.getWatchlist();

    if (mounted) {
      Provider.of<AppStateProvider>(context, listen: false).setWatchlistCount(favs.length + watchlists.length);
      setState(() {
        _favorites = favs;
        _watchlists = watchlists;
        _isLoading = false;
      });
    }
  }

  void _removeFavorite(int favoriteId) async {
    final success = await _activityRepository.removeFromFavorites(favoriteId);
    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Removed from watchlist'), behavior: SnackBarBehavior.floating, backgroundColor: context.textDark));
      }
      _fetchData();
    }
  }

  void _removeWatchlist(String symbol) async {
    final success = await _activityRepository.removeFromWatchlist(symbol);
    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Removed $symbol from watchlist'), behavior: SnackBarBehavior.floating, backgroundColor: context.textDark));
      }
      _fetchData();
    }
  }

  List<Map<String, dynamic>> get _combinedItems {
    List<Map<String, dynamic>> combined = [];
    
    // Add watchlists (Stocks)
    for (var w in _watchlists) {
      combined.add({
        'is_product': false,
        'data': w,
        'id': w['id'],
        'symbol': w['symbol'],
        'name': w['name'],
        'status': w['status']?.toString().toLowerCase(),
      });
    }

    // Add favorites (Products, and filter out stocks if we want, or keep them)
    for (var f in _favorites) {
      final isProduct = f['type'] == 'product';
      final item = f['item'];
      if (item != null) {
        combined.add({
          'is_product': isProduct,
          'is_legacy_favorite': true, // so we know how to delete/update it
          'data': f,
          'id': f['id'],
          'symbol': isProduct ? item['name'] : item['symbol'],
          'name': isProduct ? (item['brand'] ?? 'Market Listed') : item['name'],
          'status': isProduct 
            ? item['status']?.toString().toLowerCase() 
            : item['status']?['status']?.toString().toLowerCase(),
        });
      }
    }

    // Filter
    if (_currentFilter == 'compliant') {
      combined = combined.where((c) => c['status'] == 'halal' || c['status'] == 'compliant').toList();
    } else if (_currentFilter == 'non-compliant') {
      combined = combined.where((c) => c['status'] == 'non-halal' || c['status'] == 'non-compliant').toList();
    } else if (_currentFilter == 'doubtful') {
      combined = combined.where((c) => c['status'] == 'doubtful').toList();
    } else if (_currentFilter == 'purify') {
      combined = []; // Watchlist items do not track purification yet
    }

    return combined;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: widget.isTab ? null : AppBar(
        title: Text('Watchlist & Alerts', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          if (widget.isTab)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: context.bg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.divider, width: 1.5),
                        ),
                        child: Icon(Icons.visibility_rounded, color: context.primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Watchlist & Alerts', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                          Text('Track assets & receive instant status alerts', style: TextStyle(color: context.textMuted, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: context.divider, width: 1.5),
                    ),
                    child: Text(
                      '${_combinedItems.length} Assets',
                      style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          _buildFilterBar(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _combinedItems.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _fetchData,
                        color: context.primary,
                        backgroundColor: context.bgAlt,
                        child: ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
                          itemCount: _combinedItems.length,
                          itemBuilder: (context, index) {
                            return _buildCard(_combinedItems[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 90),
        child: FloatingActionButton(
          heroTag: 'add_assets_fab',
          onPressed: () => _showAddBottomSheet(context),
          backgroundColor: context.primary,
          elevation: 6,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.divider.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                _buildFilterChip('all', 'All', Icons.layers_rounded, context.primary),
                const SizedBox(width: 4),
                _buildFilterChip('compliant', 'Shariah Compliant', Icons.verified_user_rounded, context.halal),
                const SizedBox(width: 4),
                _buildFilterChip('purify', 'Shariah Compliant (Purify)', Icons.water_drop_rounded, context.questionable),
                const SizedBox(width: 4),
                _buildFilterChip('doubtful', 'Doubtful', Icons.help_outline_rounded, context.questionable),
                const SizedBox(width: 4),
                _buildFilterChip('non-compliant', 'Shariah Non-Compliant', Icons.warning_amber_rounded, context.haram),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, IconData icon, Color activeColor) {
    final isSelected = _currentFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _currentFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? context.bg : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))] : null,
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: isSelected ? activeColor : context.textMuted),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? activeColor : context.textMuted,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> itemWrapper) {
    final bool isProduct = itemWrapper['is_product'];
    final bool isLegacyFavorite = itemWrapper['is_legacy_favorite'] == true;
    final data = itemWrapper['data'];
    final status = itemWrapper['status'];

    bool isHalal = status == 'halal' || status == 'compliant';
    bool isNonHalal = status == 'non-halal' || status == 'non-compliant';
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);
    String statusText = isHalal ? 'Shariah Compliant' : (isNonHalal ? 'Shariah Non-Compliant' : 'Doubtful');

    bool hasAlerts = false;
    if (isLegacyFavorite || isProduct) {
      hasAlerts = (data['alert_whatsapp'] == true) || (data['alert_email'] == true);
    } else {
      hasAlerts = (data['alert_email'] == true) || 
                  (data['alert_inapp'] == true) || 
                  (data['alert_push'] == true) || 
                  (data['alert_verdict_change'] == true) || 
                  (data['alert_compliance_risk'] == true) || 
                  (data['alert_price_change'] == true) || 
                  (data['alert_weekly_digest'] == true);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
      ),
      child: InkWell(
        onTap: () {
          if (isProduct) {
            Navigator.pushNamed(context, '/product_details', arguments: data['item']);
          } else {
            // For watchlists, we might just have the symbol. We need to pass enough for stock details or fetch it.
            // If it's a legacy favorite, data['item'] is the full company.
            final stockData = isLegacyFavorite ? data['item'] : {'symbol': data['symbol'], 'name': data['name']};
            Navigator.pushNamed(context, '/stock_details', arguments: stockData);
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  isProduct 
                    ? Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(12)),
                        child: Icon(isHalal ? Icons.check_circle_rounded : Icons.cancel_rounded, color: statusColor),
                      )
                    : CompanyAvatar(symbol: itemWrapper['symbol'], size: 44, logoUrl: null),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(itemWrapper['symbol'], style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16)),
                        const SizedBox(height: 2),
                        Text(itemWrapper['name'], maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: context.textMuted, fontSize: 13)),
                      ],
                    ),
                  ),
                  if (!isProduct && !isLegacyFavorite) ...[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('₦${data['price']?.toStringAsFixed(2) ?? '0.00'}', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16)),
                        const SizedBox(height: 2),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              (data['change'] ?? 0) >= 0 ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                              size: 14,
                              color: (data['change'] ?? 0) >= 0 ? context.halal : context.haram,
                            ),
                            Text(
                              '${(data['change'] ?? 0).abs()}%',
                              style: TextStyle(
                                color: (data['change'] ?? 0) >= 0 ? context.halal : context.haram,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    )
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(6)),
                    child: Text(statusText, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => AlertPreferencesBottomSheet(
                              item: data,
                              isProduct: isProduct || isLegacyFavorite,
                              onSave: (prefs) async {
                                if (isLegacyFavorite || isProduct) {
                                  await _activityRepository.updateFavoriteAlerts(
                                    data['id'],
                                    prefs['alert_whatsapp'] ?? false,
                                    prefs['alert_email'] ?? false,
                                  );
                                } else {
                                  await _activityRepository.updateWatchlistAlerts(data['symbol'], prefs);
                                }
                                _fetchData();
                              },
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: hasAlerts ? context.primary.withValues(alpha: 0.1) : Colors.transparent,
                            border: Border.all(color: hasAlerts ? context.primary : context.divider),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                hasAlerts ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, 
                                size: 14, 
                                color: hasAlerts ? context.primary : context.textMuted
                              ),
                              const SizedBox(width: 6),
                              Text(
                                hasAlerts ? 'Alerts On' : 'Alerts', 
                                style: TextStyle(
                                  fontSize: 12, 
                                  fontWeight: FontWeight.w700, 
                                  color: hasAlerts ? context.primary : context.textDark
                                )
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: Icon(Icons.delete_outline_rounded, color: context.textMuted, size: 20),
                        onPressed: () {
                          if (isLegacyFavorite || isProduct) {
                            _removeFavorite(data['id']);
                          } else {
                            _removeWatchlist(data['symbol']);
                          }
                        },
                        constraints: const BoxConstraints(),
                        padding: EdgeInsets.zero,
                      ),
                    ],
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: context.divider, style: BorderStyle.none),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.primary.withValues(alpha: 0.1)),
              ),
              child: Icon(Icons.star_rounded, size: 48, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text('No Alerts Set', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
            const SizedBox(height: 12),
            Text(
              'Keep an eye on promising stocks. Set an alert to track their Shariah compliance status and daily performance.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 32),
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StockScreenerScreen())),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                decoration: BoxDecoration(
                  color: context.primary,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.bar_chart_rounded, color: Colors.white, size: 20),
                    SizedBox(width: 8),
                    Text('Explore Market', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                  ],
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildAddOption({required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: context.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(color: context.textMuted, fontSize: 13)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.textMuted),
          ],
        ),
      ),
    );
  }

  void _showAddBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => AddAssetsBottomSheet(
        currentWatchlistSymbols: _watchlists.map((w) => w['symbol'] as String).toList(),
        onAdded: _fetchData,
      ),
    );
  }
}
