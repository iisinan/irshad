import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
                      'IRSHAD PLANS • MIFTAH, RAWDHA & NOOR',
                      style: TextStyle(
                        color: context.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        letterSpacing: 0.4,
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
                'Start free on Miftah or unlock Rawdha (Pro) and Noor (Max) for automated AAOIFI screening, Zakat, purification, and 90-day drift tracking.',
                style: TextStyle(
                  color: context.textMuted,
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),

              // --- Feature list ---
              _buildFeature(
                context,
                Icons.verified_rounded,
                'Miftah (Free) — Essential Access',
                '3 AAOIFI stock screens/month, 3 portfolio holdings, News & Resources',
                const Color(0xFF64748B),
              ),
              _buildFeature(
                context,
                Icons.workspace_premium_rounded,
                'Rawdha (Pro) — Active NGX Investor',
                '10 screens/mo, 7 holdings, 2 watchlist alerts, 3 curated baskets, 2 purifications/mo & Zakat calculator',
                context.primary,
              ),
              _buildFeature(
                context,
                Icons.auto_awesome_rounded,
                'Noor (Max) — Unlimited Compliance',
                'Unlimited screening, holdings, watchlist & purification plus Dividend Alerts, 90-day Drift Tracking & Monthly Spotlight',
                const Color(0xFFD9A05B),
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
                child: RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: TextStyle(color: context.textMuted, fontSize: 11, height: 1.5),
                    children: [
                      const TextSpan(text: 'By continuing, you agree to our '),
                      TextSpan(
                        text: 'Terms of Service',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                        ),
                        recognizer: TapGestureRecognizer()
                          ..onTap = () => launchUrl(Uri.parse('https://irshad.app/terms'), mode: LaunchMode.externalApplication),
                      ),
                      const TextSpan(text: '\nand '),
                      TextSpan(
                        text: 'Privacy Policy',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                        ),
                        recognizer: TapGestureRecognizer()
                          ..onTap = () => launchUrl(Uri.parse('https://irshad.app/privacy'), mode: LaunchMode.externalApplication),
                      ),
                      const TextSpan(text: '.'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeature(BuildContext context, IconData icon, String title, String subtitle, Color color) {
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
