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

  @override
  void initState() {
    super.initState();
    _fetchInbox();
  }

  Future<void> _fetchInbox() async {
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
      final response = await ApiService().get('notifications/inbox');
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data['data'] ?? [];
          
          try {
            final box = await Hive.openBox('updatesBox');
            await box.put('inbox_data', jsonEncode({
              'data': data,
              'expiry': DateTime.now().add(const Duration(minutes: 5)).millisecondsSinceEpoch
            }));
          } catch (_) {}

          setState(() {
            _notifications = data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted && _notifications.isEmpty) {
          setState(() {
            _error = 'Failed to fetch inbox';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted && _notifications.isEmpty) {
        setState(() {
          _error = 'Error loading inbox';
          _isLoading = false;
        });
      }
    }
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
        return const Color(0xFF8B5CF6).withOpacity(0.1);
      case 'screening':
        return const Color(0xFF5B2971).withOpacity(0.1);
      case 'market_news':
        return const Color(0xFF0EA5E9).withOpacity(0.1);
      case 'business_activity':
        return const Color(0xFFF59E0B).withOpacity(0.1);
      case 'price_alerts':
        return const Color(0xFFFBBF24).withOpacity(0.1);
      case 'digest':
        return const Color(0xFF8B5CF6).withOpacity(0.1);
      default:
        return Colors.grey.withOpacity(0.1);
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
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
                      Text('Irshad Digest Settings', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: context.primary)),
                    ],
                  ),
                ),
              ),
            ],
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

        return InkWell(
          onTap: () {
            if (isUnread) _markAsRead(item['id']);
            if (category == 'digest' && item['meta'] != null) {
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
                        item['created_at'] ?? '', // Ideally parse to readable date
                        style: TextStyle(fontSize: 12, color: context.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
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
                      
                      if (userPerf.isNotEmpty) ...[
                        Text('Your Watchlist & Portfolio', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark)),
                        const SizedBox(height: 16),
                        ...userPerf.map((p) => _buildPerfItem(context, p)).toList(),
                        const SizedBox(height: 32),
                      ],

                      Text('Market Top Gainers', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark)),
                      const SizedBox(height: 16),
                      ...gainers.map((p) => _buildPerfItem(context, p)).toList(),
                      const SizedBox(height: 32),

                      Text('Market Top Losers', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark)),
                      const SizedBox(height: 16),
                      ...losers.map((p) => _buildPerfItem(context, p)).toList(),
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
