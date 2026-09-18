import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:irshad_mobile/core/notifications/notification_service.dart';

class UpdatesDigestTab extends StatefulWidget {
  const UpdatesDigestTab({super.key});

  @override
  State<UpdatesDigestTab> createState() => _UpdatesDigestTabState();
}

class _UpdatesDigestTabState extends State<UpdatesDigestTab> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final response = await ApiService().get('updates/digest');
      final data = response.data['data'];
      setState(() {
        _emailEnabled = data['email_enabled'] ?? false;
        _pushEnabled = data['push_enabled'] ?? false;
        _frequency = data['frequency'] == 'monthly' ? 'Monthly' : 'Weekly';
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _savePreferences() async {
    setState(() => _isLoading = true);
    try {
      if (_pushEnabled) {
        final pushService = PushNotificationService();
        await pushService.initialize();
        final token = await pushService.getToken();
        if (token != null) {
          await ApiService().put('profile', {'fcm_token': token});
        }
      }
      
      await ApiService().put('updates/digest', {
        'email_enabled': _emailEnabled,
        'push_enabled': _pushEnabled,
        'frequency': _frequency.toLowerCase(),
      });
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Preferences saved successfully.'),
            backgroundColor: context.primary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save preferences: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  bool _emailEnabled = false;
  bool _pushEnabled = false;
  String _frequency = 'Weekly';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    context.primary.withValues(alpha: 0.1),
                    const Color(0xFFFBBF24).withValues(alpha: 0.15),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.appColors.divider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Icon(Icons.mail_outline_rounded, size: 32, color: context.primary),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Irshad Digest',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: context.textDark, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your weekly portfolio compliance summary delivered straight to you.',
                    style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _buildFeatureRow(context, Icons.check_circle_rounded, 'Compliance status of all tracked assets'),
            const SizedBox(height: 16),
            _buildFeatureRow(context, Icons.check_circle_rounded, 'Recent Shariah verdicts and rating changes'),
            const SizedBox(height: 16),
            _buildFeatureRow(context, Icons.check_circle_rounded, 'Purification dividend updates'),
            const SizedBox(height: 32),
            
            Text(
              'Notification Preferences',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark),
            ),
            const SizedBox(height: 16),
            
            _buildToggleCard(
              context: context,
              icon: Icons.email_outlined,
              title: 'Email Notifications',
              subtitle: 'Receive digest directly in your inbox',
              value: _emailEnabled,
              onChanged: (val) => setState(() => _emailEnabled = val),
            ),
            
            if (_emailEnabled) ...[
              const SizedBox(height: 12),
              Container(
                margin: const EdgeInsets.only(left: 16),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: context.bgAlt,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.appColors.divider),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Frequency', style: TextStyle(fontWeight: FontWeight.w600, color: context.textDark)),
                    DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _frequency,
                        icon: Icon(Icons.keyboard_arrow_down, color: context.textMuted),
                        style: TextStyle(fontWeight: FontWeight.w700, color: context.primary, fontSize: 14),
                        items: ['Weekly', 'Monthly'].map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _frequency = val);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),
            
            _buildToggleCard(
              context: context,
              icon: Icons.notifications_active_outlined,
              title: 'Push Notifications',
              subtitle: 'Get notified on your device',
              value: _pushEnabled,
              onChanged: (val) => setState(() => _pushEnabled = val),
            ),
            
            const SizedBox(height: 32),
            
            ElevatedButton(
              onPressed: _isLoading ? null : _savePreferences,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Text('Save Preferences', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: context.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildToggleCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: value ? context.primary.withValues(alpha: 0.05) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: value ? context.primary.withValues(alpha: 0.3) : context.appColors.divider),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: value ? context.primary.withValues(alpha: 0.1) : context.bgAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: value ? context.primary : context.textMuted, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: context.textDark),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(color: context.textMuted, fontSize: 13),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: context.primary,
          ),
        ],
      ),
    );
  }
}
