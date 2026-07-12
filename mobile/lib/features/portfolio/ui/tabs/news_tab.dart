import 'package:flutter/material.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class NewsTab extends StatelessWidget {
  const NewsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Market News',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark),
          ),
          const SizedBox(height: 12),
          Text(
            'Stay updated with the latest news on NGX and Islamic Finance.',
            style: TextStyle(fontSize: 15, color: AppTheme.textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          _buildNewsItem(
            date: 'Just Now',
            title: 'NGX All-Share Index hits new record high',
            source: 'BusinessDay',
          ),
          const SizedBox(height: 16),
          _buildNewsItem(
            date: '2 hours ago',
            title: 'Central Bank of Nigeria issues new guidelines for Sukuk issuance',
            source: 'Nairametrics',
          ),
          const SizedBox(height: 16),
          _buildNewsItem(
            date: '5 hours ago',
            title: 'Dangote Cement announces record dividend payout for Q3',
            source: 'Bloomberg',
          ),
        ],
      ),
    );
  }

  Widget _buildNewsItem({required String date, required String title, required String source}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(date.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.primary, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textDark, height: 1.4)),
          const SizedBox(height: 12),
          Text(source, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
