import 'package:flutter/material.dart';
import '../../../core/api/api_service.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class TradeBottomSheet extends StatefulWidget {
  final Map<String, dynamic> stock;

  const TradeBottomSheet({super.key, required this.stock});

  static void show(BuildContext context, Map<String, dynamic> stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TradeBottomSheet(stock: stock),
    );
  }

  @override
  State<TradeBottomSheet> createState() => _TradeBottomSheetState();
}

class _TradeBottomSheetState extends State<TradeBottomSheet> {
  final _sharesController = TextEditingController();
  final _apiService = ApiService();
  bool _isLoading = false;
  double _totalCost = 0.0;
  double _currentPrice = 0.0;

  @override
  void initState() {
    super.initState();
    _currentPrice = (widget.stock['daily_prices'] != null && widget.stock['daily_prices'].isNotEmpty)
        ? double.tryParse(widget.stock['daily_prices'][0]['price'].toString()) ?? 0.0
        : 0.0;

    _sharesController.addListener(_calculateTotal);
  }

  void _calculateTotal() {
    final shares = double.tryParse(_sharesController.text) ?? 0;
    setState(() {
      _totalCost = shares * _currentPrice;
    });
  }

  Future<void> _executeTrade() async {
    final shares = double.tryParse(_sharesController.text) ?? 0;
    if (shares <= 0) return;

    setState(() => _isLoading = true);

    try {
      await _apiService.post('portfolio/trade', {
        'symbol': widget.stock['symbol'],
        'shares': shares,
      });

      if (mounted) {
        Navigator.pop(context); // close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully purchased $shares shares of ${widget.stock['symbol']}!'),
            backgroundColor: AppTheme.halal,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Trade failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Buy ${widget.stock['symbol']}',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Current Price: ₦ ${_currentPrice.toStringAsFixed(2)}',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 16),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _sharesController,
                keyboardType: TextInputType.number,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Number of Shares',
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Estimated Cost', style: TextStyle(fontSize: 16, color: AppTheme.textMuted)),
                  Text(
                    '₦ ${_totalCost.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textDark),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading || _totalCost <= 0 ? null : _executeTrade,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.halal,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Confirm Trade', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
