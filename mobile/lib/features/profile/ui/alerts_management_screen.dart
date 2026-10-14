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
        title: Text('Active Alerts', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _alerts.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: context.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.notifications_none_rounded, size: 40, color: context.primary),
                    ),
                    const SizedBox(height: 20),
                    Text('No Active Alerts', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.4)),
                    const SizedBox(height: 8),
                    Text(
                      'Set custom price target alerts and AAOIFI Shariah compliance triggers for Nigerian stocks from any stock detail page or watchlist.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: context.textMuted, fontSize: 13.5, height: 1.45),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded, size: 16, color: Colors.white),
                      label: const Text('Back to Notifications', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              itemCount: _alerts.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final alert = _alerts[index];
                final isPrice = alert['type'] == 'Price';
                final symbol = alert['symbol'] ?? '';

                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    if (symbol.isNotEmpty) {
                      Navigator.pushNamed(context, '/stocks/$symbol');
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.appColors.divider),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isPrice ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isPrice ? Icons.notifications_active_rounded : Icons.shield_outlined,
                            color: isPrice ? const Color(0xFFD97706) : const Color(0xFF059669),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(symbol, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: context.textDark)),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isPrice ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      isPrice ? 'PRICE' : 'AAOIFI',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        color: isPrice ? const Color(0xFFD97706) : const Color(0xFF059669),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isPrice ? 'Trigger: Price ${alert['condition']} ₦${alert['value']}' : 'Trigger: Status ${alert['condition']}',
                                style: TextStyle(fontSize: 12.5, color: context.textMuted),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: alert['active'] == true,
                          activeColor: context.primary,
                          onChanged: (val) {
                            context.read<AlertsProvider>().toggleAlert(alert['id'], val);
                          },
                        ),
                        IconButton(
                          icon: Icon(Icons.delete_outline_rounded, color: context.haram, size: 20),
                          onPressed: () {
                            context.read<AlertsProvider>().deleteAlert(alert['id']);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
