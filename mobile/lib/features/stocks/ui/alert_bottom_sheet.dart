import 'package:flutter/material.dart';
import '../../../core/api/api_service.dart';

class AlertBottomSheet extends StatefulWidget {
  final Map<String, dynamic> stock;

  const AlertBottomSheet({super.key, required this.stock});

  static void show(BuildContext context, Map<String, dynamic> stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AlertBottomSheet(stock: stock),
    );
  }

  @override
  State<AlertBottomSheet> createState() => _AlertBottomSheetState();
}

class _AlertBottomSheetState extends State<AlertBottomSheet> {
  final _priceController = TextEditingController();
  final _apiService = ApiService();
  bool _isLoading = false;
  double _currentPrice = 0.0;
  String _condition = 'above';

  @override
  void initState() {
    super.initState();
    _currentPrice = (widget.stock['daily_prices'] != null && widget.stock['daily_prices'].isNotEmpty)
        ? double.tryParse(widget.stock['daily_prices'][0]['price'].toString()) ?? 0.0
        : 0.0;

    _priceController.addListener(_calculateCondition);
  }

  void _calculateCondition() {
    final target = double.tryParse(_priceController.text) ?? 0;
    if (target > 0) {
      setState(() {
        _condition = target > _currentPrice ? 'above' : 'below';
      });
    }
  }

  Future<void> _setAlert() async {
    final target = double.tryParse(_priceController.text) ?? 0;
    if (target <= 0) return;

    setState(() => _isLoading = true);

    try {
      final symbol = widget.stock['symbol'];
      await _apiService.post('stocks/$symbol/alerts', {
        'target_price': target,
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Alert set! We will notify you when $symbol goes $_condition ₦$target.'),
            backgroundColor: const Color(0xFF2E7D32),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to set alert: $e'), backgroundColor: Colors.red),
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
                  Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: Color(0xFF1A1208)),
                      const SizedBox(width: 8),
                      Text(
                        'Set Alert for ${widget.stock['symbol']}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1A1208), letterSpacing: -0.5),
                      ),
                    ],
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
                style: const TextStyle(color: Color(0xFF9A8C70), fontSize: 16),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _priceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Target Price (₦)',
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  prefixIcon: const Icon(Icons.attach_money_rounded),
                ),
              ),
              const SizedBox(height: 24),
              if (_priceController.text.isNotEmpty && (double.tryParse(_priceController.text) ?? 0) > 0)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'We will notify you when the price goes $_condition ₦${_priceController.text}',
                    style: const TextStyle(color: Color(0xFF1D4ED8), fontWeight: FontWeight.w600),
                  ),
                ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading || (double.tryParse(_priceController.text) ?? 0) <= 0 ? null : _setAlert,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Set Alert', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
