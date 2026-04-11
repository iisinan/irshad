import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // Mock data for demonstration
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 1,
      'title': 'Halal Status Updated',
      'body': 'DANGCEM has been verified as HALAL by our scholars.',
      'type': 'status_update',
      'status': 'halal',
      'is_read': false,
      'time': '2h ago',
      'deep_link': '/stock_details',
      'arguments': {'symbol': 'DANGCEM', 'name': 'Dangote Cement', 'status': {'status': 'halal'}}
    },
    {
      'id': 2,
      'title': 'Compliance Warning',
      'body': 'NESTLE has exceeded the recommended debt threshold.',
      'type': 'compliance_alert',
      'status': 'non-halal',
      'is_read': true,
      'time': 'Yesterday',
      'deep_link': '/stock_details',
      'arguments': {'symbol': 'NESTLE', 'name': 'Nestle Nigeria', 'status': {'status': 'non-halal'}}
    },
    {
      'id': 3,
      'title': 'Welcome to IRSHAD',
      'body': 'Start exploring Shariah-compliant opportunities today.',
      'type': 'general',
      'status': 'info',
      'is_read': true,
      'time': '3d ago',
      'deep_link': null,
      'arguments': null
    },
  ];

  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
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
        iconColor = primaryGreen;
        bgIconColor = const Color(0xFFDCFCE7);
        iconData = Icons.verified_user_rounded;
        break;
      case 'non-halal':
        iconColor = Colors.red;
        bgIconColor = const Color(0xFFFEE2E2);
        iconData = Icons.warning_amber_rounded;
        break;
      default:
        iconColor = textDark;
        bgIconColor = divider.withOpacity(0.5);
        iconData = Icons.notifications_active_rounded;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isRead ? divider : primaryGreen.withOpacity(0.3)),
        boxShadow: isRead ? null : [
          BoxShadow(
            color: primaryGreen.withOpacity(0.05),
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
                  color: isRead ? textDark.withOpacity(0.8) : textDark,
                ),
              ),
            ),
            Text(
              notification['time'],
              style: const TextStyle(fontSize: 11, color: textMuted, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(
            notification['body'],
            style: const TextStyle(color: textMuted, fontSize: 13, height: 1.4, fontWeight: FontWeight.w400),
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
                color: primaryGreen.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.notifications_none_rounded, size: 40, color: primaryGreen),
            ),
            const SizedBox(height: 24),
            const Text(
              'Stay Informed',
              style: TextStyle(fontSize: 20, color: textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            const Text(
              'We will notify you about compliance updates\nand market news here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
