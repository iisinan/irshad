import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class UpdatesDigestTab extends StatelessWidget {
  const UpdatesDigestTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  context.primary.withValues(alpha: 0.1),
                  const Color(0xFFFBBF24).withValues(alpha: 0.15),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: context.appColors.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Icon(Icons.mail_outline_rounded, size: 32, color: context.primary),
                ),
                const SizedBox(height: 20),
                Text(
                  'Irshad Digest',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: context.textDark, letterSpacing: -0.5),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your weekly portfolio compliance summary delivered straight to you.',
                  style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildFeatureRow(context, Icons.check_circle_rounded, 'Compliance status of all tracked assets'),
          const SizedBox(height: 16),
          _buildFeatureRow(context, Icons.check_circle_rounded, 'Recent Shariah verdicts and rating changes'),
          const SizedBox(height: 16),
          _buildFeatureRow(context, Icons.check_circle_rounded, 'Purification dividend updates'),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.appColors.divider),
            ),
            child: Column(
              children: [
                Icon(Icons.mark_email_unread_rounded, size: 40, color: context.textMuted.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'Preferences coming soon',
                  style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  'We are rolling out email and push notification preferences shortly.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.textMuted, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: context.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
