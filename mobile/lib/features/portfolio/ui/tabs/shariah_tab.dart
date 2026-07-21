import 'package:flutter/material.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class ShariahTab extends StatelessWidget {
  const ShariahTab({super.key});

  @override
  Widget build(BuildContext context) {

    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 24.0, bottom: 100.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shariah Methodology',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark),
          ),
          const SizedBox(height: 12),
          Text(
            'Our screening strictly follows the AAOIFI Shariah standards, ensuring all evaluated companies adhere to Islamic financial principles.',
            style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          _buildMethodologyCard(
            context: context,
            title: '1. Business Activity Screen',
            description: 'The core business of the company must be halal. We filter out companies involved in conventional finance, alcohol, pork, gambling, pornography, tobacco, and weapons.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            context: context,
            title: '2. Interest-Bearing Debt Ratio',
            description: 'Total interest-bearing debt must not exceed 30% of the trailing 12-month average market capitalization.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            context: context,
            title: '3. Interest-Bearing Securities Ratio',
            description: 'Total interest-bearing securities (investments and cash equivalents) must not exceed 30% of the trailing 12-month average market capitalization.',
          ),
          const SizedBox(height: 16),
          _buildMethodologyCard(
            context: context,
            title: '4. Non-Permissible Income Ratio',
            description: 'Income generated from non-permissible activities must not exceed 5% of total revenue. Any income derived from such sources must be purified.',
          ),
        ],
      ),
    );
  }

  Widget _buildMethodologyCard({required BuildContext context, required String title, required String description}) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
          SizedBox(height: 8),
          Text(description, style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.5)),
        ],
      ),
    );
  }
}
