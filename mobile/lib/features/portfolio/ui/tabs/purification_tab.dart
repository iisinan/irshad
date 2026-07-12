import 'package:flutter/material.dart';

class PurificationTab extends StatelessWidget {
  const PurificationTab({super.key});

  @override
  Widget build(BuildContext context) {
    const Color primaryGold = Color(0xFFC9A84C);
    const Color textDark = Color(0xFF1A1208);
    const Color textMuted = Color(0xFF9A8C70);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.water_drop_outlined, size: 48, color: primaryGold),
          const SizedBox(height: 16),
          const Text(
            'Dividend Purification',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textDark),
          ),
          const SizedBox(height: 12),
          const Text(
            'Purification is the process of donating a portion of your dividends to charity to cleanse your income from non-permissible sources (like interest).',
            style: TextStyle(fontSize: 15, color: textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE8E2D9)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL PURIFICATION DUE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textMuted)),
                const SizedBox(height: 8),
                const Text('₦0.00', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: textDark)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: textDark,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Purify Now', style: TextStyle(fontWeight: FontWeight.w700)),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
