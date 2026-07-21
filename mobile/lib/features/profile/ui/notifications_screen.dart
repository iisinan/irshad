import 'package:flutter/material.dart';
import '../../../core/api/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final response = await _apiService.get('notifications');
      if (response.statusCode == 200) {
        setState(() {
          _notifications = List<Map<String, dynamic>>.from(response.data['data'] ?? []);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Theme Constants
@override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Notifications', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _notifications.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _notifications.length,
              itemBuilder: (context, index) {
                return _buildNotificationItem(_notifications[index]);
              },
            ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    bool isRead = notification['is_read'];
    String status = notification['status'];
    
    Color iconColor;
    IconData iconData;
    Color bgIconColor;
    
    switch (status) {
      case 'halal':
        iconColor = context.primary;
        bgIconColor = context.halalBg;
        iconData = Icons.verified_user_rounded;
        break;
      case 'non-halal':
        iconColor = context.haram;
        bgIconColor = const Color(0xFFFEE2E2);
        iconData = Icons.warning_amber_rounded;
        break;
      default:
        iconColor = context.textDark;
        bgIconColor = context.divider.withOpacity(0.5);
        iconData = Icons.notifications_active_rounded;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isRead ? context.divider : context.primary.withOpacity(0.3)),
        boxShadow: isRead ? null : [
          BoxShadow(
            color: context.primary.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: bgIconColor,
            shape: BoxShape.circle,
          ),
          child: Icon(iconData, color: iconColor, size: 22),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                notification['title'],
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: isRead ? context.textDark.withOpacity(0.8) : context.textDark,
                ),
              ),
            ),
            Text(
              notification['time'],
              style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(
            notification['body'],
            style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.4, fontWeight: FontWeight.w400),
          ),
        ),
        onTap: () {
          setState(() => notification['is_read'] = true);
          if (notification['deep_link'] != null) {
             Navigator.pushNamed(
                context, 
                notification['deep_link'], 
                arguments: notification['arguments']
             );
          }
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.notifications_none_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text(
              'Stay Informed',
              style: TextStyle(fontSize: 20, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'We will notify you about compliance updates\nand market news here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
