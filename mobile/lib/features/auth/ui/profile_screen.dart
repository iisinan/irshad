import 'package:flutter/material.dart';
import '../data/auth_repository.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _authRepository = AuthRepository();
  Map<String, dynamic>? _user;
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
    final user = await _authRepository.getProfile();
    setState(() {
      _user = user;
      _isLoading = false;
    });
  }

  void _logout() async {
    await _authRepository.logout();
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
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
          : _user == null
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
    return Center(
      child: Column(
        children: [
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: primaryGreen.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: primaryGreen.withOpacity(0.1)),
                ),
                child: const CircleAvatar(
                  radius: 54,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person_rounded, size: 50, color: divider),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryGreen,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: const Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            _user!['name'] ?? 'Guest User',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textDark),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.verified_rounded, size: 14, color: primaryGreen),
              const SizedBox(width: 6),
              Text(
                (_user!['role'] ?? 'User').toUpperCase(),
                style: const TextStyle(color: primaryGreen, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5),
              ),
            ],
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
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(
        children: [
          _buildInfoTile(Icons.alternate_email_rounded, 'Email', _user!['email'] ?? ''),
          Divider(color: divider, height: 1, indent: 56),
          _buildInfoTile(Icons.location_on_outlined, 'Location', _user!['location'] ?? 'Nigeria'),
          Divider(color: divider, height: 1, indent: 56),
          _buildInfoTile(Icons.calendar_today_outlined, 'Member Since', 'March 2024'),
        ],
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
