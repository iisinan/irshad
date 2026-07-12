import 'package:flutter/material.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});
@override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(flex: 2),

              // Logo / Brand mark
              Container(
                padding: const EdgeInsets.symmetric(vertical: 18),
                child: Image.asset(
                  'assets/images/logo.png',
                  height: 64,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 32),

              // Headline
              const Text(
                'Your Halal\nInvestment Guide',
                style: TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textDark,
                  height: 1.15,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Screen Nigerian stocks for Shariah compliance. Invest with confidence and peace of mind.',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textMuted,
                  height: 1.6,
                ),
              ),

              const Spacer(flex: 3),

              // Trust badges
              Row(
                children: [
                  _buildBadge(Icons.verified_outlined, 'AAOIFI Compliant'),
                  const SizedBox(width: 12),
                  _buildBadge(Icons.lock_outline_rounded, 'Bank-Level Security'),
                ],
              ),
              const SizedBox(height: 40),

              // Get Started (Login)
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.textDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Sign In',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Create Account (Register)
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.textDark,
                    side: const BorderSide(color: AppTheme.divider, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Create Account',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Footer note
              Center(
                child: Text(
                  'By continuing, you agree to our Terms & Privacy Policy',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.textMuted.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: AppTheme.primary),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }
}
