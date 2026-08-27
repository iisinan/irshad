import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
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

    if (filteredNotifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 48, color: context.textMuted.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('No notifications yet', style: TextStyle(color: context.textMuted, fontSize: 16)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      itemCount: filteredNotifications.length,
      itemBuilder: (context, index) {
        final item = filteredNotifications[index];
        final isUnread = item['read_at'] == null;
        final category = item['category'] ?? 'system';

        return InkWell(
          onTap: isUnread ? () => _markAsRead(item['id']) : null,
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
    );
  }
}
