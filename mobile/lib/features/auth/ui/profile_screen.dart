import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/auth_repository.dart';
import '../../portfolio/ui/zakat_calculator_screen.dart';

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
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color cardBg = Colors.white;
  static const Color divider = Color(0xFFE5E7EB);

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
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: textDark, size: 22),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 22),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryGreen))
          : user == null
              ? const Center(child: Text('Failed to load profile', style: TextStyle(color: textDark)))
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
                            backgroundColor: textDark,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
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
        border: Border.all(color: divider),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: primaryGreen.withOpacity(0.1),
            child: Text(user?['first_name']?[0] ?? 'U', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: primaryGreen)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? '',
                  style: const TextStyle(fontSize: 14, color: textMuted),
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
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textDark),
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
        border: Border.all(color: divider),
      ),
      child: Column(
        children: [
          _buildInfoTile(Icons.alternate_email_rounded, 'Email', user?['email'] ?? ''),
          const Divider(color: divider, height: 1, indent: 56),
          _buildInfoTile(Icons.location_on_outlined, 'Location', user?['location'] ?? 'Nigeria'),
          const Divider(color: divider, height: 1, indent: 56),
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
        border: Border.all(color: divider),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.calculate_outlined, color: textMuted, size: 20),
        ),
        title: const Text('Zakat Calculator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: textDark)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: textMuted),
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
        border: Border.all(color: divider),
      ),
      child: Row(
        children: [
          const Icon(Icons.language_rounded, color: textMuted, size: 20),
          const SizedBox(width: 16),
          const Expanded(
            child: Text(
              'Preferred Language',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: textDark),
            ),
          ),
          DropdownButton<String>(
            value: _selectedLanguage,
            dropdownColor: Colors.white,
            underline: const SizedBox(),
            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: textMuted),
            style: const TextStyle(color: primaryGreen, fontWeight: FontWeight.w800, fontSize: 14),
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
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: textMuted, size: 20),
      ),
      title: Text(label, style: const TextStyle(fontSize: 11, color: textMuted, fontWeight: FontWeight.w600)),
      subtitle: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: textDark)),
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
