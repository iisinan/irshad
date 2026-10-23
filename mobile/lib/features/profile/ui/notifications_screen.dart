import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  Key _inboxKey = UniqueKey();

  void _refreshInbox() {
    setState(() {
      _inboxKey = UniqueKey();
    });
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
            onPressed: () async {
              await Navigator.pushNamed(context, '/alerts');
              if (mounted) _refreshInbox();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: context.primary,
        onRefresh: () async {
          _refreshInbox();
          await Future.delayed(const Duration(milliseconds: 600));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: UpdatesInboxTab(key: _inboxKey),
        ),
      ),
    );
  }
}
