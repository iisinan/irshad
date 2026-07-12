import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _biometricsEnabled = false;
  String _selectedLanguage = 'English';
  final List<String> _languages = ['English', 'Hausa', 'Yoruba', 'Igbo'];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _biometricsEnabled = prefs.getBool('biometrics_enabled') ?? false;
    });
  }

  Future<void> _toggleBiometrics(bool val) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('biometrics_enabled', val);
    setState(() {
      _biometricsEnabled = val;
    });
  }


final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch URL')));
    }
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account?'),
        content: const Text('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.', style: TextStyle(color: AppTheme.textMuted)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textDark)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.haram,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(child: CircularProgressIndicator()),
              );
              
              try {
                await _apiService.delete('account');
                await _storage.deleteAll();
                if (mounted) {
                  Navigator.pop(context); // Close loading dialog
                  Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                }
              } catch (e) {
                if (mounted) {
                  Navigator.pop(context); // Close loading dialog
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete account. Try again.')));
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 24),
            
            // Preferences Group
            _buildSectionLabel('PREFERENCES'),
            const SizedBox(height: 8),
            _buildGroupedCard([
              _buildLanguageTile(),
              _buildSwitchTile(
                icon: Icons.notifications_active_rounded,
                title: 'Push Notifications',
                value: _notificationsEnabled,
                onChanged: (val) => setState(() => _notificationsEnabled = val),
              ),
            ]),

            const SizedBox(height: 32),
            
            // Security Group
            _buildSectionLabel('SECURITY'),
            const SizedBox(height: 8),
            _buildGroupedCard([
              _buildActionTile(
                icon: Icons.lock_outline_rounded,
                title: 'Change Password',
                onTap: () => Navigator.pushNamed(context, '/edit_profile'),
              ),
              _buildSwitchTile(
                icon: Icons.fingerprint_rounded,
                title: 'Biometric Login',
                value: _biometricsEnabled,
                onChanged: _toggleBiometrics,
              ),
            ]),

            const SizedBox(height: 32),
            
            // Support Group
            _buildSectionLabel('SUPPORT & LEGAL'),
            const SizedBox(height: 8),
            _buildGroupedCard([
              _buildActionTile(
                icon: Icons.help_outline_rounded,
                title: 'Help Center',
                onTap: () => _launchUrl('https://irshad.app/help'),
              ),
              _buildActionTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () => _launchUrl('https://irshad.app/privacy'),
              ),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                title: 'About IRSHAD',
                subtitle: 'Version 1.0.0',
                onTap: () => _launchUrl('https://irshad.app/about'),
              ),
            ]),

            const SizedBox(height: 48),
            TextButton(
              onPressed: _showDeleteAccountDialog,
              child: const Text('Delete Account', style: TextStyle(color: AppTheme.haram, fontWeight: FontWeight.w800, fontSize: 13)),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 24, bottom: 4),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1),
        ),
      ),
    );
  }

  Widget _buildGroupedCard(List<Widget> children) {
    // Add dividers between children
    List<Widget> divided = [];
    for (int i = 0; i < children.length; i++) {
      divided.add(children[i]);
      if (i < children.length - 1) {
        divided.add(const Divider(color: AppTheme.divider, height: 1, indent: 56));
      }
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(children: divided),
    );
  }

  Widget _buildLanguageTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(8)),
        child: const Icon(Icons.language_rounded, color: AppTheme.textMuted, size: 20),
      ),
      title: const Text('Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textDark)),
      trailing: DropdownButton<String>(
        value: _selectedLanguage,
        underline: const SizedBox(),
        dropdownColor: Colors.white,
        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 14),
        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textMuted),
        items: _languages.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
        onChanged: (val) {
          if (val != null) {
            setState(() => _selectedLanguage = val);
          }
        },
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: AppTheme.textMuted, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textDark)),
      value: value,
      onChanged: onChanged,
      activeColor: AppTheme.primary,
      contentPadding: const EdgeInsets.only(left: 16, right: 8),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: AppTheme.textMuted, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textDark)),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)) : null,
      trailing: const Icon(Icons.chevron_right_rounded, size: 20, color: AppTheme.divider),
      onTap: onTap,
    );
  }
}
