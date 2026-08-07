import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class GuideTab extends StatelessWidget {
  const GuideTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.menu_book_rounded, size: 48, color: context.primary),
          const SizedBox(height: 16),
          Text(
            'Platform Guide',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark),
          ),
          const SizedBox(height: 12),
          Text(
            'Welcome to Irshad! Here is a quick guide on how to navigate the platform and manage your halal portfolio.',
            style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          _buildStep(context, '1', 'Market Scanner', 'Use the Market tab to scan NGX stocks for Shariah compliance before you buy.'),
          _buildStep(context, '2', 'Watchlist', 'Add stocks to your Watchlist to monitor their compliance status over time.'),
          _buildStep(context, '3', 'Zakat Calculator', 'Calculate your exact Zakat obligations based on your liquid assets and active portfolio.'),
          _buildStep(context, '4', 'Purification', 'Identify and cleanse impermissible dividend income from your portfolio.'),
        ],
      ),
    );
  }

  Widget _buildStep(BuildContext context, String number, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: context.primary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(number, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
