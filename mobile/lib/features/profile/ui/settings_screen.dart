import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';

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
  final FlutterSecureStorage _storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));

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
        content: Text('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.', style: TextStyle(color: context.textMuted)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: context.textDark)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: context.haram,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
              elevation: 0,
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
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Settings', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
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
              _buildThemeTile(),
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
              child: Text('Delete Account', style: TextStyle(color: context.haram, fontWeight: FontWeight.w800, fontSize: 13)),
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
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1),
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
        divided.add(Divider(color: context.divider, height: 1, indent: 56));
      }
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Column(children: divided),
    );
  }

  Widget _buildLanguageTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(Icons.language_rounded, color: context.textMuted, size: 20),
      ),
      title: Text('Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: context.textDark)),
      trailing: DropdownButton<String>(
        value: _selectedLanguage,
        underline: const SizedBox(),
        dropdownColor: context.bgAlt,
        style: TextStyle(color: context.primary, fontWeight: FontWeight.w800, fontSize: 14),
        icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.textMuted),
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
        decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: context.textMuted, size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: context.textDark)),
      value: value,
      onChanged: onChanged,
      activeColor: context.primary,
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
        decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: context.textMuted, size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: context.textDark)),
      subtitle: subtitle != null ? Text(subtitle, style: TextStyle(fontSize: 12, color: context.textMuted)) : null,
      trailing: Icon(Icons.chevron_right_rounded, size: 20, color: context.divider),
      onTap: onTap,
    );
  }

  Widget _buildThemeTile() {
    final themeMode = Provider.of<AppStateProvider>(context).themeMode;
    String modeText = 'System Default';
    if (themeMode == ThemeMode.light) modeText = 'Light Mode';
    if (themeMode == ThemeMode.dark) modeText = 'Dark Mode';

    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
        child: Icon(Icons.brightness_medium_rounded, color: context.textMuted, size: 20),
      ),
      title: Text('Appearance', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: context.textDark)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(modeText, style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down_rounded, color: context.textMuted),
        ],
      ),
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          builder: (context) => Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Appearance', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark)),
                const SizedBox(height: 16),
                _buildThemeOption(ThemeMode.light, 'Light Mode', Icons.light_mode_rounded),
                _buildThemeOption(ThemeMode.dark, 'Dark Mode', Icons.dark_mode_rounded),
                _buildThemeOption(ThemeMode.system, 'System Default', Icons.brightness_medium_rounded),
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildThemeOption(ThemeMode mode, String label, IconData icon) {
    final appState = Provider.of<AppStateProvider>(context, listen: false);
    final isSelected = appState.themeMode == mode;
    return ListTile(
      onTap: () {
        appState.setThemeMode(mode);
        Navigator.pop(context);
      },
      leading: Icon(icon, color: isSelected ? context.primary : context.textMuted),
      title: Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500, color: isSelected ? context.primary : context.textDark)),
      trailing: isSelected ? Icon(Icons.check_circle_rounded, color: context.primary) : null,
    );
  }
}
