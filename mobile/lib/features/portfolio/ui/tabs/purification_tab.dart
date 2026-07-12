import 'package:flutter/material.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class PurificationTab extends StatelessWidget {
  const PurificationTab({super.key});

  @override
  Widget build(BuildContext context) {

return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.water_drop_outlined, size: 48, color: AppTheme.primary),
          const SizedBox(height: 16),
          Text(
            'Dividend Purification',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark),
          ),
          const SizedBox(height: 12),
          Text(
            'Purification is the process of donating a portion of your dividends to charity to cleanse your income from non-permissible sources (like interest).',
            style: TextStyle(fontSize: 15, color: AppTheme.textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('TOTAL PURIFICATION DUE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
                const SizedBox(height: 8),
                Text('₦0.00', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.textDark,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Purify Now', style: TextStyle(fontWeight: FontWeight.w700)),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
