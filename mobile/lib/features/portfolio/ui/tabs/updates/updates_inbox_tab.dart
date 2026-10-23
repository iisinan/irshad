import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'updates_digest_tab.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:irshad_mobile/features/stocks/ui/stock_detail_screen.dart';
import 'package:irshad_mobile/features/profile/providers/alerts_provider.dart';

class UpdatesInboxTab extends StatefulWidget {
  final ValueChanged<int>? onUnreadCountChanged;
  const UpdatesInboxTab({super.key, this.onUnreadCountChanged});

  @override
  State<UpdatesInboxTab> createState() => _UpdatesInboxTabState();
}

class _UpdatesInboxTabState extends State<UpdatesInboxTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _notifications = [];
  String _activeCategory = 'all';
  int _currentPage = 1;
  int _lastPage = 1;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, dynamic>> _categories = [
    {'id': 'all', 'label': 'All'},
    {'id': 'price_alerts', 'label': 'Price Alerts'},
    {'id': 'screening', 'label': 'Screening'},
    {'id': 'digest', 'label': 'Digest'},
    {'id': 'portfolio', 'label': 'Portfolio'},
    {'id': 'system', 'label': 'System'},
  ];

  Set<String> _userAlertSymbols = {};

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _initData();
  }

  Future<void> _initData() async {
    await _loadCachedAlertSymbols();
    await _fetchInbox();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _currentPage < _lastPage) {
      _loadMore();
    }
  }

  Future<void> _loadCachedAlertSymbols() async {
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedSymbols = box.get('user_alert_symbols');
      if (cachedSymbols is List && cachedSymbols.isNotEmpty) {
        _userAlertSymbols = cachedSymbols.map((e) => e.toString().toUpperCase().trim()).toSet();
      }
    } catch (_) {}
  }

  Future<void> _fetchUserAlertSymbols() async {
    final Set<String> symbols = {};
    // 1. Fetch active alerts from /alerts
    try {
      final alertsRes = await ApiService().get('alerts');
      final rawAlerts = alertsRes.data['data'] ?? alertsRes.data['alerts'] ?? [];
      if (rawAlerts is List) {
        for (final a in rawAlerts) {
          if (a is Map) {
            final active = a['active'] ?? a['is_active'] ?? true;
            final symbol = (a['symbol'] ?? '').toString().toUpperCase().trim();
            if (active == true && symbol.isNotEmpty) {
              symbols.add(symbol);
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching active alerts: $e');
    }

    // 2. Fetch watchlist stocks where any alert is enabled
    try {
      final watchlistRes = await ApiService().get('watchlist');
      final rawWatchlist = watchlistRes.data is List
          ? watchlistRes.data as List
          : (watchlistRes.data is Map && watchlistRes.data['data'] is List ? watchlistRes.data['data'] as List : []);
      for (final w in rawWatchlist) {
        if (w is Map) {
          final bool hasDelivery = (w['alert_inapp'] == true) || (w['alert_push'] == true) || (w['alert_email'] == true);
          final bool hasType = (w['alert_verdict_change'] == true) ||
              (w['alert_compliance_risk'] == true) ||
              (w['alert_price_change'] == true);
          final bool hasAlert = (hasDelivery && hasType) ||
              (w['alert_verdict_change'] == true) ||
              (w['alert_compliance_risk'] == true) ||
              (w['alert_price_change'] == true);
          final symbol = (w['symbol'] ?? '').toString().toUpperCase().trim();
          if (hasAlert && symbol.isNotEmpty) {
            symbols.add(symbol);
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching watchlist alerts: $e');
    }

    // 3. Portfolio Holdings (for dividend/portfolio alerts on owned stocks)
    try {
      final holdingsRes = await ApiService().get('portfolio/holdings');
      final rawHoldings = holdingsRes.data is List
          ? holdingsRes.data as List
          : (holdingsRes.data is Map && holdingsRes.data['data'] is List ? holdingsRes.data['data'] as List : []);
      for (final h in rawHoldings) {
        if (h is Map) {
          final symbol = (h['symbol'] ?? '').toString().toUpperCase().trim();
          if (symbol.isNotEmpty) {
            symbols.add(symbol);
          }
        }
      }
    } catch (_) {}

    _userAlertSymbols = symbols;

    // Cache to Hive
    try {
      final box = await Hive.openBox('updatesBox');
      await box.put('user_alert_symbols', symbols.toList());
    } catch (_) {}
  }

  List<dynamic> _sanitizeNotifications(List<dynamic> rawList) {
    return rawList.where((n) {
      if (n is! Map) return false;
      final title = (n['title'] ?? '').toString();
      final message = (n['message'] ?? '').toString();
      final category = (n['category'] ?? '').toString().toLowerCase();

      // Exclude test category or simulated alerts
      if (category == 'test' || category == 'sample') return false;
      final meta = n['meta'] is Map ? n['meta'] as Map : null;
      if (meta != null && meta['type'] == 'test') return false;
      if (title.contains('DANGCEM 🎯') || message.contains('DANGCEM reached your target price')) {
        return false;
      }
      if (title.contains('Compliance Risk Warning: MTNN ⚠️')) {
        return false;
      }
      if (title.toLowerCase().startsWith('test:') || title.toLowerCase().startsWith('[test]')) {
        return false;
      }

      // Check unreal dates: before 2024 or future beyond next year
      final created = n['created_at'];
      if (created != null && created.toString().isNotEmpty) {
        final dt = DateTime.tryParse(created.toString());
        if (dt != null) {
          if (dt.year < 2024 || dt.year > DateTime.now().year + 1) {
            return false;
          }
        }
      }

      // STRICT CHECK: The inbox and notification should ONLY show what the user selected for his alerts
      final symbol = _extractSymbol(n);
      if (symbol != null && symbol.isNotEmpty) {
        if (!_userAlertSymbols.contains(symbol)) {
          return false;
        }
      } else {
        // Non-symbol notifications must be valid system or digest announcements
        if (category != 'system' && category != 'digest' && category != 'security') {
          return false;
        }
      }

      return true;
    }).toList();
  }

  Future<void> _fetchInbox({bool loadMore = false}) async {
    if (!loadMore) {
      setState(() {
        _isLoading = _notifications.isEmpty;
        _currentPage = 1;
      });
    }

    // 1. Try cache first
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedStr = box.get('inbox_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final list = cached['data'];
        if (mounted && list is List && list.isNotEmpty && _notifications.isEmpty) {
          final cleanList = _sanitizeNotifications(list);
          if (cleanList.isNotEmpty) {
            setState(() {
              _notifications = List<dynamic>.from(cleanList);
              _isLoading = false;
            });
            _notifyUnread();
          }
        }
      }
    } catch (_) {}

    // 2. Refresh active user alert symbols
    if (!loadMore) {
      await _fetchUserAlertSymbols();
    }

    // 3. Fetch live data silently
    try {
      final response = await ApiService().get('notifications/inbox', queryParameters: {
        'page': _currentPage,
      });
      if (response.statusCode == 200) {
        if (mounted) {
          final rawData = response.data['data'] ?? [];
          final pagination = response.data['pagination'];
          final data = rawData is List ? _sanitizeNotifications(rawData) : [];

          if (_currentPage == 1) {
            try {
              final box = await Hive.openBox('updatesBox');
              if (data.isNotEmpty) {
                await box.put(
                  'inbox_data',
                  jsonEncode({
                    'data': data,
                    'expiry': DateTime.now().add(const Duration(minutes: 5)).millisecondsSinceEpoch,
                  }),
                );
              } else {
                await box.delete('inbox_data');
              }
            } catch (_) {}
          }

          setState(() {
            if (loadMore) {
              _notifications.addAll(List<dynamic>.from(data));
              _isLoadingMore = false;
            } else {
              _notifications = List<dynamic>.from(data);
              _isLoading = false;
            }
            if (pagination != null) {
              _lastPage = pagination['last_page'] ?? 1;
            }
          });
          _notifyUnread();
        }
      } else {
        if (mounted) {
          setState(() {
            if (_notifications.isEmpty) _error = 'Failed to fetch inbox';
            _isLoading = false;
            _isLoadingMore = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (_notifications.isEmpty) _error = 'Error loading inbox';
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  void _notifyUnread() {
    final unread = _notifications.where((n) {
      if (n is Map) return n['read_at'] == null;
      return false;
    }).length;
    widget.onUnreadCountChanged?.call(unread);
  }

  Future<void> _loadMore() async {
    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });
    await _fetchInbox(loadMore: true);
  }

  Future<void> _markAsRead(int id) async {
    try {
      await ApiService().put('notifications/$id/read', {});
      setState(() {
        final index = _notifications.indexWhere((n) => n['id'] == id);
        if (index != -1) {
          _notifications[index]['read_at'] = DateTime.now().toIso8601String();
        }
      });
      _notifyUnread();
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiService().put('notifications/read-all', {});
      setState(() {
        for (var n in _notifications) {
          n['read_at'] = DateTime.now().toIso8601String();
        }
      });
      _notifyUnread();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('All notifications marked as read'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {}
  }

  void _archiveNotificationWithUndo(Map<String, dynamic> item) {
    final id = item['id'];
    final index = _notifications.indexWhere((n) => n['id'] == id);
    if (index == -1) return;

    final removedItem = _notifications[index];
    setState(() => _notifications.removeAt(index));
    _notifyUnread();

    bool undone = false;
    ScaffoldMessenger.of(context).removeCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Notification archived',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: const Color(0xFF6EE7B7),
          onPressed: () {
            undone = true;
            setState(() => _notifications.insert(index, removedItem));
            _notifyUnread();
          },
        ),
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ).closed.then((reason) async {
      if (!undone) {
        try {
          await ApiService().put('notifications/$id/archive', {});
        } catch (_) {}
      }
    });
  }

  void _dismissNotificationWithUndo(Map<String, dynamic> item) {
    final id = item['id'];
    final index = _notifications.indexWhere((n) => n['id'] == id);
    if (index == -1) return;

    final removedItem = _notifications[index];
    setState(() => _notifications.removeAt(index));
    _notifyUnread();

    bool undone = false;
    ScaffoldMessenger.of(context).removeCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Notification dismissed',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: const Color(0xFF6EE7B7),
          onPressed: () {
            undone = true;
            setState(() => _notifications.insert(index, removedItem));
            _notifyUnread();
          },
        ),
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ).closed.then((reason) async {
      if (!undone) {
        try {
          await ApiService().delete('notifications/$id');
        } catch (_) {}
      }
    });
  }

  Future<void> _clearAllNotifications() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Clear Notifications?',
          style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3),
        ),
        content: Text(
          'This will remove all notifications from your inbox.',
          style: TextStyle(color: context.textMuted, fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Clear All', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      setState(() => _notifications.clear());
      _notifyUnread();
      await ApiService().delete('notifications/clear-all');
      final box = await Hive.openBox('updatesBox');
      await box.delete('inbox_data');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('All notifications cleared'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {}
  }

  String _formatTimeAgo(dynamic dateVal) {
    if (dateVal == null || dateVal.toString().trim().isEmpty) return '';
    try {
      final str = dateVal.toString().trim();
      DateTime dt;
      if (!str.endsWith('Z') && !str.contains('+') && !str.contains('-')) {
        dt = DateTime.tryParse('${str.replaceAll(' ', 'T')}Z')?.toLocal() ?? DateTime.parse(str).toLocal();
      } else {
        dt = DateTime.parse(str).toLocal();
      }

      final now = DateTime.now();
      // Filter out unreal dates (e.g. invalid year before 2024 or far future)
      if (dt.year < 2024 || dt.year > now.year + 1) {
        return '';
      }

      final difference = now.difference(dt);

      if (difference.isNegative || difference.inSeconds < 60) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours}h ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else if (dt.year == now.year) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${months[dt.month - 1]} ${dt.day}';
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
      }
    } catch (_) {
      return '';
    }
  }

  String? _extractSymbol(dynamic rawItem) {
    if (rawItem is! Map) return null;
    final item = Map<String, dynamic>.from(rawItem);
    if (item['meta'] is Map && item['meta']['symbol'] != null) {
      return item['meta']['symbol'].toString().toUpperCase();
    }
    if (item['company'] is Map && item['company']['symbol'] != null) {
      return item['company']['symbol'].toString().toUpperCase();
    }
    final actionUrl = item['action_url']?.toString();
    if (actionUrl != null && (actionUrl.contains('/stocks/') || actionUrl.contains('/market/'))) {
      final sanitized = actionUrl.replaceAll('/stocks/', '/market/');
      final parts = sanitized.split('/market/').last.split('?').first.split('/');
      if (parts.isNotEmpty && parts.first.isNotEmpty) {
        return parts.first.toUpperCase();
      }
    }
    final title = item['title']?.toString() ?? '';
    final regex = RegExp(r'[:—\-]\s*([A-Za-z0-9\.]+)\b');
    final match = regex.firstMatch(title);
    if (match != null) {
      final candidate = match.group(1)!.trim().replaceAll('🎯', '').replaceAll('🔔', '').replaceAll('⚠️', '').trim().toUpperCase();
      if (candidate.length >= 2 && candidate.length <= 10 && candidate != 'STATUS' && candidate != 'CHANGED') {
        return candidate;
      }
    }
    final leadingRegex = RegExp(r'^([A-Za-z0-9\.]+)\s*[:—\-]');
    final leadingMatch = leadingRegex.firstMatch(title);
    if (leadingMatch != null) {
      final candidate = leadingMatch.group(1)!.trim().toUpperCase();
      if (candidate.length >= 2 && candidate.length <= 10) {
        return candidate;
      }
    }
    return null;
  }

  String _resolveCategory(dynamic rawItem) {
    if (rawItem is! Map) return 'system';
    final item = Map<String, dynamic>.from(rawItem);
    final explicitCat = item['category']?.toString();
    if (explicitCat != null && explicitCat != 'system' && explicitCat.isNotEmpty) {
      return explicitCat;
    }
    final title = (item['title'] ?? '').toString().toLowerCase();
    final message = (item['message'] ?? '').toString().toLowerCase();
    if (title.contains('price') || title.contains('target') || title.contains('🎯') || message.contains('target price')) {
      return 'price_alerts';
    }
    if (title.contains('compliance') || title.contains('screening') || title.contains('halal') || title.contains('status changed') || title.contains('aaoifi') || message.contains('aaoifi') || title.contains('⚠️')) {
      return 'screening';
    }
    if (title.contains('digest') || message.contains('digest') || title.contains('📧')) {
      return 'digest';
    }
    if (title.contains('portfolio') || title.contains('dividend') || message.contains('holdings')) {
      return 'portfolio';
    }
    return explicitCat ?? 'system';
  }

  Widget _getIconForCategory(String category) {
    switch (category) {
      case 'price_alerts':
      case 'price_alert':
        return const Icon(Icons.notifications_active_rounded, color: Color(0xFFD97706), size: 18);
      case 'screening':
      case 'compliance':
        return const Icon(Icons.shield_outlined, color: Color(0xFF059669), size: 18);
      case 'digest':
        return const Icon(Icons.auto_stories_rounded, color: Color(0xFF4F46E5), size: 18);
      case 'portfolio':
        return const Icon(Icons.trending_up_rounded, color: Color(0xFF7E22CE), size: 18);
      case 'security':
        return const Icon(Icons.lock_outline_rounded, color: Color(0xFFE11D48), size: 18);
      case 'market_news':
        return const Icon(Icons.bar_chart_rounded, color: Color(0xFF0284C7), size: 18);
      default:
        return const Icon(Icons.notifications_none_rounded, color: Color(0xFF475569), size: 18);
    }
  }

  Color _getBgColorForCategory(String category) {
    switch (category) {
      case 'price_alerts':
      case 'price_alert':
        return const Color(0xFFFEF3C7);
      case 'screening':
      case 'compliance':
        return const Color(0xFFD1FAE5);
      case 'digest':
        return const Color(0xFFEEF2FF);
      case 'portfolio':
        return const Color(0xFFF3E8FF);
      case 'security':
        return const Color(0xFFFFE4E6);
      case 'market_news':
        return const Color(0xFFE0F2FE);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'price_alerts':
      case 'price_alert':
        return 'Price Alert';
      case 'screening':
      case 'compliance':
        return 'Screening';
      case 'digest':
        return 'Irshad Digest';
      case 'portfolio':
        return 'Portfolio';
      case 'security':
        return 'Security';
      case 'market_news':
        return 'Market';
      default:
        return 'System';
    }
  }

  Color _getCategoryTextColor(String category) {
    switch (category) {
      case 'price_alerts':
      case 'price_alert':
        return const Color(0xFFB45309);
      case 'screening':
      case 'compliance':
        return const Color(0xFF047857);
      case 'digest':
        return const Color(0xFF4338CA);
      case 'portfolio':
        return const Color(0xFF7E22CE);
      case 'security':
        return const Color(0xFFBE123C);
      case 'market_news':
        return const Color(0xFF0369A1);
      default:
        return const Color(0xFF334155);
    }
  }

  void _handleNotificationTap(Map<String, dynamic> item) {
    final isUnread = item['read_at'] == null;
    if (isUnread) {
      _markAsRead(item['id']);
    }

    final category = _resolveCategory(item);
    final meta = item['meta'] is Map ? Map<String, dynamic>.from(item['meta']) : null;
    final symbol = _extractSymbol(item);

    // 1. Digest Notification
    if (category == 'digest' || item['title'] == 'Irshad Digest is Ready') {
      if (meta != null && (meta['top_gainers'] != null || meta['user_performances'] != null || meta['compliance_changes'] != null)) {
        _showDigestViewer(context, meta);
      } else {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => Container(
            decoration: BoxDecoration(
              color: context.bg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.only(top: 16),
            child: const UpdatesDigestTab(),
          ),
        );
      }
      return;
    }

    // 2. Stock Target or Compliance Notification with symbol
    if (symbol != null && symbol.isNotEmpty) {
      StockDetailScreen.openWithLoading(context, {
        'symbol': symbol,
        if (category == 'screening') 'initialTab': 1,
      });
      return;
    }

    // 3. Action URL routing
    final actionUrl = item['action_url']?.toString();
    if (actionUrl == '/alerts') {
      Navigator.pushNamed(context, '/alerts');
      return;
    }

    // 4. Fallback: Show detail bottom sheet modal
    _showNotificationDetailModal(context, item);
  }

  void _showNotificationDetailModal(BuildContext context, Map<String, dynamic> item) {
    final category = _resolveCategory(item);
    final symbol = _extractSymbol(item);
    final meta = item['meta'] is Map ? Map<String, dynamic>.from(item['meta']) : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.textMuted.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _getBgColorForCategory(category),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _getIconForCategory(category),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _getBgColorForCategory(category),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _getCategoryLabel(category).toUpperCase(),
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: _getCategoryTextColor(category),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatTimeAgo(item['created_at']),
                          style: TextStyle(fontSize: 12, color: context.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                item['title'] ?? '',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: context.textDark,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                item['message'] ?? '',
                style: TextStyle(
                  fontSize: 14.5,
                  color: context.textMuted,
                  height: 1.5,
                ),
              ),
              if (meta != null && meta.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: context.appColors.divider),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Details',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textDark),
                      ),
                      const SizedBox(height: 8),
                      ...meta.entries.where((e) => e.value != null && e.key != 'type').map((e) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              e.key.replaceAll('_', ' ').toUpperCase(),
                              style: TextStyle(fontSize: 11.5, color: context.textMuted, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              e.value.toString(),
                              style: TextStyle(fontSize: 12, color: context.textDark, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      )),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              if (symbol != null && symbol.isNotEmpty)
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    StockDetailScreen.openWithLoading(context, {'symbol': symbol});
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Text(
                    'View Stock ($symbol)',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Colors.white),
                  ),
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  int _countForCategory(String catId, List<dynamic> source) {
    if (catId == 'all') {
      return source.where((n) {
        final c = _resolveCategory(n);
        return c != 'market_news' && c != 'business_activity';
      }).length;
    }
    return source.where((n) => _resolveCategory(n) == catId).length;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: context.textMuted),
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchInbox(),
              style: ElevatedButton.styleFrom(backgroundColor: context.primary),
              child: const Text('Try Again', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    final alertsProvider = context.watch<AlertsProvider>();
    final Set<String> activeProviderSymbols = alertsProvider.alerts
        .where((a) => a['active'] == true)
        .map((a) => (a['symbol'] ?? '').toString().toUpperCase().trim())
        .where((s) => s.isNotEmpty)
        .toSet();

    final Set<String> inactiveProviderSymbols = alertsProvider.alerts
        .where((a) => a['active'] == false)
        .map((a) => (a['symbol'] ?? '').toString().toUpperCase().trim())
        .where((s) => s.isNotEmpty)
        .toSet();

    final effectiveAlertSymbols = {..._userAlertSymbols, ...activeProviderSymbols}
        .difference(inactiveProviderSymbols);

    final displayNotifications = _notifications.where((n) {
      if (n is! Map) return false;
      final symbol = _extractSymbol(n);
      if (symbol != null && symbol.isNotEmpty) {
        if (!effectiveAlertSymbols.contains(symbol)) {
          return false;
        }
      } else {
        final cat = (n['category'] ?? '').toString().toLowerCase();
        if (cat != 'system' && cat != 'digest' && cat != 'security') {
          return false;
        }
      }
      return true;
    }).toList();

    final filteredNotifications = displayNotifications.where((n) {
      final cat = _resolveCategory(n);
      if (_activeCategory != 'all' && cat != _activeCategory) {
        return false;
      }
      return cat != 'market_news' && cat != 'business_activity';
    }).toList();

    final unreadCount = filteredNotifications.where((n) => n['read_at'] == null).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Categories Filter Chips with Mini-Badges
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: _categories.map((cat) {
              final isActive = _activeCategory == cat['id'];
              final count = _countForCategory(cat['id'], displayNotifications);

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _activeCategory = cat['id'];
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7.5),
                  decoration: BoxDecoration(
                    color: isActive ? context.primary : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive ? context.primary : const Color(0xFFE2E8F0),
                      width: isActive ? 1.4 : 1,
                    ),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: context.primary.withValues(alpha: 0.25),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 3,
                              offset: const Offset(0, 1),
                            ),
                          ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        cat['label'],
                        style: TextStyle(
                          fontWeight: isActive ? FontWeight.w800 : FontWeight.w700,
                          fontSize: 12.5,
                          color: isActive ? Colors.white : const Color(0xFF334155),
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: isActive ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            count.toString(),
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: isActive ? Colors.white : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        // 2. Micro Utility Sub-Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left status
              if (unreadCount > 0)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: context.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: context.primary.withValues(alpha: 0.5),
                            blurRadius: 4,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '$unreadCount unread ${unreadCount == 1 ? 'alert' : 'alerts'}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: context.primary,
                      ),
                    ),
                  ],
                )
              else if (filteredNotifications.isNotEmpty)
                Text(
                  'All caught up (${filteredNotifications.length})',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                )
              else
                const SizedBox.shrink(),

              // Right micro-actions
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (unreadCount > 0)
                    InkWell(
                      onTap: _markAllAsRead,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: context.primary.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.done_all_rounded, size: 13, color: context.primary),
                            const SizedBox(width: 4),
                            Text(
                              'Mark all read',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: context.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (filteredNotifications.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: _clearAllNotifications,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.delete_sweep_outlined, size: 13, color: Color(0xFF64748B)),
                            SizedBox(width: 3),
                            Text(
                              'Clear',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),

        // 3. Notification List or Empty State
        if (filteredNotifications.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: context.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _activeCategory == 'all'
                          ? Icons.notifications_none_rounded
                          : Icons.filter_list_off_rounded,
                      size: 38,
                      color: context.primary,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    _activeCategory == 'all' ? 'All Caught Up!' : 'No Alerts in this Category',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: context.textDark,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _activeCategory == 'all'
                        ? 'You have no alerts right now. Active stock price alerts, AAOIFI Shariah compliance changes, and your Irshad Digest will appear here.'
                        : 'No notifications matched the selected filter.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF64748B),
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          await Navigator.pushNamed(context, '/alerts');
                          if (mounted) _fetchInbox();
                        },
                        icon: const Icon(Icons.tune_rounded, size: 16, color: Colors.white),
                        label: const Text('Manage Active Alerts', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          elevation: 0,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 6, 20, 36),
            itemCount: filteredNotifications.length,
            itemBuilder: (context, index) {
              final item = filteredNotifications[index];
              final isUnread = item['read_at'] == null;
              final category = _resolveCategory(item);
              final symbol = _extractSymbol(item);

              return Dismissible(
                key: Key('notif_${item['id']}_$index'),
                direction: DismissDirection.horizontal,
                background: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0EA5E9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.centerLeft,
                  child: const Row(
                    children: [
                      Icon(Icons.archive_outlined, color: Colors.white, size: 20),
                      SizedBox(width: 6),
                      Text('Archive', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                ),
                secondaryBackground: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.centerRight,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      SizedBox(width: 6),
                      Icon(Icons.delete_outline_rounded, color: Colors.white, size: 20),
                    ],
                  ),
                ),
                onDismissed: (direction) {
                  if (direction == DismissDirection.startToEnd) {
                    _archiveNotificationWithUndo(item);
                  } else {
                    _dismissNotificationWithUndo(item);
                  }
                },
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _handleNotificationTap(item),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isUnread ? const Color(0xFFFAFDFA) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isUnread
                            ? context.primary.withValues(alpha: 0.4)
                            : const Color(0xFFE2E8F0),
                        width: isUnread ? 1.5 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isUnread
                              ? context.primary.withValues(alpha: 0.08)
                              : Colors.black.withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (isUnread)
                              Container(
                                width: 4.5,
                                color: context.primary,
                              ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.all(15),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                        // Top row: Category Chip + Symbol Badge + Time + Unread Dot
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _getBgColorForCategory(category),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _getIconForCategory(category),
                                      const SizedBox(width: 4),
                                      Text(
                                        _getCategoryLabel(category).toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          color: _getCategoryTextColor(category),
                                          letterSpacing: 0.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (symbol != null && symbol.isNotEmpty) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: Text(
                                      symbol,
                                      style: const TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF0F172A),
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            Row(
                              children: [
                                Text(
                                  _formatTimeAgo(item['created_at']),
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                                if (isUnread) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: context.primary,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: context.primary.withValues(alpha: 0.5),
                                          blurRadius: 4,
                                          spreadRadius: 1,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Title
                        Text(
                          item['title'] ?? '',
                          style: TextStyle(
                            fontWeight: isUnread ? FontWeight.w900 : FontWeight.w800,
                            fontSize: 14.5,
                            color: const Color(0xFF0F172A),
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 5),

                        // Message (High contrast, never faded)
                        Text(
                          item['message'] ?? '',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF475569),
                            height: 1.45,
                            fontWeight: FontWeight.w500,
                          ),
                        ),

                        // Bottom Action Row
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            if (symbol != null && symbol.isNotEmpty && category == 'screening')
                              GestureDetector(
                                onTap: () => _handleNotificationTap(item),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFD1FAE5),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFF059669).withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.shield_outlined, size: 12, color: Color(0xFF047857)),
                                      const SizedBox(width: 4),
                                      Text(
                                        'View Compliance ($symbol)',
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF047857),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF047857)),
                                    ],
                                  ),
                                ),
                              )
                            else if (symbol != null && symbol.isNotEmpty)
                              GestureDetector(
                                onTap: () => _handleNotificationTap(item),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
                                  decoration: BoxDecoration(
                                    color: context.primary.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.trending_up_rounded, size: 13, color: context.primary),
                                      const SizedBox(width: 4),
                                      Text(
                                        item['action_label'] ?? 'View $symbol',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w800,
                                          color: context.primary,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_rounded, size: 12, color: context.primary),
                                    ],
                                  ),
                                ),
                              )
                            else if (category == 'digest' || item['title'] == 'Irshad Digest is Ready')
                              GestureDetector(
                                onTap: () => _handleNotificationTap(item),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEEF2FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.25)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.auto_stories_rounded, size: 12, color: Color(0xFF4338CA)),
                                      SizedBox(width: 4),
                                      Text(
                                        'Read Digest',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF4338CA),
                                        ),
                                      ),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF4338CA)),
                                    ],
                                  ),
                                ),
                              )
                            else
                              GestureDetector(
                                onTap: () => _handleNotificationTap(item),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'View Details',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF334155),
                                        ),
                                      ),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF334155)),
                                    ],
                                  ),
                                ),
                              ),

                            // Quick card actions
                            Row(
                              children: [
                                if (isUnread)
                                  GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => _markAsRead(item['id']),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                      margin: const EdgeInsets.only(right: 6),
                                      decoration: BoxDecoration(
                                        color: context.primary.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.check_rounded, size: 13, color: context.primary),
                                          const SizedBox(width: 3),
                                          Text(
                                            'Read',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
                                              color: context.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: () => _dismissNotificationWithUndo(item),
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: const Icon(Icons.close_rounded, size: 14, color: Color(0xFF64748B)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
},
          ),

            if (_isLoadingMore)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Center(child: CircularProgressIndicator(color: context.primary)),
              ),
          ],
        );
  }

  void _showDigestViewer(BuildContext context, Map<String, dynamic> meta) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final gainers = meta['top_gainers'] as List<dynamic>? ?? [];
        final losers = meta['top_losers'] as List<dynamic>? ?? [];
        final userPerf = meta['user_performances'] as List<dynamic>? ?? [];
        final dividends = meta['dividends'] as List<dynamic>? ?? [];
        final complianceChanges = meta['compliance_changes'] as List<dynamic>? ?? [];
        final ipos = meta['ipos'] as List<dynamic>? ?? [];

        Widget buildPerfItem(dynamic item) {
          final isUp = (item['change_pct'] ?? 0) > 0;
          final isDown = (item['change_pct'] ?? 0) < 0;
          final color = isUp ? const Color(0xFF10B981) : isDown ? const Color(0xFFEF4444) : Colors.grey;
          final icon = isUp ? Icons.trending_up : isDown ? Icons.trending_down : Icons.remove;
          final symbol = item['symbol'] ?? item['ticker'] ?? '';

          return GestureDetector(
            onTap: () {
              if (symbol.isNotEmpty) {
                Navigator.pop(context);
                StockDetailScreen.openWithLoading(context, {'symbol': symbol});
              }
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.bg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.appColors.divider),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(symbol, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                      Text(item['status'] ?? 'Unknown', style: TextStyle(fontSize: 12, color: context.textMuted)),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                        child: Icon(icon, size: 12, color: color),
                      ),
                      const SizedBox(width: 6),
                      Text('${isUp ? '+' : ''}${item['change_pct']}%', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: color)),
                    ],
                  ),
                ],
              ),
            ),
          );
        }

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: context.appColors.divider)),
                ),
                child: Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: context.textMuted.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Weekly Digest',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: context.textDark, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Your portfolio compliance summary and market update.',
                        style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5),
                      ),
                      const SizedBox(height: 32),

                      if (complianceChanges.isNotEmpty) ...[
                        const Text('Compliance Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFEF4444))),
                        const SizedBox(height: 12),
                        ...complianceChanges.map((c) {
                          final sym = c['company']?['symbol'] ?? 'Unknown';
                          return GestureDetector(
                            onTap: () {
                              if (sym != 'Unknown') {
                                Navigator.pop(context);
                                StockDetailScreen.openWithLoading(context, {'symbol': sym});
                              }
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.shield_outlined, color: Color(0xFFEF4444), size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("$sym - ${c['new_status']}", style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                        Text("Was previously ${c['previous_status']}.", style: TextStyle(fontSize: 12, color: context.textMuted)),
                                      ],
                                    ),
                                  ),
                                  Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.textMuted),
                                ],
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 24),
                      ],
                      if (userPerf.isNotEmpty) ...[
                        Text('Your Watchlist & Portfolio', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...userPerf.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (gainers.isNotEmpty) ...[
                        Text('Market Top Gainers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...gainers.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (losers.isNotEmpty) ...[
                        Text('Market Top Losers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...losers.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (dividends.isNotEmpty) ...[
                        Text('Dividends Declared', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...dividends.map((d) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.appColors.divider),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(d['company']?['symbol'] ?? d['ticker'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                                  Text("Declared: ${d['created_at']?.split('T')[0] ?? ''}", style: TextStyle(fontSize: 12, color: context.textMuted)),
                                ],
                              ),
                              Text("${d['amount']} ${d['currency'] ?? ''}", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.primary)),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                      if (ipos.isNotEmpty) ...[
                        Text('Recent IPOs & Listings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...ipos.map((c) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.appColors.divider),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.show_chart, color: context.primary, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("${c['symbol']} - ${c['name']}", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                                    Text("Listed: ${c['date_listed']}", style: TextStyle(fontSize: 12, color: context.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
