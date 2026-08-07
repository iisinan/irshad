import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'admin_users_screen.dart';
import 'admin_compliance_screen.dart';
import 'admin_tickers_screen.dart';
import 'admin_zakat_settings_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [context.primary, context.primary.withValues(alpha: 0.8)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_rounded, color: Colors.white, size: 40),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Superadmin Access', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 4),
                        Text('Manage users, compliance, and settings.', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Text('MANAGEMENT MODULES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted)),
            const SizedBox(height: 16),
            _buildAdminCard(context, 'Users', 'Manage registered users and permissions', Icons.people_alt_rounded, () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminUsersScreen()));
            }),
            const SizedBox(height: 16),
            _buildAdminCard(context, 'Compliance Queue', 'Review financial and shariah reports', Icons.fact_check_rounded, () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminComplianceScreen()));
            }),
            const SizedBox(height: 16),
            _buildAdminCard(context, 'Tickers', 'Edit stock information and details', Icons.business_rounded, () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminTickersScreen()));
            }),
            const SizedBox(height: 16),
            _buildAdminCard(context, 'Zakat Settings', 'Configure global zakat variables', Icons.calculate_rounded, () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminZakatSettingsScreen()));
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminCard(BuildContext context, String title, String subtitle, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: context.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(fontSize: 13, color: context.textMuted)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: context.textMuted, size: 16),
          ],
        ),
      ),
    );
  }
}
