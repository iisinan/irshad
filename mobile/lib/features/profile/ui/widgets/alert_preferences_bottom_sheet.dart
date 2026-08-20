import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class AlertPreferencesBottomSheet extends StatefulWidget {
  final Map<String, dynamic> item;
  final bool isProduct;
  final Function(Map<String, bool>) onSave;

  const AlertPreferencesBottomSheet({
    super.key, 
    required this.item,
    this.isProduct = false,
    required this.onSave,
  });

  @override
  State<AlertPreferencesBottomSheet> createState() => _AlertPreferencesBottomSheetState();
}

class _AlertPreferencesBottomSheetState extends State<AlertPreferencesBottomSheet> {
  late Map<String, bool> prefs;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.isProduct) {
      prefs = {
        'alert_whatsapp': widget.item['alert_whatsapp'] == true,
        'alert_email': widget.item['alert_email'] == true,
      };
    } else {
      prefs = {
        'alert_email': widget.item['alert_email'] == true,
        'alert_inapp': widget.item['alert_inapp'] == true,
        'alert_push': widget.item['alert_push'] == true,
        'alert_verdict_change': widget.item['alert_verdict_change'] == true,
        'alert_compliance_risk': widget.item['alert_compliance_risk'] == true,
        'alert_price_change': widget.item['alert_price_change'] == true,
      };
    }
  }

  void _handleToggle(String field) {
    setState(() {
      prefs[field] = !(prefs[field] ?? false);
    });
  }

  Future<void> _save() async {
    if (!widget.isProduct) {
      final hasDelivery = (prefs['alert_email'] ?? false) || (prefs['alert_inapp'] ?? false) || (prefs['alert_push'] ?? false);
      final hasType = (prefs['alert_verdict_change'] ?? false) || (prefs['alert_compliance_risk'] ?? false) || (prefs['alert_price_change'] ?? false);

      if (hasDelivery && !hasType) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please select at least one alert type to receive.'), backgroundColor: context.haram));
        return;
      }
      if (hasType && !hasDelivery) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please select at least one delivery method.'), backgroundColor: context.haram));
        return;
      }
    }

    setState(() => _isSaving = true);
    await widget.onSave(prefs);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  Widget _buildToggleRow(String field, IconData icon, String title, String description) {
    final isActive = prefs[field] ?? false;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: context.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: context.textDark, fontSize: 14)),
                const SizedBox(height: 2),
                Text(description, style: TextStyle(color: context.textMuted, fontSize: 12)),
              ],
            ),
          ),
          Switch(
            value: isActive,
            onChanged: (val) => _handleToggle(field),
            activeColor: context.primary,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Alert Preferences', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark)),
              IconButton(
                icon: Icon(Icons.close_rounded, color: context.textMuted),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          const SizedBox(height: 16),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.isProduct) ...[
                    _buildToggleRow('alert_email', Icons.email_rounded, 'Email Updates', 'Get notified about product compliance changes via email.'),
                    _buildToggleRow('alert_whatsapp', Icons.chat_bubble_rounded, 'WhatsApp Updates', 'Get notified about product compliance changes via WhatsApp.'),
                  ] else ...[
                    Text('Delivery Methods', style: TextStyle(fontWeight: FontWeight.w800, color: context.textMuted, fontSize: 13)),
                    const SizedBox(height: 12),
                    _buildToggleRow('alert_inapp', Icons.inbox_rounded, 'In-App Alerts', 'Receive alerts in the notification center.'),
                    _buildToggleRow('alert_push', Icons.smartphone_rounded, 'Push Notifications', 'Get alerts instantly on your phone.'),
                    _buildToggleRow('alert_email', Icons.email_rounded, 'Email Alerts', 'Receive detailed alerts straight to your inbox.'),
                    const SizedBox(height: 16),
                    Text('Alert Types', style: TextStyle(fontWeight: FontWeight.w800, color: context.textMuted, fontSize: 13)),
                    const SizedBox(height: 12),
                    _buildToggleRow('alert_verdict_change', Icons.gavel_rounded, 'Verdict Changes', 'Notify me immediately if Shariah compliance status changes.'),
                    _buildToggleRow('alert_compliance_risk', Icons.warning_rounded, 'Compliance Risk', 'Warn me if non-permissible debt/revenue approaches 33% or 5%.'),
                    _buildToggleRow('alert_price_change', Icons.trending_up_rounded, 'Price Changes', 'Notify me if the price changes significantly in one day.'),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: _isSaving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Preferences', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}
