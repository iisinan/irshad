import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../providers/portfolio_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:irshad_mobile/features/portfolio/ui/zakat_statement_screen.dart';
import 'dart:ui' as ui;

String getCowZakat(int n) {
  if (n < 30) return 'None (Below Nisab)';
  int bestX = 0, bestY = 0, minRem = n;
  for (int x = n ~/ 30; x >= 0; x--) {
    int rem = n - (x * 30);
    int y = rem ~/ 40;
    int finalRem = rem - (y * 40);
    if (finalRem < minRem) {
      minRem = finalRem;
      bestX = x;
      bestY = y;
    }
  }
  List<String> res = [];
  if (bestX > 0) res.add('$bestX Yearling(s)');
  if (bestY > 0) res.add('$bestY Two-year-old(s)');
  return res.join(' & ');
}

String getSheepZakat(int n) {
  if (n < 40) return 'None (Below Nisab)';
  if (n <= 120) return '1 Sheep/Goat';
  if (n <= 200) return '2 Sheep/Goats';
  if (n <= 399) return '3 Sheep/Goats';
  return '${n ~/ 100} Sheep/Goats';
}

String fmt(num? n, [int decimals = 2]) {
  if (n == null) return '₦0.00';
  final formatter = NumberFormat.currency(symbol: '₦', decimalDigits: decimals);
  return formatter.format(n);
}

class ZakatCalculatorScreen extends StatefulWidget {
  final bool isTab;
  const ZakatCalculatorScreen({super.key, this.isTab = false});

  @override
  State<ZakatCalculatorScreen> createState() => _ZakatCalculatorScreenState();
}

class _ZakatCalculatorScreenState extends State<ZakatCalculatorScreen> {
  final _dio = Dio();
  
  // Hawl State
  static const String ZAKAT_DATE_KEY = 'irshad_zakat_hawl_date';
  String? _hawlDate;
  bool _editingHawl = false;
  DateTime? _hawlInput;

  // Nisab State
  double _exchangeRate = 1600.0;
  double _goldPrice = 150000.0;
  double _silverPrice = 2500.0;
  String _nisabStandard = 'gold';
  bool _showNisabSettings = false;
  bool _isFetchingNisab = false;
  String _fetchError = '';
  bool _overrideActive = false;

  // Financial State
  final _cashController = TextEditingController();
  final _goldGramsController = TextEditingController();
  final _silverGramsController = TextEditingController();

  // Livestock State
  final _sheepController = TextEditingController();
  final _cowController = TextEditingController();

  // Agriculture State
  final _harvestController = TextEditingController();
  String _irrigation = 'natural';

  bool _showAdvancedAssets = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPortfolioData();
      _loadInitialData();
    });

    _cashController.addListener(_updateState);
    _goldGramsController.addListener(_updateState);
    _silverGramsController.addListener(_updateState);
    _sheepController.addListener(_updateState);
    _cowController.addListener(_updateState);
    _harvestController.addListener(_updateState);
  }

  void _updateState() {
    setState(() {}); // Trigger rebuild on text changes for live calculations
  }

  void _loadPortfolioData() {
    final portfolioProvider = context.read<PortfolioProvider>();
    if (!portfolioProvider.isLoading && portfolioProvider.holdings.isEmpty) {
      portfolioProvider.fetchPortfolio();
    }
  }

  Future<void> _loadInitialData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _hawlDate = prefs.getString(ZAKAT_DATE_KEY);
      if (_hawlDate != null) {
        _hawlInput = DateTime.tryParse(_hawlDate!);
      }
    });

    await _fetchLiveNisab();
  }

  Future<void> _fetchLiveNisab() async {
    setState(() {
      _isFetchingNisab = true;
      _fetchError = '';
    });

    try {
      final res = await ApiService().get('/zakat/prices');
      if (res.data != null && res.data['data'] != null) {
        final data = res.data['data'];
        
        if (data['exchange_rate'] != null) {
          _exchangeRate = num.tryParse(data['exchange_rate'].toString())?.toDouble() ?? 1600.0;
        }
        
        if (data['gold_price'] != null && data['gold_price'] > 0) {
          _goldPrice = num.tryParse(data['gold_price'].toString())?.roundToDouble() ?? _goldPrice;
        } else if (_overrideActive == false) {
          throw Exception('Live API failed to return a valid price');
        }
        if (data['silver_price'] != null && data['silver_price'] > 0) {
          _silverPrice = num.tryParse(data['silver_price'].toString())?.roundToDouble() ?? _silverPrice;
        }
        
        _overrideActive = data['override_active'] == true;
      }
    } catch (e) {
      _fetchError = 'Could not fetch live price. Please enter manually.';
    } finally {
      if (mounted) setState(() => _isFetchingNisab = false);
    }
  }

  Future<void> _saveHawlDate() async {
    if (_hawlInput != null) {
      final dateStr = _hawlInput!.toIso8601String();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ZAKAT_DATE_KEY, dateStr);
      setState(() {
        _hawlDate = dateStr;
        _editingHawl = false;
      });
      try {
        await ApiService().put('/profile', {
          'preferences': {'zakat_hawl_date': dateStr}
        });
      } catch (_) {}
    }
  }

  Future<void> _clearHawlDate() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ZAKAT_DATE_KEY);
    setState(() {
      _hawlDate = null;
      _hawlInput = null;
      _editingHawl = false;
    });
    try {
      await ApiService().put('/profile', {
        'preferences': {'zakat_hawl_date': null}
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    // ─── Math ───
    final portfolioProvider = context.watch<PortfolioProvider>();
    final double portfolioValue = (portfolioProvider.summary['total_balance'] as num?)?.toDouble() ?? 0.0;

    final activeNisabThreshold = _nisabStandard == 'gold' ? 85.0 : 595.0;
    final activePricePerGram = _nisabStandard == 'gold' ? (_goldPrice > 0 ? _goldPrice : 150000.0) : (_silverPrice > 0 ? _silverPrice : 2500.0);
    final financialNisab = activePricePerGram * activeNisabThreshold;

    final cashNum = double.tryParse(_cashController.text) ?? 0.0;
    final goldNum = (double.tryParse(_goldGramsController.text) ?? 0.0) * _goldPrice;
    final silverNum = (double.tryParse(_silverGramsController.text) ?? 0.0) * _silverPrice;

    final grossWealth = portfolioValue + cashNum + goldNum + silverNum;
    final totalWealth = grossWealth > 0 ? grossWealth : 0.0;
    final financialEligible = totalWealth >= financialNisab;
    final financialZakatDue = financialEligible ? totalWealth * 0.025 : 0.0;

    final sheepNum = int.tryParse(_sheepController.text) ?? 0;
    final cowNum = int.tryParse(_cowController.text) ?? 0;
    final sheepZakat = getSheepZakat(sheepNum);
    final cowZakat = getCowZakat(cowNum);

    final harvestNum = double.tryParse(_harvestController.text) ?? 0.0;
    final agriNisab = 653.0;
    final agriEligible = harvestNum >= agriNisab;
    final agriRate = _irrigation == 'natural' ? 0.1 : 0.05;
    final agriZakatDue = agriEligible ? harvestNum * agriRate : 0.0;

    DateTime? hawlDueDate;
    int? daysUntilDue;
    if (_hawlDate != null) {
      DateTime d = DateTime.parse(_hawlDate!);
      DateTime today = DateTime.now();
      today = DateTime(today.year, today.month, today.day);
      d = DateTime(d.year, d.month, d.day);
      while (d.isBefore(today)) {
        d = d.add(const Duration(days: 354));
      }
      hawlDueDate = d;
      daysUntilDue = hawlDueDate.difference(today).inDays;
    }

    return Scaffold(
      backgroundColor: context.bg,
      appBar: widget.isTab ? null : AppBar(
        title: Text('Zakat', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 24, right: 24, top: 24, bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Hero Banner ───
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [context.bg, context.primary.withOpacity(0.08)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.divider),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.divider),
                      boxShadow: [BoxShadow(color: context.primary.withOpacity(0.12), blurRadius: 24, offset: const Offset(0, 8))],
                    ),
                    child: Center(
                      child: Icon(Icons.balance, size: 26, color: context.primary),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: context.divider),
                          ),
                          child: Text('WEALTH PURIFICATION', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1.0)),
                        ),
                        const SizedBox(height: 8),
                        Text('Comprehensive Zakat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                        const SizedBox(height: 4),
                        Text('A smart calculator covering all your asset classes.', style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ─── Hawl Banner ───
            if (_hawlDate != null && !_editingHawl)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFD1A562).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFD1A562).withOpacity(0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1A562).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFD1A562).withOpacity(0.3)),
                          ),
                          child: const Icon(Icons.notifications_active, color: Color(0xFFD1A562), size: 20),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('YOUR ZAKAT (HAWL) DATE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFD1A562), letterSpacing: 0.6)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 16,
                                runSpacing: 8,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text.rich(TextSpan(children: [
                                    TextSpan(text: 'Started: ', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
                                    TextSpan(text: DateFormat('d MMM yyyy').format(DateTime.parse(_hawlDate!)), style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
                                  ])),
                                  if (hawlDueDate != null)
                                    Text.rich(TextSpan(children: [
                                      TextSpan(text: 'Due: ', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
                                      TextSpan(text: DateFormat('d MMM yyyy').format(hawlDueDate), style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
                                    ])),
                                  if (daysUntilDue != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: daysUntilDue <= 30 ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(100),
                                      ),
                                      child: Text(daysUntilDue > 0 ? '$daysUntilDue days remaining' : 'Due Now!', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: daysUntilDue <= 30 ? Colors.red : Colors.green)),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _hawlInput = DateTime.parse(_hawlDate!);
                              _editingHawl = true;
                            });
                          },
                          icon: const Icon(Icons.edit, size: 16),
                          style: IconButton.styleFrom(backgroundColor: context.bg, foregroundColor: context.textMuted),
                        )
                      ],
                    ),
                    if (daysUntilDue != null) ...[
                      const SizedBox(height: 20),
                      Container(
                        height: 8,
                        decoration: BoxDecoration(color: const Color(0xFFD1A562).withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: (354 - (daysUntilDue < 0 ? 0 : daysUntilDue)) / 354.0,
                          child: Container(decoration: BoxDecoration(color: daysUntilDue <= 30 ? Colors.red : const Color(0xFFD1A562), borderRadius: BorderRadius.circular(10))),
                        ),
                      )
                    ]
                  ],
                ),
              )
            else
              CustomPaint(
                painter: DashedBorderPainter(
                  color: const Color(0xFFD1A562).withOpacity(0.5),
                  strokeWidth: 2.0,
                  dashWidth: 6.0,
                  dashSpace: 4.0,
                  borderRadius: 20.0,
                ),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.bg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, color: Color(0xFFD1A562), size: 18),
                          const SizedBox(width: 12),
                          Text('Set your Hawl (Zakat start) date', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
                        ],
                      ),
                      if (_editingHawl) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () async {
                                  final d = await showDatePicker(context: context, initialDate: _hawlInput ?? DateTime.now(), firstDate: DateTime(2000), lastDate: DateTime.now());
                                  if (d != null) setState(() => _hawlInput = d);
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(10), border: Border.all(color: context.divider)),
                                  child: Text(_hawlInput != null ? DateFormat('d MMMM yyyy').format(_hawlInput!) : 'Select Date', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: ElevatedButton(onPressed: _hawlInput != null ? _saveHawlDate : null, style: ElevatedButton.styleFrom(backgroundColor: context.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w800)))),
                            if (_hawlDate != null) ...[
                              const SizedBox(width: 8),
                              TextButton(onPressed: () => setState(() => _editingHawl = false), style: TextButton.styleFrom(foregroundColor: context.textMuted), child: const Text('Cancel')),
                              const SizedBox(width: 8),
                              TextButton(onPressed: _clearHawlDate, style: TextButton.styleFrom(foregroundColor: Colors.red), child: const Text('Clear')),
                            ]
                          ],
                        )
                      ] else
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _editingHawl = true;
                              });
                            },
                            icon: const Icon(Icons.calendar_today, size: 14, color: Color(0xFFD1A562)),
                            label: const Text('Set Date', style: TextStyle(color: Color(0xFFD1A562), fontWeight: FontWeight.w800)),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: const Color(0xFFD1A562).withOpacity(0.3)),
                              backgroundColor: const Color(0xFFD1A562).withOpacity(0.05),
                            ),
                          ),
                        )
                    ],
                  ),
                ),
              ),
            
            const SizedBox(height: 32),
            const SizedBox(height: 32),

            // ─── Smart Nisab ───
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(24), border: Border.all(color: context.divider), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 10)]),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text('Smart Nisab Configurations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark))),
                                const SizedBox(width: 8),
                                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: context.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(6)), child: Text('LIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.primary))),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('Manage your minimum thresholds', style: TextStyle(fontSize: 12, color: context.textMuted, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _showNisabSettings = !_showNisabSettings),
                        icon: Icon(_showNisabSettings ? Icons.keyboard_arrow_up : Icons.tune),
                        style: IconButton.styleFrom(backgroundColor: context.bgAlt, foregroundColor: context.textDark),
                      )
                    ],
                  ),
                  if (_showNisabSettings) ...[
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _nisabStandard = 'gold'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _nisabStandard == 'gold' ? context.bg : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                border: _nisabStandard == 'gold' ? Border.all(color: const Color(0xFFD1A562)) : Border.all(color: Colors.transparent),
                              ),
                              child: Center(child: Text('Gold (85g)', style: TextStyle(fontWeight: _nisabStandard == 'gold' ? FontWeight.w800 : FontWeight.w600, color: _nisabStandard == 'gold' ? const Color(0xFFD1A562) : context.textMuted))),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _nisabStandard = 'silver'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _nisabStandard == 'silver' ? context.bg : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                border: _nisabStandard == 'silver' ? Border.all(color: Colors.grey.shade400) : Border.all(color: Colors.transparent),
                              ),
                              child: Center(child: Text('Silver (595g)', style: TextStyle(fontWeight: _nisabStandard == 'silver' ? FontWeight.w800 : FontWeight.w600, color: _nisabStandard == 'silver' ? Colors.grey.shade700 : context.textMuted))),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Active Threshold:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted)),
                              _isFetchingNisab 
                                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                                : Text(fmt(financialNisab, 0), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: context.primary)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('1g Price:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted)),
                              Text(fmt(activePricePerGram, 0), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textDark)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (_fetchError.isNotEmpty)
                      Padding(padding: const EdgeInsets.only(top: 8), child: Text(_fetchError, style: const TextStyle(color: Colors.red, fontSize: 11))),
                  ]
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ─── Nisab Progress Summary ───
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [context.bgAlt, const Color(0xFF22C58C).withOpacity(0.03)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.divider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('NISAB PROGRESS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1.0)),
                          const SizedBox(height: 4),
                          Text('Each category is assessed independently', style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w500)),
                        ],
                      ),
                      if (financialEligible)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(100)),
                          child: Row(
                            children: [
                              Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                              const SizedBox(width: 6),
                              const Text('Zakat Eligible', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Financial Wealth Bar
                  _buildProgressBar(
                    title: '💰 Financial Wealth',
                    subtitle: 'Nisab: ${fmt(financialNisab, 0)}',
                    percentage: (totalWealth / financialNisab * 100).clamp(0, 100).toInt(),
                    isEligible: financialEligible,
                    color: const Color(0xFFD1A562),
                    context: context,
                  ),

                  // Sheep Bar
                  if (sheepNum > 0) ...[
                    const SizedBox(height: 16),
                    _buildProgressBar(
                      title: '🐑 Sheep & Goats',
                      subtitle: '$sheepNum of 40 head',
                      percentage: (sheepNum / 40 * 100).clamp(0, 100).toInt(),
                      isEligible: sheepNum >= 40,
                      color: const Color(0xFFD1A562),
                      context: context,
                    ),
                  ],

                  // Cow Bar
                  if (cowNum > 0) ...[
                    const SizedBox(height: 16),
                    _buildProgressBar(
                      title: '🐄 Cows & Buffaloes',
                      subtitle: '$cowNum of 30 head',
                      percentage: (cowNum / 30 * 100).clamp(0, 100).toInt(),
                      isEligible: cowNum >= 30,
                      color: const Color(0xFFD1A562),
                      context: context,
                    ),
                  ],

                  // Agriculture Bar
                  if (harvestNum > 0) ...[
                    const SizedBox(height: 16),
                    _buildProgressBar(
                      title: '🌾 Agriculture',
                      subtitle: '$harvestNum of 653 kg',
                      percentage: (harvestNum / 653 * 100).clamp(0, 100).toInt(),
                      isEligible: agriEligible,
                      color: const Color(0xFFD1A562),
                      context: context,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ─── Financial Wealth ───
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.bg,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.divider),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.monetization_on, size: 20, color: Color(0xFFD1A562)),
                                const SizedBox(width: 8),
                                const Text('Financial Wealth', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.black)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('Your investable & liquid assets for Zakat calculation.', style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      if (totalWealth > 0)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('TOTAL WEALTH', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.5)),
                            Text(fmt(totalWealth, 0), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1.0)),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Stock Portfolio — Auto-synced
                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: context.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.primary.withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('📈 STOCK PORTFOLIO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.primary, letterSpacing: 0.5)),
                            const SizedBox(height: 6),
                            Text(fmt(portfolioValue), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.primary, letterSpacing: -0.5)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(100)),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, size: 12, color: Colors.green),
                              const SizedBox(width: 4),
                              const Text('Auto-synced', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.green)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Cash & Savings
                  _buildInputRow('💵 Cash & Savings', _cashController, '₦0.00'),
                  const SizedBox(height: 16),
                  
                  // Gold Held
                  _buildInputRow('🥇 Gold Held (grams)', _goldGramsController, '0g'),
                  if (goldNum > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 6, bottom: 10),
                      child: Text('≈ ${fmt(goldNum, 0)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD1A562))),
                    ),
                  const SizedBox(height: 10),
                  
                  // Silver Held
                  _buildInputRow('🥈 Silver Held (grams)', _silverGramsController, '0g'),
                  if (silverNum > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text('≈ ${fmt(silverNum, 0)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.textMuted)),
                    ),
                  
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: financialEligible ? const Color(0xFFD1A562) : Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                        child: Text(financialEligible ? 'Nisab Reached ✓' : 'Below Nisab', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: financialEligible ? Colors.white : Colors.red)),
                      ),
                      if (financialEligible)
                        Text.rich(TextSpan(children: [
                          TextSpan(text: 'Due: ', style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w600)),
                          TextSpan(text: fmt(financialZakatDue), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFFD1A562))),
                        ])),
                    ],
                  )
                ],
              ),
            ),
            
            const SizedBox(height: 32),

            Center(
              child: TextButton.icon(
                onPressed: () => setState(() => _showAdvancedAssets = !_showAdvancedAssets),
                icon: Icon(_showAdvancedAssets ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 16, color: context.textMuted),
                label: Text(
                  _showAdvancedAssets ? 'Hide Advanced Asset Classes' : 'Show Advanced Asset Classes (Livestock, Agriculture)',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.textMuted),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: context.divider, style: BorderStyle.solid),
                  ),
                ),
              ),
            ),

            if (_showAdvancedAssets) ...[
              const SizedBox(height: 32),

              // ─── Livestock Zakat ───
            Row(
              children: [
                Container(width: 4, height: 16, decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 8),
                const Text('LIVESTOCK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.green, letterSpacing: 0.8)),
              ],
            ),
            const SizedBox(height: 16),
            _buildInputRow('Sheep & Goats', _sheepController, '0 head', keyboardType: TextInputType.number),
            if (sheepNum > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 12),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [Text('Zakat Due: ', style: TextStyle(fontSize: 12, color: context.textMuted)), Text(sheepZakat, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: sheepNum >= 40 ? Colors.green : context.textMuted))]),
              ),
            const SizedBox(height: 12),
            _buildInputRow('Cows & Buffaloes', _cowController, '0 head', keyboardType: TextInputType.number),
            if (cowNum > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 12),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [Text('Zakat Due: ', style: TextStyle(fontSize: 12, color: context.textMuted)), Text(cowZakat, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: cowNum >= 30 ? Colors.green : context.textMuted))]),
              ),

            const SizedBox(height: 32),

            // ─── Agriculture Zakat ───
            Row(
              children: [
                Container(width: 4, height: 16, decoration: BoxDecoration(color: Colors.orange.shade700, borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 8),
                Text('AGRICULTURE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.orange.shade700, letterSpacing: 0.8)),
              ],
            ),
            const SizedBox(height: 16),
            _buildInputRow('Harvest Weight (kg)', _harvestController, '0 kg'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(12), border: Border.all(color: context.divider)),
              child: Row(
                children: [
                  Text('Irrigation', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
                  const Spacer(),
                  DropdownButton<String>(
                    value: _irrigation,
                    underline: const SizedBox(),
                    items: const [
                      DropdownMenuItem(value: 'natural', child: Text('Natural (10%)', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'artificial', child: Text('Artificial (5%)', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _irrigation = val);
                    },
                  )
                ],
              ),
            ),
            if (harvestNum > 0)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Nisab: 653 kg', style: TextStyle(fontSize: 12, color: context.textMuted)),
                    Row(children: [Text('Zakat Due: ', style: TextStyle(fontSize: 12, color: context.textMuted)), Text(agriEligible ? '${agriZakatDue.toStringAsFixed(1)} kg' : 'Below Nisab', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: agriEligible ? Colors.orange.shade700 : context.textMuted))]),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 40),

            // ─── Consolidated Summary ───
            Container(
              decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF2A1A2E), width: 2)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(color: Color(0xFF2A1A2E), borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
                    child: const Text('SUMMARY OF ZAKAT PAYABLE', style: TextStyle(color: Color(0xFFD1A562), fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Financial Wealth', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
                            Text(financialEligible ? fmt(financialZakatDue, 0) : '—', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: financialEligible ? const Color(0xFFD1A562) : context.textMuted)),
                          ],
                        ),
                        if (sheepNum > 0 || cowNum > 0) ...[
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Livestock', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (sheepNum >= 40) Text('Sheep: $sheepZakat', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.green)),
                                  if (cowNum >= 30) Text('Cows: $cowZakat', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.green)),
                                  if (sheepNum < 40 && cowNum < 30) Text('—', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textMuted)),
                                ],
                              )
                            ],
                          ),
                        ],
                        if (harvestNum > 0) ...[
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Agriculture', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
                              Text(agriEligible ? '${agriZakatDue.toStringAsFixed(1)} kg' : '—', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: agriEligible ? Colors.orange.shade700 : context.textMuted)),
                            ],
                          ),
                        ],
                        if (!financialEligible && (sheepNum < 40) && (cowNum < 30) && (harvestNum < 653)) ...[
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 12),
                          Text('No Zakat is currently due across your registered asset classes.', textAlign: TextAlign.center, style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => ZakatStatementScreen(
                                totalWealth: totalWealth,
                                financialNisab: financialNisab,
                                financialEligible: financialEligible,
                                financialZakatDue: financialZakatDue,
                                nisabStandard: _nisabStandard,
                                portfolioValue: portfolioValue,
                                cashNum: cashNum,
                                goldNum: goldNum,
                                goldGrams: double.tryParse(_goldGramsController.text) ?? 0.0,
                                goldPrice: _goldPrice,
                                silverNum: silverNum,
                                silverGrams: double.tryParse(_silverGramsController.text) ?? 0.0,
                                silverPrice: _silverPrice,
                                sheepNum: sheepNum,
                                sheepZakat: sheepZakat,
                                cowNum: cowNum,
                                cowZakat: cowZakat,
                                harvestNum: harvestNum,
                                agriZakatDue: agriZakatDue,
                                agriEligible: agriEligible,
                                irrigation: _irrigation,
                                hawlDate: _hawlDate,
                                hawlDueDate: hawlDueDate,
                                daysUntilDue: daysUntilDue,
                              )));
                            },
                            icon: const Icon(Icons.description, size: 18),
                            label: const Text('View Zakat Statement'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: context.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 0.2),
                              elevation: 4,
                              shadowColor: context.primary.withOpacity(0.5),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16.0),
        child: const Text('Financial data fetched in real-time from Irshad backend services', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildInputRow(String label, TextEditingController controller, String hint, {TextInputType keyboardType = const TextInputType.numberWithOptions(decimal: true)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(12), border: Border.all(color: context.divider)),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark))),
          SizedBox(
            width: 120,
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              textAlign: TextAlign.right,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(color: context.textMuted.withOpacity(0.5)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProgressBar({required String title, required String subtitle, required int percentage, required bool isEligible, required Color color, required BuildContext context}) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w500)),
              ],
            ),
            Text('$percentage%', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isEligible ? Colors.green : color, letterSpacing: -0.5)),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          height: 8,
          decoration: BoxDecoration(color: Colors.black.withOpacity(0.06), borderRadius: BorderRadius.circular(100)),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage / 100.0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isEligible ? [Colors.green.shade300, Colors.green] : [color.withOpacity(0.7), color],
                ),
                borderRadius: BorderRadius.circular(100),
                boxShadow: isEligible ? [BoxShadow(color: Colors.green.withOpacity(0.4), blurRadius: 8)] : null,
              ),
            ),
          ),
        )
      ],
    );
  }
}

class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashWidth;
  final double dashSpace;
  final double borderRadius;

  DashedBorderPainter({
    required this.color,
    this.strokeWidth = 2.0,
    this.dashWidth = 6.0,
    this.dashSpace = 4.0,
    this.borderRadius = 20.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final RRect rRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(borderRadius),
    );

    final Path path = Path()..addRRect(rRect);

    // Create a dashed path
    final Path dashedPath = Path();
    for (final ui.PathMetric metric in path.computeMetrics()) {
      double distance = 0.0;
      bool draw = true;
      while (distance < metric.length) {
        final double len = draw ? dashWidth : dashSpace;
        if (draw) {
          dashedPath.addPath(metric.extractPath(distance, distance + len), Offset.zero);
        }
        distance += len;
        draw = !draw;
      }
    }

    canvas.drawPath(dashedPath, paint);
  }

  @override
  bool shouldRepaint(covariant DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.dashWidth != dashWidth ||
        oldDelegate.dashSpace != dashSpace ||
        oldDelegate.borderRadius != borderRadius;
  }
}
