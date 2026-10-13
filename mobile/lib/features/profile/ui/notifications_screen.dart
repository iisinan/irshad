import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../../../core/api/api_service.dart';
import '../../../core/notifications/notification_service.dart';
import '../../portfolio/ui/tabs/updates/updates_inbox_tab.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isTesting = false;

  Future<void> _sendTestNotification() async {
    setState(() => _isTesting = true);
    try {
      // 1. Trigger local notification directly on phone immediately
      await PushNotificationService().showLocalNotificationDirect(
        title: 'Irshad Alert Active 🔔',
        body: 'Your price alerts and Irshad Digest notifications are enabled and working on this device.',
        payload: 'inbox',
      );

      // 2. Also dispatch backend test notification
      final response = await ApiService().post('notifications/test', {
        'title': 'Irshad Alert Active 🔔',
        'message': 'Your price alerts and Irshad Digest notifications are enabled and working on this device.',
      });

      if (mounted) {
        final message = response.data['message'] ?? 'Test notification sent!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: context.halal,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Test alert triggered locally on device.'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isTesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text(
          'Notifications',
          style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
        ),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            tooltip: 'Send Test Notification',
            icon: _isTesting
                ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: context.primary))
                : Icon(Icons.notification_add_outlined, color: context.primary, size: 22),
            onPressed: _isTesting ? null : _sendTestNotification,
          ),
        ],
      ),
      body: const UpdatesInboxTab(),
    );
  }
}
