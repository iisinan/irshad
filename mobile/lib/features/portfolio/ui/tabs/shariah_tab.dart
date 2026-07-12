import 'package:flutter/material.dart';

class ShariahTab extends StatelessWidget {
  const ShariahTab({super.key});

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
            'Shariah Methodology',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textDark),
          ),
          const SizedBox(height: 12),
          const Text(
            'Our screening strictly follows the AAOIFI Shariah standards, ensuring all evaluated companies adhere to Islamic financial principles.',
            style: TextStyle(fontSize: 15, color: textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          _buildMethodologyCard(
            title: '1. Business Activity Screen',
            description: 'The core business of the company must be halal. We filter out companies involved in conventional finance, alcohol, pork, gambling, pornography, tobacco, and weapons.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            title: '2. Interest-Bearing Debt Ratio',
            description: 'Total interest-bearing debt must not exceed 30% of the trailing 12-month average market capitalization.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            title: '3. Interest-Bearing Securities Ratio',
            description: 'Total interest-bearing securities (investments and cash equivalents) must not exceed 30% of the trailing 12-month average market capitalization.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            title: '4. Non-Permissible Income Ratio',
            description: 'Income generated from non-permissible activities must not exceed 5% of total revenue. Any income derived from such sources must be purified.',
          ),
        ],
      ),
    );
  }

  Widget _buildMethodologyCard({required String title, required String description}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8E2D9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1A1208))),
          const SizedBox(height: 8),
          Text(description, style: const TextStyle(fontSize: 14, color: Color(0xFF9A8C70), height: 1.5)),
        ],
      ),
    );
  }
}
