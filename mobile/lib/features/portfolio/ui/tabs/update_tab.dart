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
import '../widgets/islamic_quote_widget.dart';

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
            child: _buildGreetingBanner(context, _unreadInbox),
          ),
          const IslamicQuoteWidget(compact: true),
          const SizedBox(height: 8),
          _buildSubTabNavigation(context, _unreadInbox),
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
        gradient: LinearGradient(
          colors: [context.bg, context.primary.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: context.primary.withValues(alpha: 0.04), blurRadius: 32, offset: const Offset(0, 8)),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Decorative glow orb (simulate)
          Positioned(
            top: -50,
            left: -20,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [context.primary.withValues(alpha: 0.1), Colors.transparent],
                  stops: const [0.0, 0.7],
                ),
              ),
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Emoji Box
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: context.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            '$greetingEn, $firstName',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (unreadCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.primary,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: [BoxShadow(color: context.primary.withValues(alpha: 0.5), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Text(
                              '$unreadCount unread',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              const LiveClockWidget(),
            ],
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
      case 'compliance':
        return const UpdatesComplianceTab();
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
