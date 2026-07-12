import 'package:flutter/material.dart';

class NewsTab extends StatelessWidget {
  const NewsTab({super.key});

  @override
  Widget build(BuildContext context) {
    const Color textDark = Color(0xFF1A1208);
    const Color textMuted = Color(0xFF9A8C70);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Market News',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textDark),
          ),
          const SizedBox(height: 12),
          const Text(
            'Stay updated with the latest news on NGX and Islamic Finance.',
            style: TextStyle(fontSize: 15, color: textMuted, height: 1.5),
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
        border: Border.all(color: const Color(0xFFE8E2D9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(date.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFC9A84C), letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1A1208), height: 1.4)),
          const SizedBox(height: 12),
          Text(source, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9A8C70))),
        ],
      ),
    );
  }
}
