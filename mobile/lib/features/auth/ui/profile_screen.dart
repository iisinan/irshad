import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/auth_repository.dart';
import '../../portfolio/ui/zakat_calculator_screen.dart';
import '../../portfolio/providers/portfolio_provider.dart';

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
  bool _notificationsEnabled = true;

  final List<String> _languages = ['English', 'Hausa', 'Yoruba', 'Igbo'];

  // Theme Constants
Color get cardBg => context.bgAlt;
@override
  void initState() {
    super.initState();
    _fetchProfile();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
        _selectedLanguage = prefs.getString('language') ?? 'English';
      });
    }
  }

  Future<void> _toggleNotifications(bool val) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', val);
    setState(() => _notificationsEnabled = val);
    if (val) {
      _authRepository.registerFCMToken();
    } else {
      await _authRepository.unsubscribeFCMToken();
    }
    if (mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            val ? 'Push notifications activated' : 'Push notifications deactivated',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          backgroundColor: val ? context.primary : const Color(0xFF64748B),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
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
    if (mounted) {
      Provider.of<PortfolioProvider>(context, listen: false).clear();
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AppStateProvider>(context).userProfile;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Profile', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: context.textDark, size: 22),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          IconButton(
            icon: Icon(Icons.logout_rounded, color: context.haram, size: 22),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : user == null
              ? Center(child: Text('Failed to load profile', style: TextStyle(color: context.textDark)))
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
                      _buildSectionHeader('Account Usage'),
                      const SizedBox(height: 12),
                      _buildPlanUsageCard(user),
                      
                      const SizedBox(height: 32),
                      _buildSectionHeader('Tools'),
                      const SizedBox(height: 12),
                      _buildToolsCard(),

                      const SizedBox(height: 32),
                      _buildSectionHeader('Preferences'),
                      const SizedBox(height: 12),
                      _buildPreferencesCard(),

                      if (user['role'] == 'admin' || user['role'] == 'superadmin' || user['is_admin'] == true) ...[
                        const SizedBox(height: 32),
                        _buildSectionHeader('Administration'),
                        const SizedBox(height: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: context.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: context.primary.withValues(alpha: 0.3)),
                          ),
                          child: ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: context.primary, borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.shield_rounded, color: Colors.white, size: 20),
                            ),
                            title: Text('Admin Dashboard', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.primary)),
                            trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.primary),
                            onTap: () => Navigator.pushNamed(context, '/admin'),
                          ),
                        ),
                      ],

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
                            backgroundColor: context.primary,
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
                          icon: Icon(Icons.delete_forever_rounded, size: 18, color: context.haram),
                          label: Text('Delete Account', style: TextStyle(fontWeight: FontWeight.w700, color: context.haram)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: context.haram, width: 1.5),
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
        backgroundColor: context.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: context.haram, size: 28),
            SizedBox(width: 8),
            Text('Delete Account', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
          ],
        ),
        content: Text(
          'Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all saved portfolio and favorite stocks.',
          style: TextStyle(color: context.textMuted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              await _authRepository.deleteAccount();
              if (!mounted) return;
              navigator.pushReplacementNamed('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: context.haram,
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
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: context.primary.withOpacity(0.1),
            child: Text(user?['first_name']?[0] ?? 'U', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: context.primary)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? '',
                  style: TextStyle(fontSize: 14, color: context.textMuted),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: user?['tier']?['slug'] == 'max' ? const Color(0xFFD9A05B).withOpacity(0.15) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46).withOpacity(0.1) : context.bgSection,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: user?['tier']?['slug'] == 'max' ? const Color(0xFFD9A05B).withOpacity(0.3) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46).withOpacity(0.2) : context.divider),
                  ),
                  child: Text(
                    (user?['tier']?['name'] ?? 'Miftah').toUpperCase(),
                    style: TextStyle(
                      fontSize: 10, 
                      fontWeight: FontWeight.w900, 
                      letterSpacing: 0.5,
                      color: user?['tier']?['slug'] == 'max' ? const Color(0xFFB8860B) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46) : context.textMuted,
                    ),
                  ),
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
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark),
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final user = Provider.of<AppStateProvider>(context).userProfile;
    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        children: [
          _buildInfoTile(Icons.alternate_email_rounded, 'Email', user?['email'] ?? ''),
          Divider(color: context.divider, height: 1, indent: 56),
          _buildInfoTile(Icons.location_on_outlined, 'Location', user?['location'] ?? 'Nigeria'),
          Divider(color: context.divider, height: 1, indent: 56),
          _buildInfoTile(
            Icons.calendar_today_outlined,
            'Member Since', 
            user?['created_at'] != null 
              ? () {
                  try {
                    return DateFormat('MMMM yyyy').format(DateTime.parse(user!['created_at'].toString()).toLocal());
                  } catch (_) {
                    return DateFormat('MMMM yyyy').format(DateTime.now());
                  }
                }()
              : DateFormat('MMMM yyyy').format(DateTime.now()),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanUsageCard(Map<String, dynamic> user) {
    final tier = user['tier'] as Map<String, dynamic>? ?? {};
    final slug = (tier['slug'] ?? 'free').toString();
    final planName = (tier['name'] ?? 'Miftah (Free)').toString();
    final features = tier['features'] as Map<String, dynamic>? ?? {};
    final usage = user['usage_summary'] as Map<String, dynamic>? ?? {};
    final activeSub = user['active_subscription'] as Map<String, dynamic>?;

    int limitOf(String key, int fallback) {
      final raw = features[key];
      if (raw is num) return raw.toInt();
      return fallback;
    }

    int usedOf(String key) {
      final u = usage[key];
      if (u is Map && u['used'] is num) return (u['used'] as num).toInt();
      return 0;
    }

    final screenUsage = usage['stock_screens_per_month'];
    final isQuarterly = slug == 'pro' ||
        (screenUsage is Map && screenUsage['period']?.toString() == 'quarter');

    final rows = [
      (
        isQuarterly ? 'Stock Screens (Quarterly Quota)' : 'Stock Screens (Monthly Quota)',
        usedOf('stock_screens_per_month'),
        limitOf('stock_screens_per_month', slug == 'max' ? -1 : slug == 'pro' ? 30 : 3),
      ),
      (
        'Portfolio Holdings',
        usedOf('portfolio_limit'),
        limitOf('portfolio_limit', slug == 'max' ? -1 : slug == 'pro' ? 7 : 3),
      ),
      (
        'Watchlist Alerts',
        usedOf('watchlist_limit'),
        limitOf('watchlist_limit', slug == 'max' ? -1 : slug == 'pro' ? 2 : 0),
      ),
      (
        slug == 'pro' ? 'Baskets (3 Curated + Custom)' : 'Custom Baskets',
        usedOf('baskets'),
        limitOf('baskets', slug == 'max' ? -1 : slug == 'pro' ? 3 : 0),
      ),
      (
        isQuarterly ? 'Purification Runs (Quarterly Quota)' : 'Purification Runs (Monthly Quota)',
        usedOf('purifications_per_month'),
        limitOf('purifications_per_month', slug == 'max' ? -1 : slug == 'pro' ? 6 : 0),
      ),
    ];

    String buildSubscriptionSubtitle() {
      if (activeSub == null) return 'Standard Access';
      final rawCycle = activeSub['billing_cycle']?.toString().trim();
      final statusRaw = (activeSub['status'] ?? 'active').toString().trim().toLowerCase();
      final statusLabel = statusRaw == 'past_due'
          ? 'Attention Needed'
          : statusRaw == 'canceled'
              ? 'Ending Soon'
              : 'Active';
      final parts = <String>[
        if (rawCycle != null && rawCycle.isNotEmpty) '${rawCycle[0].toUpperCase()}${rawCycle.substring(1).toLowerCase()}',
        statusLabel,
      ];
      final dateRaw = (activeSub['ends_at'] ?? activeSub['renews_at'])?.toString();
      if (dateRaw != null && dateRaw.isNotEmpty) {
        try {
          final parsed = DateTime.parse(dateRaw).toLocal();
          final prefix = statusRaw == 'canceled' || activeSub['ends_at'] != null ? 'Until' : 'Through';
          parts.add('$prefix ${DateFormat('MMM d, yyyy').format(parsed)}');
        } catch (_) {}
      }
      return parts.join(' • ');
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      planName,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      buildSubscriptionSubtitle(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: (activeSub?['status']?.toString().toLowerCase() == 'past_due')
                            ? const Color(0xFFDC2626)
                            : context.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: context.divider, height: 1),
          const SizedBox(height: 14),
          ...rows.map((r) {
            final label = r.$1;
            final used = r.$2;
            final limit = r.$3;
            final valueText = limit < 0
                ? 'Unlimited ($used used)'
                : limit == 0
                    ? 'Locked'
                    : '$used / $limit';
            final pct = limit > 0 ? (used / limit).clamp(0.0, 1.0) : 0.0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted)),
                      Text(
                        valueText,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: limit == 0 ? context.textMuted : context.textDark,
                        ),
                      ),
                    ],
                  ),
                  if (limit > 0) ...[
                    const SizedBox(height: 5),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct,
                        minHeight: 5,
                        backgroundColor: context.divider,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          pct >= 1.0 ? context.haram : (pct >= 0.75 ? const Color(0xFFD97706) : context.primary),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildToolsCard() {
    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        children: [
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.calculate_outlined, color: context.textMuted, size: 20),
            ),
            title: Text('Zakat Calculator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
            trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.textMuted),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const _ZakatWrapper()));
            },
          ),
          Divider(color: context.divider, height: 1, indent: 56),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.notifications_none_rounded, color: context.textMuted, size: 20),
            ),
            title: Text('Notifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
            trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.textMuted),
            onTap: () {
              Navigator.pushNamed(context, '/notifications');
            },
          ),
          Divider(color: context.divider, height: 1, indent: 56),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.notifications_active_outlined, color: context.textMuted, size: 20),
            ),
            title: Text('My Alerts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
            trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: context.textMuted),
            onTap: () {
              Navigator.pushNamed(context, '/alerts');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPreferencesCard() {
    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        children: [
          // Push Notifications activate/deactivate toggle
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _notificationsEnabled ? context.primary.withValues(alpha: 0.1) : context.bg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _notificationsEnabled ? Icons.notifications_active_rounded : Icons.notifications_off_outlined,
                color: _notificationsEnabled ? context.primary : context.textMuted,
                size: 20,
              ),
            ),
            title: Text(
              'Push Notifications',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark),
            ),
            subtitle: Text(
              _notificationsEnabled ? 'Active (stocks, compliance & digest)' : 'Deactivated',
              style: TextStyle(fontSize: 12, color: context.textMuted),
            ),
            trailing: Switch.adaptive(
              value: _notificationsEnabled,
              activeTrackColor: context.primary,
              onChanged: _toggleNotifications,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          ),
          Divider(color: context.divider, height: 1, indent: 56),
          // Preferred Language
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(8)),
                  child: Icon(Icons.language_rounded, color: context.textMuted, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Preferred Language',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark),
                  ),
                ),
                DropdownButton<String>(
                  value: _selectedLanguage,
                  dropdownColor: context.bgAlt,
                  underline: const SizedBox(),
                  icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.textMuted),
                  style: TextStyle(color: context.primary, fontWeight: FontWeight.w800, fontSize: 14),
                  items: _languages.map((String lang) {
                    return DropdownMenuItem<String>(
                      value: lang,
                      child: Text(lang),
                    );
                  }).toList(),
                  onChanged: (lang) async {
                    if (lang != null) {
                      setState(() => _selectedLanguage = lang);
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setString('language', lang);
                    }
                  },
                ),
              ],
            ),
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
          color: context.bg,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: context.textMuted, size: 20),
      ),
      title: Text(label, style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w600)),
      subtitle: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
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
