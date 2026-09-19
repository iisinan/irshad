import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'updates_digest_tab.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:provider/provider.dart';

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
    {'id': 'portfolio', 'label': 'Portfolio'},
    {'id': 'screening', 'label': 'Screening'},
    {'id': 'price_alerts', 'label': 'Price Alerts'},
    {'id': 'system', 'label': 'System'},
    {'id': 'security', 'label': 'Security'},
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
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && !_isLoadingMore && _currentPage < _lastPage) {
      _loadMore();
    }
  }

  Future<void> _fetchInbox({bool loadMore = false}) async {
    if (!loadMore) {
      setState(() { _isLoading = true; _currentPage = 1; });
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
            await box.put('inbox_data', jsonEncode({
              'data': data,
              'expiry': DateTime.now().add(const Duration(minutes: 5)).millisecondsSinceEpoch
            }));
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
              _lastPage = pagination['last_page'];
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

  Widget _getIconForCategory(String category) {
    switch (category) {
      case 'portfolio':
        return const Icon(Icons.trending_up, color: Color(0xFF8B5CF6));
      case 'screening':
        return const Icon(Icons.shield_outlined, color: Color(0xFF5B2971));
      case 'market_news':
        return const Icon(Icons.bar_chart, color: Color(0xFF0EA5E9));
      case 'business_activity':
        return const Icon(Icons.bolt, color: Color(0xFFF59E0B));
      case 'price_alerts':
        return const Icon(Icons.notifications_active, color: Color(0xFFFBBF24));
      case 'digest':
        return const Icon(Icons.mail_outline_rounded, color: Color(0xFF8B5CF6));
      default:
        return const Icon(Icons.settings, color: Colors.grey);
    }
  }

  Color _getBgColorForCategory(String category) {
    switch (category) {
      case 'portfolio':
        return const Color(0xFF8B5CF6).withValues(alpha: 0.1);
      case 'screening':
        return const Color(0xFF5B2971).withValues(alpha: 0.1);
      case 'market_news':
        return const Color(0xFF0EA5E9).withValues(alpha: 0.1);
      case 'business_activity':
        return const Color(0xFFF59E0B).withValues(alpha: 0.1);
      case 'price_alerts':
        return const Color(0xFFFBBF24).withValues(alpha: 0.1);
      case 'digest':
        return const Color(0xFF8B5CF6).withValues(alpha: 0.1);
      default:
        return Colors.grey.withValues(alpha: 0.1);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));
    
    final filteredNotifications = _notifications.where((n) {
      final cat = n['category'];
      return cat != 'market_news' && cat != 'business_activity';
    }).toList();

    return SingleChildScrollView(
      controller: _scrollController,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: _markAllAsRead,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.appColors.divider),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.done_all, size: 16, color: context.textMuted),
                        const SizedBox(width: 6),
                        Text('Mark All Read', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: context.textMuted)),
                      ],
                    ),
                  ),
                ),
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
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.mail_outline_rounded, size: 16, color: context.primary),
                        const SizedBox(width: 6),
                        Text('Digest Settings', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: context.primary)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 24),
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
                    margin: const EdgeInsets.only(right: 8, bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive ? context.primary.withValues(alpha: 0.1) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isActive ? context.primary : context.appColors.divider,
                      ),
                    ),
                    child: Text(
                      cat['label'],
                      style: TextStyle(
                        fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                        fontSize: 13,
                        color: isActive ? context.primary : context.textMuted,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          if (filteredNotifications.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.inbox, size: 48, color: context.textMuted.withValues(alpha: 0.5)),
                    const SizedBox(height: 16),
                    Text('No notifications yet', style: TextStyle(color: context.textMuted, fontSize: 16)),
                  ],
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              itemCount: filteredNotifications.length,
              itemBuilder: (context, index) {
                final item = filteredNotifications[index];
                final isUnread = item['read_at'] == null;
                final category = item['category'] ?? 'system';

                return Dismissible(
                  key: Key(item['id'].toString()),
                  background: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.centerLeft,
                    child: const Icon(Icons.archive, color: Colors.white),
                  ),
                  secondaryBackground: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.centerRight,
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (direction) {
                    if (direction == DismissDirection.startToEnd) {
                      _archiveNotification(item['id']);
                    } else {
                      _deleteNotification(item['id']);
                    }
                  },
                  child: InkWell(
                    onTap: () {
                      if (isUnread) _markAsRead(item['id']);
                      if ((category == 'digest' || item['title'] == 'Irshad Digest is Ready') && item['meta'] != null) {
                        _showDigestViewer(context, item['meta']);
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isUnread ? context.primary.withValues(alpha: 0.03) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isUnread ? context.primary.withValues(alpha: 0.3) : context.appColors.divider),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: _getBgColorForCategory(category),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: _getIconForCategory(category),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['title'] ?? '',
                                        style: TextStyle(
                                          fontWeight: isUnread ? FontWeight.w900 : FontWeight.w700,
                                          fontSize: 15,
                                          color: context.textDark,
                                        ),
                                      ),
                                    ),
                                    if (isUnread)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: context.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item['message'] ?? '',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: context.textMuted,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  item['created_at']?.toString().split('T')[0] ?? '',
                                  style: TextStyle(fontSize: 12, color: context.textMuted),
                                ),
                              ],
                            ),
                          ),
                        ],
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
          
          return Container(
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
                    Text(item['symbol'] ?? item['ticker'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
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
                        Text('Compliance Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFFEF4444))),
                        const SizedBox(height: 12),
                        ...complianceChanges.map((c) => Container(
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
                                    Text("${c['company']?['symbol'] ?? 'Unknown'} - ${c['new_status']}", style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                    Text("Was previously ${c['previous_status']}.", style: TextStyle(fontSize: 12, color: context.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
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

  Widget _buildPerfItem(BuildContext context, dynamic p) {
    final symbol = p['symbol'];
    final pct = (p['change_pct'] as num).toDouble();
    final isPositive = pct >= 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.appColors.divider),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(symbol, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: context.textDark)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isPositive ? const Color(0xFF10B981).withValues(alpha: 0.1) : const Color(0xFFEF4444).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${isPositive ? '+' : ''}${pct.toStringAsFixed(2)}%',
              style: TextStyle(
                color: isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

}
