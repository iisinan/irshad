import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:irshad_mobile/core/notifications/notification_service.dart';
import 'package:irshad_mobile/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isTesting = false;
  Key _inboxKey = UniqueKey();

  Future<void> _sendTestAlert({
    required String type,
    required String title,
    required String body,
    required String category,
    String? actionUrl,
    String? actionLabel,
    Map<String, dynamic>? meta,
  }) async {
    setState(() => _isTesting = true);
    try {
      // 1. Trigger local notification directly on phone immediately
      await PushNotificationService().showLocalNotificationDirect(
        title: title,
        body: body,
        payload: meta?['symbol'] ?? 'inbox',
      );

      // 2. Dispatch backend test notification
      final response = await ApiService().post('notifications/test', {
        'title': title,
        'message': body,
        'category': category,
        'action_url': actionUrl,
        'action_label': actionLabel,
        'meta': meta,
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
        setState(() {
          _inboxKey = UniqueKey();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Test alert triggered locally on device.'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() {
          _inboxKey = UniqueKey();
        });
      }
    } finally {
      if (mounted) setState(() => _isTesting = false);
    }
  }

  void _showTestAlertOptions() {
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
          child: SafeArea(
            top: false,
            child: SingleChildScrollView(
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
                  const SizedBox(height: 16),
                  Text(
                    'Send Sample Notification',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: context.textDark, letterSpacing: -0.4),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Choose a notification type to test on your device and inbox:',
                    style: TextStyle(fontSize: 13, color: context.textMuted),
                  ),
                  const SizedBox(height: 18),

                  // Option 1: Price Alert
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: Colors.white,
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.notifications_active_rounded, color: Color(0xFFD97706), size: 20),
                    ),
                    title: const Text('Stock Price Target Alert', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    subtitle: const Text('DANGCEM reached target price of ₦650.00', style: TextStyle(fontSize: 12)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _sendTestAlert(
                        type: 'price_alert',
                        title: 'Price Target Alert: DANGCEM 🎯',
                        body: 'DANGCEM reached your target price of ₦650.00! Current price: ₦655.00.',
                        category: 'price_alerts',
                        actionUrl: '/stocks/DANGCEM',
                        actionLabel: 'View Stock (DANGCEM)',
                        meta: {'symbol': 'DANGCEM', 'target_price': 650.0, 'current_price': 655.0},
                      );
                    },
                  ),
                  const SizedBox(height: 8),

                  // Option 2: Shariah Compliance Alert
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: Colors.white,
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.shield_outlined, color: Color(0xFF059669), size: 20),
                    ),
                    title: const Text('Shariah Compliance Warning', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    subtitle: const Text('MTNN debt ratio approaching 30% limit', style: TextStyle(fontSize: 12)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _sendTestAlert(
                        type: 'compliance_risk',
                        title: 'Compliance Risk Warning: MTNN ⚠️',
                        body: 'MTNN is approaching non-compliant thresholds: Interest-bearing debt exceeds 28% of market cap.',
                        category: 'screening',
                        actionUrl: '/stocks/MTNN',
                        actionLabel: 'View AAOIFI Ratios',
                        meta: {'symbol': 'MTNN', 'metric': 'debt_ratio', 'value': 28.5},
                      );
                    },
                  ),
                  const SizedBox(height: 8),

                  // Option 3: Irshad Digest Alert
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: Colors.white,
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.auto_stories_rounded, color: Color(0xFF4F46E5), size: 20),
                    ),
                    title: const Text('Irshad Weekly Digest', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    subtitle: const Text('Your weekly portfolio compliance summary is ready', style: TextStyle(fontSize: 12)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _sendTestAlert(
                        type: 'digest',
                        title: 'Irshad Digest is Ready 📧',
                        body: 'Your weekly portfolio compliance summary and market update is available.',
                        category: 'digest',
                        actionLabel: 'Read Digest',
                        meta: {'frequency': 'weekly'},
                      );
                    },
                  ),
                  const SizedBox(height: 8),

                  // Option 4: Dividend Payment Declared
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: Colors.white,
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.account_balance_wallet_outlined, color: Color(0xFF7E22CE), size: 20),
                    ),
                    title: const Text('Dividend Payment Declared', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    subtitle: const Text('ZENITHBANK declared interim dividend of ₦1.00', style: TextStyle(fontSize: 12)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _sendTestAlert(
                        type: 'portfolio',
                        title: 'Dividend Declared: ZENITHBANK 💰',
                        body: 'Zenith Bank Plc declared interim dividend of ₦1.00/share. Purification estimate: 0.12%.',
                        category: 'portfolio',
                        actionUrl: '/stocks/ZENITHBANK',
                        actionLabel: 'View Dividend',
                        meta: {'symbol': 'ZENITHBANK', 'dividend_amount': 1.0, 'purification_pct': 0.12},
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        );
      },
    );
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
            tooltip: 'Active Alerts',
            icon: Icon(Icons.tune_rounded, color: context.textDark, size: 22),
            onPressed: () => Navigator.pushNamed(context, '/alerts'),
          ),
          IconButton(
            tooltip: 'Send Test Notification',
            icon: _isTesting
                ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: context.primary))
                : Icon(Icons.notification_add_outlined, color: context.primary, size: 22),
            onPressed: _isTesting ? null : _showTestAlertOptions,
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: UpdatesInboxTab(key: _inboxKey),
      ),
    );
  }
}
