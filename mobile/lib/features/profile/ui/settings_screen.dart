import 'package:flutter/material.dart';

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
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
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
                onChanged: (val) => setState(() => _biometricsEnabled = val),
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
                onTap: () {},
              ),
              _buildActionTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () {},
              ),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                title: 'About IRSHAD',
                subtitle: 'Version 1.0.0',
                onTap: () {},
              ),
            ]),

            const SizedBox(height: 48),
            TextButton(
              onPressed: () {},
              child: const Text('Delete Account', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w800, fontSize: 13)),
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
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 1),
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
        divided.add(const Divider(color: divider, height: 1, indent: 56));
      }
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(children: divided),
    );
  }

  Widget _buildLanguageTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
        child: const Icon(Icons.language_rounded, color: textMuted, size: 20),
      ),
      title: const Text('Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: textDark)),
      trailing: DropdownButton<String>(
        value: _selectedLanguage,
        underline: const SizedBox(),
        dropdownColor: Colors.white,
        style: const TextStyle(color: primaryGreen, fontWeight: FontWeight.w800, fontSize: 14),
        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: textMuted),
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
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: textMuted, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: textDark)),
      value: value,
      onChanged: onChanged,
      activeColor: primaryGreen,
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
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: textMuted, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: textDark)),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(fontSize: 12, color: textMuted)) : null,
      trailing: const Icon(Icons.chevron_right_rounded, size: 20, color: divider),
      onTap: onTap,
    );
  }
}
