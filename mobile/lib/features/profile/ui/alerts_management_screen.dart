import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/alerts_provider.dart';

class AlertsManagementScreen extends StatefulWidget {
  const AlertsManagementScreen({super.key});

  @override
  State<AlertsManagementScreen> createState() => _AlertsManagementScreenState();
}

class _AlertsManagementScreenState extends State<AlertsManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AlertsProvider>().fetchAlerts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertsProvider>();
    final _alerts = provider.alerts;
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('My Alerts', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _alerts.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_off_rounded, size: 64, color: context.textMuted),
                  const SizedBox(height: 16),
                  Text('No active alerts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark)),
                  const SizedBox(height: 8),
                  Text('Set alerts from the Alerts tab to get notified.', style: TextStyle(color: context.textMuted)),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: _alerts.length,
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final alert = _alerts[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.divider),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                        child: Icon(alert['type'] == 'Price' ? Icons.show_chart_rounded : Icons.shield_rounded, color: context.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(alert['symbol'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                            const SizedBox(height: 4),
                            Text(
                              alert['type'] == 'Price' ? 'Price ${alert['condition']} ₦${alert['value']}' : 'Compliance ${alert['condition']}',
                              style: TextStyle(fontSize: 13, color: context.textMuted),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: alert['active'],
                        activeColor: context.primary,
                        onChanged: (val) {
                          context.read<AlertsProvider>().toggleAlert(alert['id'], val);
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
