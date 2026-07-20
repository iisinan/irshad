import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/auth_repository.dart';
import '../../portfolio/ui/zakat_calculator_screen.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _authRepository = AuthRepository();
  bool _isLoading = true;
  String _selectedLanguage = 'English';

  final List<String> _languages = ['English', 'Hausa', 'Yoruba', 'Igbo'];

  // Theme Constants
static const Color cardBg = Colors.white;
@override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  void _fetchProfile() async {
    setState(() => _isLoading = true);
    await Provider.of<AppStateProvider>(context, listen: false).loadProfile();
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _logout() async {
    await _authRepository.logout();
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AppStateProvider>(context).userProfile;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textDark, size: 22),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.haram, size: 22),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : user == null
              ? const Center(child: Text('Failed to load profile', style: TextStyle(color: AppTheme.textDark)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    children: [
                      // Header
                      _buildHeaderCard(),
                      const SizedBox(height: 32),
                      
                      // Account Sections
                      _buildSectionHeader('Account Information'),
                      const SizedBox(height: 12),
                      _buildInfoCard(),
                      
                      const SizedBox(height: 32),
                      _buildSectionHeader('Tools'),
                      const SizedBox(height: 12),
                      _buildToolsCard(),

                      const SizedBox(height: 32),
                      _buildSectionHeader('Preferences'),
                      const SizedBox(height: 12),
                      _buildPreferencesCard(),

                      const SizedBox(height: 48),
                      // Edit Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton.icon(
                          onPressed: () => Navigator.pushNamed(context, '/edit_profile'),
                          icon: const Icon(Icons.edit_rounded, size: 18),
                          label: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w700)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Delete Account Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: OutlinedButton.icon(
                          onPressed: () => _showDeleteConfirmation(context),
                          icon: const Icon(Icons.delete_forever_rounded, size: 18, color: AppTheme.haram),
                          label: const Text('Delete Account', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.haram)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.haram, width: 1.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.haram, size: 28),
            SizedBox(width: 8),
            Text('Delete Account', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
          ],
        ),
        content: const Text(
          'Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all saved portfolio and favorite stocks.',
          style: TextStyle(color: AppTheme.textMuted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              await _authRepository.deleteAccount();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.haram,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderCard() {
    final user = Provider.of<AppStateProvider>(context).userProfile;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: AppTheme.primary.withOpacity(0.1),
            child: Text(user?['first_name']?[0] ?? 'U', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.primary)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? '',
                  style: const TextStyle(fontSize: 14, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textDark),
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final user = Provider.of<AppStateProvider>(context).userProfile;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        children: [
          _buildInfoTile(Icons.alternate_email_rounded, 'Email', user?['email'] ?? ''),
          const Divider(color: AppTheme.divider, height: 1, indent: 56),
          _buildInfoTile(Icons.location_on_outlined, 'Location', user?['location'] ?? 'Nigeria'),
          const Divider(color: AppTheme.divider, height: 1, indent: 56),
          _buildInfoTile(Icons.calendar_today_outlined, 'Member Since', 
            user?['created_at'] != null 
              ? DateFormat('MMMM yyyy').format(DateTime.parse(user!['created_at']))
              : 'March 2024'),
        ],
      ),
    );
  }

  Widget _buildToolsCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.calculate_outlined, color: AppTheme.textMuted, size: 20),
        ),
        title: const Text('Zakat Calculator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textMuted),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const _ZakatWrapper()));
        },
      ),
    );
  }

  Widget _buildPreferencesCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Row(
        children: [
          const Icon(Icons.language_rounded, color: AppTheme.textMuted, size: 20),
          const SizedBox(width: 16),
          const Expanded(
            child: Text(
              'Preferred Language',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
            ),
          ),
          DropdownButton<String>(
            value: _selectedLanguage,
            dropdownColor: Colors.white,
            underline: const SizedBox(),
            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textMuted),
            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 14),
            items: _languages.map((String lang) {
              return DropdownMenuItem<String>(
                value: lang,
                child: Text(lang),
              );
            }).toList(),
            onChanged: (lang) {
              if (lang != null) setState(() => _selectedLanguage = lang);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.bg,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppTheme.textMuted, size: 20),
      ),
      title: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
      subtitle: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    );
  }
}


class _ZakatWrapper extends StatelessWidget {
  const _ZakatWrapper();
  @override
  Widget build(BuildContext context) => const ZakatCalculatorScreen();
}
