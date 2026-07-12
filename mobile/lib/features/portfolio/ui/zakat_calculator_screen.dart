import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../stocks/providers/stock_provider.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class ZakatCalculatorScreen extends StatefulWidget {
  final bool isTab;
  const ZakatCalculatorScreen({super.key, this.isTab = false});

  @override
  State<ZakatCalculatorScreen> createState() => _ZakatCalculatorScreenState();
}

class _ZakatCalculatorScreenState extends State<ZakatCalculatorScreen> {
  final _sharesController = TextEditingController();
  final _priceController = TextEditingController();
  
  Map<String, dynamic>? _selectedStock;
  double _zakatOwed = 0.0;
@override
  void initState() {
    super.initState();
    _sharesController.addListener(_calculateZakat);
    _priceController.addListener(_calculateZakat);
  }

  void _calculateZakat() {
    if (_selectedStock == null) return;
    
    final shares = double.tryParse(_sharesController.text) ?? 0;
    final price = double.tryParse(_priceController.text) ?? 0;
    
    // Default purification factor is usually 1.25% or up to 30% depending on the fatwa
    // The engine returns interest_income_ratio
    final interestRatio = num.tryParse(_selectedStock!['financials']?.first?['interest_income_ratio']?.toString() ?? '0') ?? 0;
    
    // Zakat on stocks usually requires purifying the haram portion (interest)
    // Zakat = (Total Value * 2.5%) + (Total Value * Interest Ratio / 100)
    // Simplest calculation: purification + standard 2.5% zakat
    
    final totalValue = shares * price;
    final purificationAmount = totalValue * (interestRatio / 100.0);
    final zakatableValue = totalValue - purificationAmount;
    final standardZakat = zakatableValue * 0.025; // 2.5%
    
    setState(() {
      _zakatOwed = standardZakat + purificationAmount;
    });
  }

  @override
  Widget build(BuildContext context) {
    final stockProvider = context.watch<StockProvider>();
    final stocks = stockProvider.ngxStocks;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: widget.isTab ? null : AppBar(
        title: const Text('Zakat Calculator', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Calculate Your Obligations',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textDark),
            ),
            const SizedBox(height: 8),
            const Text(
              'Select a stock to automatically apply its specific purification factor based on our latest algorithmic screening.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 32),
            
            // Stock Selection
            const Text('SELECT STOCK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2)),
            const SizedBox(height: 8),
            DropdownButtonFormField<Map<String, dynamic>>(
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
              ),
              hint: const Text('Choose a company...'),
              value: _selectedStock,
              items: stocks.map((stock) {
                return DropdownMenuItem(
                  value: stock,
                  child: Text('${stock['symbol']} - ${stock['name']}'),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  _selectedStock = val;
                  // Auto-fill price
                  final dailyPrices = val?['daily_prices'] as List<dynamic>? ?? [];
                  if (dailyPrices.isNotEmpty) {
                    _priceController.text = dailyPrices[0]['price'].toString();
                  }
                  _calculateZakat();
                });
              },
            ),
            
            const SizedBox(height: 24),
            
            // Shares Input
            const Text('NUMBER OF SHARES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2)),
            const SizedBox(height: 8),
            TextField(
              controller: _sharesController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'e.g. 1000',
                prefixIcon: const Icon(Icons.pie_chart_outline_rounded, color: AppTheme.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Price Input
            const Text('CURRENT PRICE (₦)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2)),
            const SizedBox(height: 8),
            TextField(
              controller: _priceController,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: '0.00',
                prefixIcon: const Icon(Icons.payments_outlined, color: AppTheme.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.divider)),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Result Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: AppTheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Column(
                children: [
                  const Text('Total Zakat Owed', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(
                    '₦ ${_zakatOwed.toStringAsFixed(2)}',
                    style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _selectedStock != null 
                        ? 'Includes standard 2.5% + purification for ${_selectedStock!['symbol']}'
                        : 'Select a stock to see breakdown',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
