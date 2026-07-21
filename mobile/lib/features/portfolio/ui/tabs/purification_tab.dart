import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/portfolio_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class PurificationTab extends StatelessWidget {
  const PurificationTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PortfolioProvider>(
      builder: (context, provider, child) {
        final isLoading = provider.isLoading;
        final totalPurificationDue = provider.summary['purification_due'] ?? 0.0;

        return SingleChildScrollView(
          padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 24.0, bottom: 100.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.water_drop_outlined, size: 48, color: context.primary),
              const SizedBox(height: 16),
              Text(
                'Dividend Purification',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark),
              ),
              const SizedBox(height: 12),
              Text(
                'Purification is the process of donating a portion of your dividends to charity to cleanse your income from non-permissible sources (like interest).',
                style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.divider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TOTAL PURIFICATION DUE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted)),
                    const SizedBox(height: 8),
                    isLoading 
                      ? const SizedBox(height: 38, child: Align(alignment: Alignment.centerLeft, child: CircularProgressIndicator()))
                      : Text('₦${totalPurificationDue.toStringAsFixed(2)}', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: context.textDark)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: totalPurificationDue > 0 ? () {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Purification donation gateway coming soon')));
                      } : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.textDark,
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
      },
    );
  }
}
