import 'package:flutter/material.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
/// The Upgrade screen is shown when a guest taps "Upgrade".
/// Users must register first before they can log in / upgrade.
class UpgradeScreen extends StatelessWidget {
  const UpgradeScreen({super.key});
@override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- Badge ---
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: context.halalBg,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome_rounded, size: 14, color: context.primary),
                    const SizedBox(width: 6),
                    Text(
                      'IRSHAD Premium',
                      style: TextStyle(
                        color: context.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // --- Headline ---
              Text(
                'Invest with\nconfidence.',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  color: context.textDark,
                  height: 1.1,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Get unlimited access to Shariah screening,\nreal-time prices, and portfolio analytics.',
                style: TextStyle(
                  color: context.textMuted,
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),

              // --- Feature list ---
              _buildFeature(
                Icons.verified_rounded,
                'Unlimited Shariah Screening',
                'Screen any stock globally against AAOIFI standards',
                context.primary,
              ),
              _buildFeature(
                Icons.show_chart_rounded,
                'Real-Time Price Data',
                'Live prices, charts and market cap data',
                const Color(0xFF2563EB),
              ),
              _buildFeature(
                Icons.bookmark_rounded,
                'Unlimited Watchlists',
                'Track as many stocks as you want',
                const Color(0xFF7C3AED),
              ),
              _buildFeature(
                Icons.pie_chart_rounded,
                'Portfolio Analytics',
                'Halal score, purification calculator & more',
                context.questionable,
              ),
              _buildFeature(
                Icons.notifications_active_rounded,
                'Price Alerts',
                'Get notified when your stocks move',
                const Color(0xFFDC2626),
              ),

              const SizedBox(height: 32),
              Divider(color: context.divider),
              const SizedBox(height: 20),

              // --- CTA note ---
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: context.primary, size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Create a free account first to get started. Once registered, you can activate your premium plan.',
                        style: TextStyle(color: const Color(0xFF166534), fontSize: 13, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // --- Register button (primary CTA) ---
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.textDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Create Free Account',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // --- Already have account → Login ---
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.textDark,
                    side: BorderSide(color: context.divider, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'Already have an account? Sign in',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // --- Legal note ---
              Center(
                child: Text(
                  'By continuing, you agree to our Terms of Service\nand Privacy Policy.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.textMuted, fontSize: 11, height: 1.5),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeature(IconData icon, String title, String subtitle, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: context.textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: context.textMuted,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.only(top: 10),
            child: Icon(Icons.check_circle_rounded, color: context.primary, size: 18),
          ),
        ],
      ),
    );
  }
}
