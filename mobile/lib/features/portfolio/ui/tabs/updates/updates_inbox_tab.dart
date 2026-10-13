import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'updates_digest_tab.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/utils/suggest_modal_util.dart';
import '../../../stocks/ui/stock_detail_screen.dart';
import '../../../../core/notifications/notification_service.dart';

class UpdatesInboxTab extends StatefulWidget {
  const UpdatesInboxTab({super.key});

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

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _fetchInbox();
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

  Future<void> _fetchInbox({bool loadMore = false}) async {
    if (!loadMore) {
      setState(() {
        _isLoading = true;
        _currentPage = 1;
      });
    }

    // 1. Try cache first
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedStr = box.get('inbox_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        if (mounted) {
          setState(() {
            _notifications = cached['data'] ?? [];
            _isLoading = false;
          });
        }
      }
    } catch (_) {}

    // 2. Fetch live data silently
    try {
      final response = await ApiService().get('notifications/inbox', queryParameters: {
        if (_activeCategory != 'all') 'category': _activeCategory,
        'page': _currentPage,
      });
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data['data'] ?? [];
          final pagination = response.data['pagination'];

          try {
            final box = await Hive.openBox('updatesBox');
            await box.put(
              'inbox_data',
              jsonEncode({
                'data': data,
                'expiry': DateTime.now().add(const Duration(minutes: 5)).millisecondsSinceEpoch,
              }),
            );
          } catch (_) {}

          setState(() {
            if (loadMore) {
              _notifications.addAll(data);
              _isLoadingMore = false;
            } else {
              _notifications = data;
              _isLoading = false;
            }
            if (pagination != null) {
              _lastPage = pagination['last_page'] ?? 1;
            }
          });
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

  Future<void> _archiveNotification(int id) async {
    try {
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
      await ApiService().put('notifications/$id/archive', {});
    } catch (_) {}
  }

  Future<void> _deleteNotification(int id) async {
    try {
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
      await ApiService().delete('notifications/$id');
    } catch (_) {}
  }

  Future<void> _sendTestAlert() async {
    try {
      await PushNotificationService().showLocalNotificationDirect(
        title: 'Price Target Alert: AAPL 🎯',
        body: 'AAPL reached your target price of \$240.00! Current price: \$242.50.',
        payload: 'AAPL',
      );

      final res = await ApiService().post('notifications/test', {
        'title': 'Price Target Alert: AAPL 🎯',
        'message': 'AAPL reached your target price of \$240.00! Current price: \$242.50.',
        'category': 'price_alerts',
        'action_url': '/market/AAPL',
        'action_label': 'View Stock (AAPL)',
        'meta': {'symbol': 'AAPL', 'target_price': 240.0, 'current_price': 242.5},
      });

      if (mounted) {
        final msg = res.data['message'] ?? 'Test alert sent!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: context.halal,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _fetchInbox();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Test alert triggered on device.'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  String _formatTimeAgo(dynamic dateVal) {
    if (dateVal == null) return '';
    try {
      final DateTime dt = DateTime.parse(dateVal.toString());
      final now = DateTime.now();
      final difference = now.difference(dt);

      if (difference.inSeconds < 60) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours}h ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${months[dt.month - 1]} ${dt.day}';
      }
    } catch (_) {
      return dateVal.toString().split('T')[0];
    }
  }

  String? _extractSymbol(Map<String, dynamic> item) {
    if (item['meta'] is Map && item['meta']['symbol'] != null) {
      return item['meta']['symbol'].toString().toUpperCase();
    }
    final actionUrl = item['action_url']?.toString();
    if (actionUrl != null && actionUrl.contains('/market/')) {
      final parts = actionUrl.split('/market/').last.split('?').first.split('/');
      if (parts.isNotEmpty && parts.first.isNotEmpty) {
        return parts.first.toUpperCase();
      }
    }
    final title = item['title']?.toString() ?? '';
    if (title.contains(':')) {
      final candidate = title.split(':').last.replaceAll('🎯', '').replaceAll('🔔', '').trim();
      if (candidate.isNotEmpty && candidate.length <= 8 && !candidate.contains(' ')) {
        return candidate.toUpperCase();
      }
    }
    return null;
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
        return const Color(0xFFD97706);
      case 'screening':
      case 'compliance':
        return const Color(0xFF059669);
      case 'digest':
        return const Color(0xFF4F46E5);
      case 'portfolio':
        return const Color(0xFF7E22CE);
      case 'security':
        return const Color(0xFFE11D48);
      case 'market_news':
        return const Color(0xFF0284C7);
      default:
        return const Color(0xFF475569);
    }
  }

  void _handleNotificationTap(Map<String, dynamic> item) {
    final isUnread = item['read_at'] == null;
    if (isUnread) {
      _markAsRead(item['id']);
    }

    final category = item['category']?.toString() ?? '';
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
      StockDetailScreen.openWithLoading(context, {'symbol': symbol});
      return;
    }

    // 3. Fallback: Show detail bottom sheet modal
    _showNotificationDetailModal(context, item);
  }

  void _showNotificationDetailModal(BuildContext context, Map<String, dynamic> item) {
    final category = item['category']?.toString() ?? 'system';
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

    final filteredNotifications = _notifications.where((n) {
      final cat = n['category'];
      return cat != 'market_news' && cat != 'business_activity';
    }).toList();

    final unreadCount = filteredNotifications.where((n) => n['read_at'] == null).length;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: context.primary,
        onRefresh: () => _fetchInbox(),
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // 1. Controls bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Mark all read with unread counter
                    GestureDetector(
                      onTap: unreadCount > 0 ? _markAllAsRead : null,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: unreadCount > 0 ? context.primary.withValues(alpha: 0.08) : context.bg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: unreadCount > 0
                                ? context.primary.withValues(alpha: 0.3)
                                : context.appColors.divider,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.done_all_rounded,
                              size: 15,
                              color: unreadCount > 0 ? context.primary : context.textMuted,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              unreadCount > 0 ? 'Mark All Read ($unreadCount)' : 'All Read',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                                color: unreadCount > 0 ? context.primary : context.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Digest & Alert settings shortcuts
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pushNamed(context, '/alerts'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                            decoration: BoxDecoration(
                              color: context.bg,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: context.appColors.divider),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.tune_rounded, size: 14, color: context.textDark),
                                const SizedBox(width: 4),
                                Text(
                                  'Alerts',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                    color: context.textDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
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
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.25)),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.auto_stories_rounded, size: 14, color: Color(0xFF4F46E5)),
                                SizedBox(width: 4),
                                Text(
                                  'Digest',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    color: Color(0xFF4F46E5),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // 2. Categories Filter Chips
            SliverToBoxAdapter(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: _categories.map((cat) {
                    final isActive = _activeCategory == cat['id'];
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _activeCategory = cat['id'];
                          _isLoading = true;
                        });
                        _fetchInbox();
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8, bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: isActive ? context.primary.withValues(alpha: 0.12) : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isActive ? context.primary : context.appColors.divider,
                            width: isActive ? 1.5 : 1,
                          ),
                        ),
                        child: Text(
                          cat['label'],
                          style: TextStyle(
                            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                            fontSize: 12.5,
                            color: isActive ? context.primary : context.textMuted,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // 3. Notification List or Empty State
            if (filteredNotifications.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: context.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _activeCategory == 'all'
                                ? Icons.notifications_none_rounded
                                : Icons.filter_list_off_rounded,
                            size: 40,
                            color: context.primary,
                          ),
                        ),
                        const SizedBox(height: 20),
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
                          style: TextStyle(
                            fontSize: 13.5,
                            color: context.textMuted,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => Navigator.pushNamed(context, '/alerts'),
                              icon: Icon(Icons.tune_rounded, size: 16, color: context.primary),
                              label: Text('Manage Active Alerts', style: TextStyle(fontWeight: FontWeight.w700, color: context.primary)),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: context.primary.withValues(alpha: 0.4)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                            ),
                            const SizedBox(width: 10),
                            ElevatedButton.icon(
                              onPressed: _sendTestAlert,
                              icon: const Icon(Icons.notification_add_outlined, size: 16, color: Colors.white),
                              label: const Text('Send Test Alert', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
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
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = filteredNotifications[index];
                      final isUnread = item['read_at'] == null;
                      final category = item['category'] ?? 'system';
                      final symbol = _extractSymbol(item);

                      return Dismissible(
                        key: Key(item['id'].toString()),
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
                            _archiveNotification(item['id']);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Notification archived'),
                                duration: Duration(seconds: 2),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          } else {
                            _deleteNotification(item['id']);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Notification deleted'),
                                duration: Duration(seconds: 2),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        },
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => _handleNotificationTap(item),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isUnread
                                    ? context.primary.withValues(alpha: 0.4)
                                    : context.appColors.divider.withValues(alpha: 0.8),
                                width: isUnread ? 1.3 : 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isUnread
                                      ? context.primary.withValues(alpha: 0.08)
                                      : Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Top row: Category Chip + Time + Unread Dot
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                      decoration: BoxDecoration(
                                        color: _getBgColorForCategory(category),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          _getIconForCategory(category),
                                          const SizedBox(width: 5),
                                          Text(
                                            _getCategoryLabel(category).toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: _getCategoryTextColor(category),
                                              letterSpacing: 0.4,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        Text(
                                          _formatTimeAgo(item['created_at']),
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w500,
                                            color: context.textMuted,
                                          ),
                                        ),
                                        if (isUnread) ...[
                                          const SizedBox(width: 6),
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
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Title
                                Text(
                                  item['title'] ?? '',
                                  style: TextStyle(
                                    fontWeight: isUnread ? FontWeight.w900 : FontWeight.w700,
                                    fontSize: 15,
                                    color: context.textDark,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                                const SizedBox(height: 6),

                                // Message
                                Text(
                                  item['message'] ?? '',
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    color: context.textMuted,
                                    height: 1.45,
                                  ),
                                ),

                                // Bottom Action Row
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (symbol != null && symbol.isNotEmpty)
                                      GestureDetector(
                                        onTap: () => _handleNotificationTap(item),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: context.primary.withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
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
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.25)),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.auto_stories_rounded, size: 12, color: Color(0xFF4F46E5)),
                                              SizedBox(width: 4),
                                              Text(
                                                'Read Digest',
                                                style: TextStyle(
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.w800,
                                                  color: Color(0xFF4F46E5),
                                                ),
                                              ),
                                              SizedBox(width: 4),
                                              Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF4F46E5)),
                                            ],
                                          ),
                                        ),
                                      )
                                    else
                                      const SizedBox.shrink(),

                                    // Quick card actions
                                    Row(
                                      children: [
                                        if (isUnread)
                                          GestureDetector(
                                            onTap: () => _markAsRead(item['id']),
                                            child: Container(
                                              padding: const EdgeInsets.all(6),
                                              margin: const EdgeInsets.only(right: 6),
                                              decoration: BoxDecoration(
                                                color: context.bg,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Icon(Icons.check_rounded, size: 15, color: context.textMuted),
                                            ),
                                          ),
                                        GestureDetector(
                                          onTap: () => _deleteNotification(item['id']),
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: context.bg,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Icon(Icons.close_rounded, size: 15, color: context.textMuted),
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
                      );
                    },
                    childCount: filteredNotifications.length,
                  ),
                ),
              ),

            if (_isLoadingMore)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Center(child: CircularProgressIndicator(color: context.primary)),
                ),
              ),
          ],
        ),
      ),
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
