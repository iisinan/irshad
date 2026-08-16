import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:provider/provider.dart';

class ZakatStatementScreen extends StatelessWidget {
  final double totalWealth;
  final double financialNisab;
  final bool financialEligible;
  final double financialZakatDue;
  final String nisabStandard;
  final double portfolioValue;
  final double cashNum;
  final double goldNum;
  final double goldGrams;
  final double goldPrice;
  final double silverNum;
  final double silverGrams;
  final double silverPrice;
  final int sheepNum;
  final String sheepZakat;
  final int cowNum;
  final String cowZakat;
  final double harvestNum;
  final double agriZakatDue;
  final bool agriEligible;
  final String irrigation;
  final String? hawlDate;
  final DateTime? hawlDueDate;
  final int? daysUntilDue;

  const ZakatStatementScreen({
    super.key,
    required this.totalWealth,
    required this.financialNisab,
    required this.financialEligible,
    required this.financialZakatDue,
    required this.nisabStandard,
    required this.portfolioValue,
    required this.cashNum,
    required this.goldNum,
    required this.goldGrams,
    required this.goldPrice,
    required this.silverNum,
    required this.silverGrams,
    required this.silverPrice,
    required this.sheepNum,
    required this.sheepZakat,
    required this.cowNum,
    required this.cowZakat,
    required this.harvestNum,
    required this.agriZakatDue,
    required this.agriEligible,
    required this.irrigation,
    this.hawlDate,
    this.hawlDueDate,
    this.daysUntilDue,
  });

  String _fmt(num? n, [int decimals = 2]) {
    if (n == null) return '₦0.00';
    final formatter = NumberFormat.currency(symbol: '₦', decimalDigits: decimals);
    return formatter.format(n);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Zakat Statement', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: -0.5)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Watermark
          Center(
            child: Opacity(
              opacity: 0.03,
              child: Image.asset('assets/images/logo.png', width: 300, color: Colors.black),
            ),
          ),
          
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Image.asset('assets/images/logo.png', height: 40),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Irshad', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: -0.5, height: 1.0)),
                            const SizedBox(height: 2),
                            Text('SHARIAH-COMPLIANT PORTFOLIO', style: TextStyle(fontSize: 9, color: Colors.grey.shade600, fontWeight: FontWeight.w600, letterSpacing: 1.0)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                const Divider(color: Color(0xFF2A1A2E), thickness: 3),
                const SizedBox(height: 24),
                
                // Details
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('PREPARED FOR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey, letterSpacing: 1.0)),
                        const SizedBox(height: 4),
                        const Text('Valued Client', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('STATEMENT ID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey, letterSpacing: 1.0)),
                        const SizedBox(height: 4),
                        Text('ZKT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.black, fontFamily: 'monospace')),
                        const SizedBox(height: 12),
                        const Text('GENERATED ON', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey, letterSpacing: 1.0)),
                        const SizedBox(height: 4),
                        Text(DateFormat('dd MMMM yyyy').format(DateTime.now()), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black)),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                Container(height: 4, decoration: BoxDecoration(gradient: LinearGradient(colors: [const Color(0xFF2A1A2E), const Color(0xFFD1A562), const Color(0xFFD1A562)]), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                
                // Nisab Configuration
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.grey.shade50, border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('NISAB THRESHOLDS APPLIED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey, letterSpacing: 1.0)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 24,
                        runSpacing: 12,
                        children: [
                          _buildNisabItem('Standard:', nisabStandard == 'gold' ? 'Gold (85g)' : 'Silver (595g)'),
                          _buildNisabItem('Financial Nisab:', _fmt(financialNisab, 0), color: const Color(0xFFD1A562)),
                          _buildNisabItem('Livestock (Sheep):', '40 head'),
                          _buildNisabItem('Livestock (Cows):', '30 head'),
                          _buildNisabItem('Agriculture:', '653 kg (5 Awsuq)'),
                        ],
                      )
                    ],
                  ),
                ),
                
                const SizedBox(height: 28),
                
                // Financial Wealth
                _buildSectionTitle('Financial Wealth', const Color(0xFFD1A562)),
                const SizedBox(height: 12),
                _buildTable(
                  headers: ['ASSET', 'VALUE (₦)', 'STATUS'],
                  rows: [
                    ['📈 Stock Portfolio', _fmt(portfolioValue), 'Auto-synced'],
                    ['💵 Cash & Savings', _fmt(cashNum), '—'],
                    ['🥇 Gold Held (${goldGrams}g @ ${_fmt(goldPrice, 0)}/g)', _fmt(goldNum), '—'],
                    ['🥈 Silver Held (${silverGrams}g @ ${_fmt(silverPrice, 0)}/g)', _fmt(silverNum), '—'],
                  ],
                  totalRow: ['Total Wealth', _fmt(totalWealth), financialEligible ? 'Nisab Reached ✓' : 'Below Nisab'],
                  totalEligible: financialEligible,
                ),
                if (financialEligible)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text('Zakat due @ 2.5%: ', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        Text(_fmt(financialZakatDue, 0), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFFD1A562))),
                      ],
                    ),
                  ),
                  
                if (sheepNum > 0 || cowNum > 0) ...[
                  const SizedBox(height: 28),
                  _buildSectionTitle('Livestock Zakat', Colors.green),
                  const SizedBox(height: 12),
                  _buildTable(
                    headers: ['ANIMAL', 'COUNT', 'NISAB', 'ZAKAT DUE'],
                    rows: [
                      if (sheepNum > 0) ['🐑 Sheep & Goats', '$sheepNum', '40 head', sheepZakat],
                      if (cowNum > 0) ['🐄 Cows & Buffaloes', '$cowNum', '30 head', cowZakat],
                    ],
                  ),
                ],
                
                if (harvestNum > 0) ...[
                  const SizedBox(height: 28),
                  _buildSectionTitle('Agriculture Zakat', Colors.orange.shade700),
                  const SizedBox(height: 12),
                  _buildTable(
                    headers: ['CROP', 'HARVEST', 'IRRIGATION', 'RATE', 'ZAKAT DUE'],
                    rows: [
                      ['🌾 Grains & Fruits', '$harvestNum kg', irrigation == 'natural' ? 'Natural / Rain' : 'Artificial', irrigation == 'natural' ? '10%' : '5%', agriEligible ? '${agriZakatDue.toStringAsFixed(1)} kg' : 'Below Nisab'],
                    ],
                  ),
                ],
                
                const SizedBox(height: 36),
                
                // Consolidated Summary
                Container(
                  decoration: BoxDecoration(border: Border.all(color: const Color(0xFF2A1A2E), width: 2), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                        width: double.infinity,
                        color: const Color(0xFF2A1A2E),
                        child: const Text('SUMMARY OF ZAKAT PAYABLE', style: TextStyle(color: Color(0xFFD1A562), fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
                      ),
                      Container(
                        padding: const EdgeInsets.all(20),
                        color: Colors.grey.shade50,
                        child: Column(
                          children: [
                            _buildSummaryRow('Financial Wealth Zakat', financialEligible ? _fmt(financialZakatDue, 0) : '—', financialEligible ? const Color(0xFFD1A562) : Colors.grey),
                            if (sheepNum > 0 || cowNum > 0) ...[
                              const SizedBox(height: 12),
                              if (sheepNum >= 40) _buildSummaryRow('Sheep Zakat', sheepZakat, Colors.green),
                              if (cowNum >= 30) _buildSummaryRow('Cow Zakat', cowZakat, Colors.green),
                              if (sheepNum < 40 && cowNum < 30) _buildSummaryRow('Livestock Zakat', '—', Colors.grey),
                            ],
                            if (harvestNum > 0) ...[
                              const SizedBox(height: 12),
                              _buildSummaryRow('Agriculture Zakat', agriEligible ? '${agriZakatDue.toStringAsFixed(1)} kg' : '—', agriEligible ? Colors.orange.shade700 : Colors.grey),
                            ],
                            
                            if (!financialEligible && sheepNum < 40 && cowNum < 30 && harvestNum < 653) ...[
                              const SizedBox(height: 16),
                              const Divider(),
                              const SizedBox(height: 12),
                              const Text('No Zakat is currently due across your registered asset classes.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
                            ]
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Hawl Date Banner
                if (hawlDate != null) ...[
                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.orange.shade50, border: Border.all(color: Colors.orange.shade300), borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildHawlItem('HAWL STARTED', DateFormat('dd MMM yyyy').format(DateTime.parse(hawlDate!)), Colors.orange.shade900),
                        if (hawlDueDate != null) _buildHawlItem('NEXT DUE DATE', DateFormat('dd MMM yyyy').format(hawlDueDate!), Colors.orange.shade900),
                        if (daysUntilDue != null) _buildHawlItem('DAYS REMAINING', daysUntilDue! > 0 ? '$daysUntilDue days' : 'Due Now!', daysUntilDue! <= 30 ? Colors.red : Colors.green, highlight: true),
                      ],
                    ),
                  )
                ],
                
                const SizedBox(height: 32),
                
                // Disclaimer
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.grey.shade50, border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(8)),
                  child: Text.rich(
                    TextSpan(
                      children: [
                        const TextSpan(text: 'Disclaimer: ', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.black)),
                        TextSpan(text: 'This Zakat statement is generated based on data entered by the user and live market prices at the time of generation. It is provided as a tool to assist in Zakat calculation and is not a substitute for professional Islamic financial advice. Nisab values are calculated using ${nisabStandard == 'gold' ? 'Gold (85g)' : 'Silver (595g)'} standard.', style: TextStyle(color: Colors.grey.shade700, height: 1.5)),
                      ]
                    ),
                    style: const TextStyle(fontSize: 10),
                  ),
                ),
                
                const SizedBox(height: 40),
                const Divider(),
                const SizedBox(height: 20),
                
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Image.asset('assets/images/logo.png', height: 16, color: Colors.grey.shade400),
                        const SizedBox(width: 8),
                        Text('iirshad.com', style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    Text('Powered by Irshad', style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNisabItem(String label, String value, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
        const SizedBox(width: 4),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color ?? Colors.black)),
      ],
    );
  }

  Widget _buildSectionTitle(String title, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 16, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.black, letterSpacing: 0.8)),
      ],
    );
  }

  Widget _buildTable({required List<String> headers, required List<List<String>> rows, List<String>? totalRow, bool totalEligible = false}) {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: [
          Container(
            color: Colors.grey.shade50,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: headers.asMap().entries.map((e) {
                return Expanded(
                  flex: e.key == 0 ? 2 : 1,
                  child: Text(
                    e.value,
                    textAlign: e.key == 0 ? TextAlign.left : (e.key == headers.length - 1 ? TextAlign.right : TextAlign.center),
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade600, letterSpacing: 0.5),
                  ),
                );
              }).toList(),
            ),
          ),
          ...rows.map((row) => Container(
            decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade100))),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: row.asMap().entries.map((e) {
                return Expanded(
                  flex: e.key == 0 ? 2 : 1,
                  child: Text(
                    e.value,
                    textAlign: e.key == 0 ? TextAlign.left : (e.key == row.length - 1 ? TextAlign.right : TextAlign.center),
                    style: TextStyle(fontSize: 11, color: e.key == 0 ? Colors.black87 : (e.key == row.length - 1 ? Colors.black : Colors.grey.shade700), fontWeight: e.key == row.length - 1 ? FontWeight.w700 : FontWeight.w500),
                  ),
                );
              }).toList(),
            ),
          )),
          if (totalRow != null)
            Container(
              decoration: BoxDecoration(color: totalEligible ? const Color(0xFFFEFCE8) : Colors.grey.shade50, border: Border(top: BorderSide(color: Colors.grey.shade200))),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                children: totalRow.asMap().entries.map((e) {
                  return Expanded(
                    flex: e.key == 0 ? 2 : 1,
                    child: e.key == totalRow.length - 1 
                        ? Container(
                            alignment: Alignment.centerRight,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: totalEligible ? const Color(0xFFD1A562) : Colors.red.shade100, borderRadius: BorderRadius.circular(4)),
                              child: Text(e.value, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: totalEligible ? Colors.white : Colors.red.shade700)),
                            ),
                          )
                        : Text(
                            e.value,
                            textAlign: e.key == 0 ? TextAlign.left : TextAlign.right,
                            style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w800),
                          ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade800)),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: valueColor)),
      ],
    );
  }

  Widget _buildHawlItem(String label, String value, Color color, {bool highlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: highlight ? color : Colors.orange.shade800, letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: highlight ? color : Colors.black)),
      ],
    );
  }
}
