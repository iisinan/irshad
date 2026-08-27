import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:irshad_mobile/core/providers/app_state_provider.dart';

import 'updates/updates_news_tab.dart';
import 'updates/updates_inbox_tab.dart';
import 'updates/updates_digest_tab.dart';
import 'purification_tab.dart';
import 'updates/updates_purification_tab.dart';
import 'updates/updates_compliance_tab.dart';
class UpdateTab extends StatefulWidget {
  const UpdateTab({super.key});

  @override
  State<UpdateTab> createState() => _UpdateTabState();
}

class _UpdateTabState extends State<UpdateTab> {
  String _activeTabId = 'news';
  int _unreadInbox = 0;
  int _unreadNews = 1; // Default to 1 to show the red dot

  @override
  void initState() {
    super.initState();
    _fetchUnreadCounts();
  }

  Future<void> _fetchUnreadCounts() async {
    try {
      final response = await ApiService().get('notifications/unread-count');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _unreadInbox = response.data['data']?['count'] ?? response.data['count'] ?? 0;
          });
        }
      }
    } catch (_) {}
  }


  final List<Map<String, dynamic>> _tabs = [
    {'id': 'news', 'label': 'News & Insights', 'icon': Icons.newspaper_rounded},
    {'id': 'inbox', 'label': 'Inbox', 'icon': Icons.notifications_none_rounded},
    {'id': 'digest', 'label': 'Irshad Digest', 'icon': Icons.mail_outline_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'purification', 'label': 'Purification', 'icon': Icons.water_drop_outlined},
  ];

  @override
  Widget build(BuildContext context) {
    

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: _buildGreetingBanner(context, unreadCount),
          ),
          _buildSubTabNavigation(context, unreadCount),
          const SizedBox(height: 16),
          _buildActiveTabContent(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildGreetingBanner(BuildContext context, int unreadCount) {
    final authUser = Provider.of<AppStateProvider>(context).userProfile;
    final firstName = (authUser?['first_name'] ?? authUser?['name']?.split(' ').first) ?? 'there';
    
    // Greeting logic
    final hour = DateTime.now().hour;
    String greetingEn = 'Good evening';
    String emoji = '🌙';
    if (hour < 5) { greetingEn = 'Good evening'; emoji = '🌙'; }
    else if (hour < 12) { greetingEn = 'Good morning'; emoji = '☀️'; }
    else if (hour < 17) { greetingEn = 'Good afternoon'; emoji = '🌤️'; }
    else if (hour < 21) { greetingEn = 'Good evening'; emoji = '🌇'; }

    return Container(
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          // Top primary strip
          Container(
            height: 5,
            decoration: BoxDecoration(
              color: context.primary,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$greetingEn, $firstName $emoji',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Here\'s what\'s happening with your halal portfolio today.',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted, height: 1.4),
                      ),
                      if (unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(top: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: context.primary.withValues(alpha: 0.1),
                            border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.notifications, size: 12, color: context.primary),
                              const SizedBox(width: 4),
                              Text(
                                '$unreadCount unread notification${unreadCount != 1 ? 's' : ''}',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.primary),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                const LiveClockWidget(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubTabNavigation(BuildContext context, int unreadCount) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: _tabs.map((tab) {
          final isActive = _activeTabId == tab['id'];
          final hasNew = (tab['id'] == 'inbox' && _unreadInbox > 0) || (tab['id'] == 'news' && _unreadNews > 0);
          
          return GestureDetector(
            onTap: () => setState(() => _activeTabId = tab['id']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isActive ? context.primary : context.bgAlt,
                border: Border.all(color: isActive ? context.primary : context.appColors.divider),
                borderRadius: BorderRadius.circular(30),
                boxShadow: isActive ? [BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 2))] : [],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(tab['icon'], size: 16, color: isActive ? Colors.white : context.textDark),
                      const SizedBox(width: 8),
                      Text(
                        tab['label'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: isActive ? Colors.white : context.textDark,
                        ),
                      ),
                    ],
                  ),
                  if (hasNew)
                    Positioned(
                      top: -2,
                      right: -8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: context.haram,
                          shape: BoxShape.circle,
                          border: Border.all(color: isActive ? context.primary : context.bgAlt, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActiveTabContent() {
    switch (_activeTabId) {
      case 'news':
        return const UpdatesNewsTab();
      case 'inbox':
        return const UpdatesInboxTab();
      case 'digest':
        return const UpdatesDigestTab();
      case 'purification':
        return const UpdatesPurificationTab();
      default:
        return const SizedBox.shrink();
    }
  }
}

class LiveClockWidget extends StatefulWidget {
  const LiveClockWidget({super.key});

  @override
  State<LiveClockWidget> createState() => _LiveClockWidgetState();
}

class _LiveClockWidgetState extends State<LiveClockWidget> {
  late Timer _timer;
  late DateTime _now;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  String _getWeekdayName(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final hh = _now.hour.toString().padLeft(2, '0');
    final mm = _now.minute.toString().padLeft(2, '0');
    final ss = _now.second.toString().padLeft(2, '0');
    final dateStr = '${_getWeekdayName(_now.weekday)} ${_now.day} ${_getMonthName(_now.month)} ${_now.year}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: context.bgAlt,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(hh, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1)),
              Text(':', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.primary)),
              Text(mm, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1)),
              Text(':', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.primary)),
              Text(ss, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textMuted, letterSpacing: -1)),
            ],
          ),
          const SizedBox(height: 4),
          Text(dateStr, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.textMuted)),
        ],
      ),
    );
  }
}
