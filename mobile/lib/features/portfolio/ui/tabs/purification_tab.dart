import 'package:flutter/material.dart';
import '../../../../core/api/api_service.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class PurificationTab extends StatefulWidget {
  const PurificationTab({super.key});

  @override
  State<PurificationTab> createState() => _PurificationTabState();
}

class _PurificationTabState extends State<PurificationTab> {
  bool _isLoading = true;
  double _totalPurificationDue = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchPortfolio();
  }

  Future<void> _fetchPortfolio() async {
    try {
      final response = await ApiService().get('portfolio');
      if (response.data['status'] == 'success') {
        if (mounted) {
          setState(() {
            _isLoading = false;
            final holdings = response.data['data']['holdings'] ?? [];
            double total = 0.0;
            for (var holding in holdings) {
              total += (holding['purification_due'] ?? 0).toDouble();
            }
            _totalPurificationDue = total;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                _isLoading 
                  ? const SizedBox(height: 38, child: Align(alignment: Alignment.centerLeft, child: CircularProgressIndicator()))
                  : Text('₦${_totalPurificationDue.toStringAsFixed(2)}', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: context.textDark)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _totalPurificationDue > 0 ? () {
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
  }
}
