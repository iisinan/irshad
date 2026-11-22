import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class _RizqCategory {
  final String key;
  final String label;
  final String subtitle;
  final Color color;
  final double defaultPct;
  final bool isEssential;

  const _RizqCategory({
    required this.key,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.defaultPct,
    this.isEssential = false,
  });
}

const List<_RizqCategory> _rizqCategories = [
  _RizqCategory(
    key: 'housing',
    label: 'Housing and utilities',
    subtitle: 'Rent, power, fuel, data',
    color: Color(0xFF2563EB),
    defaultPct: 30,
    isEssential: true,
  ),
  _RizqCategory(
    key: 'food',
    label: 'Food and household',
    subtitle: 'Groceries, toiletries',
    color: Color(0xFFF97316),
    defaultPct: 15,
    isEssential: true,
  ),
  _RizqCategory(
    key: 'transport',
    label: 'Transport',
    subtitle: 'Fuel, ride-hailing, upkeep',
    color: Color(0xFF10B981),
    defaultPct: 10,
    isEssential: true,
  ),
  _RizqCategory(
    key: 'emergency',
    label: 'Emergency savings',
    subtitle: 'Until 6 months covered',
    color: Color(0xFFEAB308),
    defaultPct: 10,
  ),
  _RizqCategory(
    key: 'investments',
    label: 'Halal investments',
    subtitle: 'Stocks, sukuk, pension top-up',
    color: Color(0xFFEC4899),
    defaultPct: 15,
  ),
  _RizqCategory(
    key: 'sadaqa',
    label: 'Monthly Sadaqa',
    subtitle: 'Family support and Giving',
    color: Color(0xFF15803D),
    defaultPct: 7,
  ),
  _RizqCategory(
    key: 'lifestyle',
    label: 'Personal and lifestyle',
    subtitle: 'Clothing, outings, learning',
    color: Color(0xFF6366F1),
    defaultPct: 8,
  ),
  _RizqCategory(
    key: 'health',
    label: 'Health and takaful',
    subtitle: 'HMO, meds, cover',
    color: Color(0xFFEF4444),
    defaultPct: 5,
    isEssential: true,
  ),
];

const List<String> _guidancePoints = [
  'Pay yourself first: move savings and investments out on payday, before you spend anything.',
  'Housing includes power, generator fuel and data. Paying rent yearly? Set aside 1/12 of it each month.',
  'Stop the emergency fund at six months of essential costs, then move its share into investments.',
  "Monthly Sadaqa: view requests from dependants and extended family as ways to earn Allah's pleasure, and increase barakah in your rizq.",
  'Zakat is due yearly on wealth held for a full year, not on monthly income.',
];

class RizqPlannerScreen extends StatefulWidget {
  final bool isTab;
  const RizqPlannerScreen({super.key, this.isTab = false});

  @override
  State<RizqPlannerScreen> createState() => _RizqPlannerScreenState();
}

class _RizqPlannerScreenState extends State<RizqPlannerScreen> {
  static const String _storageKey = 'irshad_rizq_planner_v1';

  final NumberFormat _ngnFormatter = NumberFormat.currency(symbol: '₦', decimalDigits: 0);
  final NumberFormat _plainNumberFormatter = NumberFormat('#,##0');

  double _income = 500000;
  double _annualReturnPct = 12;
  double _emergencySaved = 0;
  double _annualRent = 1200000;
  double _monthlyUtilities = 50000;
  bool _showRentHelper = false;
  String? _activeKey;

  late final TextEditingController _incomeController;
  late final TextEditingController _emergencySavedController;
  late final TextEditingController _annualRentController;
  late final TextEditingController _monthlyUtilitiesController;
  final Map<String, double> _allocations = {};
  final Map<String, TextEditingController> _pctControllers = {};
  final Map<String, bool> _checkedCategories = {};

  String _currentMonthKey() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}';
  }

  @override
  void initState() {
    super.initState();
    for (final cat in _rizqCategories) {
      _allocations[cat.key] = cat.defaultPct;
      _pctControllers[cat.key] = TextEditingController(text: _formatPct(cat.defaultPct));
      _checkedCategories[cat.key] = false;
    }
    _incomeController = TextEditingController(text: _plainNumberFormatter.format(_income));
    _emergencySavedController = TextEditingController(text: '0');
    _annualRentController = TextEditingController(text: _annualRent.round().toString());
    _monthlyUtilitiesController = TextEditingController(text: _monthlyUtilities.round().toString());
    _loadOfflineState();
  }

  @override
  void dispose() {
    _incomeController.dispose();
    _emergencySavedController.dispose();
    _annualRentController.dispose();
    _monthlyUtilitiesController.dispose();
    for (final c in _pctControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  String _formatPct(double val) {
    if ((val - val.roundToDouble()).abs() < 0.01) {
      return val.round().toString();
    }
    return val.toStringAsFixed(1);
  }

  Future<void> _loadOfflineState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) return;

      final decoded = jsonDecode(raw);
      if (decoded is! Map) return;

      if (!mounted) return;
      setState(() {
        final savedIncome = double.tryParse(decoded['income']?.toString() ?? '');
        if (savedIncome != null && savedIncome >= 0) {
          _income = savedIncome;
          _incomeController.text = _plainNumberFormatter.format(_income.round());
        }
        final savedReturn = double.tryParse(decoded['annualReturnPct']?.toString() ?? '');
        if (savedReturn != null && savedReturn >= 4 && savedReturn <= 24) {
          _annualReturnPct = savedReturn;
        }
        final savedEm = double.tryParse(decoded['emergencySaved']?.toString() ?? '');
        if (savedEm != null && savedEm >= 0) {
          _emergencySaved = savedEm;
          _emergencySavedController.text = _emergencySaved.round().toString();
        }
        final savedRent = double.tryParse(decoded['annualRent']?.toString() ?? '');
        if (savedRent != null && savedRent >= 0) {
          _annualRent = savedRent;
          _annualRentController.text = _annualRent.round().toString();
        }
        final savedUtil = double.tryParse(decoded['monthlyUtilities']?.toString() ?? '');
        if (savedUtil != null && savedUtil >= 0) {
          _monthlyUtilities = savedUtil;
          _monthlyUtilitiesController.text = _monthlyUtilities.round().toString();
        }
        if (decoded['checkedMonth'] == _currentMonthKey() && decoded['checkedCategories'] is Map) {
          final checked = decoded['checkedCategories'] as Map;
          for (final cat in _rizqCategories) {
            _checkedCategories[cat.key] = checked[cat.key] == true;
          }
        }

        final allocMap = decoded['allocations'];
        if (allocMap is Map) {
          for (final cat in _rizqCategories) {
            final v = double.tryParse(allocMap[cat.key]?.toString() ?? '');
            if (v != null && v >= 0 && v <= 100) {
              _allocations[cat.key] = v;
              _pctControllers[cat.key]?.text = _formatPct(v);
            }
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _saveOfflineState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final payload = jsonEncode({
        'income': _income,
        'allocations': _allocations,
        'annualReturnPct': _annualReturnPct,
        'emergencySaved': _emergencySaved,
        'annualRent': _annualRent,
        'monthlyUtilities': _monthlyUtilities,
        'checkedMonth': _currentMonthKey(),
        'checkedCategories': _checkedCategories,
        'updatedAt': DateTime.now().toIso8601String(),
      });
      await prefs.setString(_storageKey, payload);
    } catch (_) {}
  }

  void _onIncomeChanged(String raw) {
    final digitsOnly = raw.replaceAll(RegExp(r'[^0-9]'), '');
    final parsed = digitsOnly.isEmpty ? 0.0 : double.tryParse(digitsOnly) ?? 0.0;
    final clamped = math.min(1000000000.0, parsed);
    setState(() {
      _income = clamped;
    });
    _saveOfflineState();
  }

  void _applyIncomePreset(double value) {
    setState(() {
      _income = value;
      _incomeController.text = _plainNumberFormatter.format(value.round());
    });
    _saveOfflineState();
  }

  void _onPctChanged(String key, String raw) {
    final cleaned = raw.replaceAll(RegExp(r'[^0-9.]'), '');
    double val = cleaned.isEmpty ? 0.0 : (double.tryParse(cleaned) ?? 0.0);
    val = math.max(0.0, math.min(100.0, (val * 10).roundToDouble() / 10));
    setState(() {
      _allocations[key] = val;
    });
    _saveOfflineState();
  }

  void _resetToSuggestedSplit() {
    setState(() {
      for (final cat in _rizqCategories) {
        _allocations[cat.key] = cat.defaultPct;
        _pctControllers[cat.key]?.text = _formatPct(cat.defaultPct);
      }
    });
    _saveOfflineState();
  }

  void _rollEmergencyToInvestments() {
    final em = _allocations['emergency'] ?? 0;
    if (em <= 0) return;
    setState(() {
      final nextInv = (((_allocations['investments'] ?? 0) + em) * 10).roundToDouble() / 10;
      _allocations['emergency'] = 0;
      _allocations['investments'] = nextInv;
      _pctControllers['emergency']?.text = '0';
      _pctControllers['investments']?.text = _formatPct(nextInv);
    });
    _saveOfflineState();
  }

  void _autoBalanceTo100() {
    final currentTotal = _allocations.values.fold(0.0, (a, b) => a + b);
    final delta = ((100 - currentTotal) * 10).roundToDouble() / 10;
    if (delta.abs() < 0.05) return;

    setState(() {
      if (delta > 0) {
        final nextInv = (((_allocations['investments'] ?? 0) + delta) * 10).roundToDouble() / 10;
        _allocations['investments'] = nextInv;
        _pctControllers['investments']?.text = _formatPct(nextInv);
      } else {
        final curLifestyle = _allocations['lifestyle'] ?? 0;
        if (curLifestyle + delta >= 0) {
          final nextLifestyle = ((curLifestyle + delta) * 10).roundToDouble() / 10;
          _allocations['lifestyle'] = nextLifestyle;
          _pctControllers['lifestyle']?.text = _formatPct(nextLifestyle);
        } else if (currentTotal > 0) {
          double sum = 0;
          for (int i = 0; i < _rizqCategories.length; i++) {
            final cat = _rizqCategories[i];
            final nextVal = i == _rizqCategories.length - 1
                ? math.max(0.0, ((100 - sum) * 10).roundToDouble() / 10)
                : ((((_allocations[cat.key] ?? 0) / currentTotal) * 100) * 10).roundToDouble() / 10;
            _allocations[cat.key] = nextVal;
            _pctControllers[cat.key]?.text = _formatPct(nextVal);
            sum += nextVal;
          }
        }
      }
    });
    _saveOfflineState();
  }

  void _togglePaydayEnvelope(String key) {
    setState(() {
      _checkedCategories[key] = !(_checkedCategories[key] ?? false);
    });
    _saveOfflineState();
  }

  double get _monthlyHousingNeed => (_annualRent / 12) + _monthlyUtilities;

  double get _recommendedHousingPct {
    if (_income <= 0) return 0;
    return math.min(100.0, ((_monthlyHousingNeed / _income) * 1000).roundToDouble() / 10);
  }

  void _applyHousingFromRent() {
    if (_income <= 0) return;
    final pct = _recommendedHousingPct;
    setState(() {
      _allocations['housing'] = pct;
      _pctControllers['housing']?.text = _formatPct(pct);
    });
    _saveOfflineState();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Housing share updated to ${_formatPct(pct)}% (${_ngnFormatter.format(_monthlyHousingNeed.round())}/mo).'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _copyPlan() async {
    final plannedTotal = (_income * _totalPct) / 100;
    final wealthNgn = (_income * _wealthPct) / 100;
    final lines = [
      'Irshad Monthly Rizq Compounder (${_currentMonthKey()})',
      'Monthly Take-Home Income: ${_ngnFormatter.format(_income.round())}',
      '',
      ..._rizqCategories.map((c) {
        final pct = _allocations[c.key] ?? 0;
        final amt = (_income * pct) / 100;
        final mark = (_checkedCategories[c.key] ?? false) ? '[x]' : '[ ]';
        return '$mark ${c.label}: ${_formatPct(pct)}% (${_ngnFormatter.format(amt.round())})';
      }),
      '',
      'Savings + Halal Investments: ${_formatPct(_wealthPct)}% (${_ngnFormatter.format(wealthNgn.round())})',
      'Planned Total: ${_formatPct(_totalPct)}% (${_ngnFormatter.format(plannedTotal.round())})',
    ].join('\n');

    await Clipboard.setData(ClipboardData(text: lines));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payday allocation plan copied to clipboard.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  double get _totalPct {
    final raw = _allocations.values.fold(0.0, (a, b) => a + b);
    return (raw * 10).roundToDouble() / 10;
  }

  double get _wealthPct {
    final raw = (_allocations['emergency'] ?? 0) + (_allocations['investments'] ?? 0);
    return (raw * 10).roundToDouble() / 10;
  }

  Map<String, dynamic> _simulateCompounding() {
    final essentialMonthly = _rizqCategories
        .where((c) => c.isEssential)
        .fold(0.0, (sum, c) => sum + (_income * (_allocations[c.key] ?? 0)) / 100);
    final sixMonthTarget = essentialMonthly * 6;
    final monthlyEmergency = (_income * (_allocations['emergency'] ?? 0)) / 100;
    final monthlyInvestment = (_income * (_allocations['investments'] ?? 0)) / 100;
    final monthlyRate = _annualReturnPct / 100 / 12;

    final remainingTarget = math.max(0.0, sixMonthTarget - _emergencySaved);
    int? monthsToEmergency;
    if (remainingTarget <= 0) {
      monthsToEmergency = 0;
    } else if (monthlyEmergency > 0) {
      monthsToEmergency = (remainingTarget / monthlyEmergency).ceil();
    }

    Map<String, double> project(int months) {
      double emBalance = _emergencySaved;
      double invBalance = 0;
      double contributed = 0;

      for (int m = 1; m <= months; m++) {
        invBalance *= 1 + monthlyRate;
        double invAdd = monthlyInvestment;

        if (emBalance < sixMonthTarget && monthlyEmergency > 0) {
          emBalance += monthlyEmergency;
          if (emBalance > sixMonthTarget) {
            invAdd += emBalance - sixMonthTarget;
            emBalance = sixMonthTarget;
          }
        } else if (monthlyEmergency > 0) {
          invAdd += monthlyEmergency;
        }

        invBalance += invAdd;
        contributed += invAdd;
      }

      return {
        'invested': invBalance,
        'gains': math.max(0.0, invBalance - contributed),
      };
    }

    return {
      'essentialMonthly': essentialMonthly,
      'sixMonthTarget': sixMonthTarget,
      'monthlyEmergency': monthlyEmergency,
      'monthsToEmergency': monthsToEmergency,
      'horizons': [
        {'label': '1 Year', ...project(12)},
        {'label': '3 Years', ...project(36)},
        {'label': '5 Years', ...project(60)},
        {'label': '10 Years', ...project(120)},
      ],
    };
  }

  @override
  Widget build(BuildContext context) {
    final totalPct = _totalPct;
    final plannedTotal = (_income * totalPct) / 100;
    final wealthPct = _wealthPct;
    final wealthNgn = (_income * wealthPct) / 100;
    final isExact100 = (totalPct - 100).abs() < 0.05;
    final diffPct = ((100 - totalPct).abs() * 10).roundToDouble() / 10;
    final projection = _simulateCompounding();
    int movedCount = 0;
    double movedAmount = 0;
    for (final cat in _rizqCategories) {
      if (_checkedCategories[cat.key] == true) {
        movedCount++;
        movedAmount += (_income * (_allocations[cat.key] ?? 0)) / 100;
      }
    }

    final bodyContent = SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, widget.isTab ? 16 : 8, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'IRSHAD · MONTHLY BUDGET',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                        color: context.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Monthly Rizq Compounder Planner',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                        color: context.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Enter your take-home pay, then adjust each share to fit your life.',
                      style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: context.halalBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: context.halal.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.offline_pin_rounded, size: 14, color: context.halal),
                    const SizedBox(width: 4),
                    Text(
                      'Offline Ready',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.halal),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Main Planner Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: context.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Monthly take-home income',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.bgSection,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: context.divider),
                  ),
                  child: Row(
                    children: [
                      Text('₦', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textMuted)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: TextField(
                          controller: _incomeController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          onChanged: _onIncomeChanged,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: context.textDark,
                          ),
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            filled: false,
                            contentPadding: EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    ...[250000.0, 500000.0, 1000000.0, 2000000.0].map((preset) {
                      final selected = (_income - preset).abs() < 1;
                      final label = preset >= 1000000 ? '₦${(preset / 1000000).round()}M' : '₦${(preset / 1000).round()}K';
                      return ChoiceChip(
                        label: Text(label),
                        selected: selected,
                        onSelected: (_) => _applyIncomePreset(preset),
                        selectedColor: context.primary.withValues(alpha: 0.14),
                        backgroundColor: context.bgSection,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: selected ? context.primary : context.textMuted,
                        ),
                        side: BorderSide(color: selected ? context.primary : context.divider),
                        showCheckmark: false,
                      );
                    }),
                    ActionChip(
                      avatar: Icon(Icons.home_outlined, size: 15, color: _showRentHelper ? context.primary : context.textDark),
                      label: const Text('Yearly Rent 1/12'),
                      onPressed: () => setState(() => _showRentHelper = !_showRentHelper),
                      backgroundColor: _showRentHelper ? context.primary.withValues(alpha: 0.12) : context.bgSection,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _showRentHelper ? context.primary : context.textDark,
                      ),
                      side: BorderSide(color: _showRentHelper ? context.primary : context.divider),
                    ),
                  ],
                ),

                if (_showRentHelper) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: context.bgSection,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: context.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('ANNUAL RENT (₦/YR)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted)),
                                  const SizedBox(height: 4),
                                  TextField(
                                    controller: _annualRentController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                    onChanged: (v) {
                                      setState(() => _annualRent = double.tryParse(v) ?? 0);
                                      _saveOfflineState();
                                    },
                                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: context.textDark),
                                    decoration: InputDecoration(
                                      isDense: true,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      filled: true,
                                      fillColor: context.bgAlt,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.divider)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('POWER / FUEL / DATA (₦/MO)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted)),
                                  const SizedBox(height: 4),
                                  TextField(
                                    controller: _monthlyUtilitiesController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                    onChanged: (v) {
                                      setState(() => _monthlyUtilities = double.tryParse(v) ?? 0);
                                      _saveOfflineState();
                                    },
                                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: context.textDark),
                                    decoration: InputDecoration(
                                      isDense: true,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      filled: true,
                                      fillColor: context.bgAlt,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.divider)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'Monthly housing need: ${_ngnFormatter.format(_monthlyHousingNeed.round())} (${_formatPct(_recommendedHousingPct)}%)',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted),
                              ),
                            ),
                            ElevatedButton(
                              onPressed: _applyHousingFromRent,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: context.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: Text('Apply ${_formatPct(_recommendedHousingPct)}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 22),
                Divider(height: 1, color: context.divider),
                const SizedBox(height: 22),

                // Donut Chart + Allocation Pill
                Center(
                  child: Column(
                    children: [
                      SizedBox(
                        width: 196,
                        height: 196,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CustomPaint(
                              size: const Size(196, 196),
                              painter: _RizqDonutPainter(
                                categories: _rizqCategories,
                                allocations: Map<String, double>.from(_allocations),
                                totalPct: totalPct,
                                activeKey: _activeKey,
                                trackColor: context.bgSection,
                              ),
                            ),
                            Builder(
                              builder: (context) {
                                final activeCat = _activeKey == null
                                    ? null
                                    : _rizqCategories.cast<_RizqCategory?>().firstWhere(
                                          (c) => c?.key == _activeKey,
                                          orElse: () => null,
                                        );
                                if (activeCat != null) {
                                  final catPct = _allocations[activeCat.key] ?? 0;
                                  final catAmt = (_income * catPct) / 100;
                                  return SizedBox(
                                    width: 112,
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          activeCat.label,
                                          textAlign: TextAlign.center,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w800,
                                            color: activeCat.color,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${_formatPct(catPct)}%',
                                          style: TextStyle(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w900,
                                            color: context.textDark,
                                          ),
                                        ),
                                        Text(
                                          _ngnFormatter.format(catAmt.round()),
                                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.textMuted),
                                        ),
                                      ],
                                    ),
                                  );
                                }
                                return Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      '${_formatPct(totalPct)}%',
                                      style: TextStyle(
                                        fontSize: 30,
                                        fontWeight: FontWeight.w900,
                                        color: totalPct > 100 ? context.haram : context.primary,
                                      ),
                                    ),
                                    Text(
                                      'allocated',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isExact100
                              ? context.halalBg
                              : totalPct > 100
                                  ? context.haramBg
                                  : context.questionableBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          isExact100
                              ? 'All 100% allocated'
                              : totalPct > 100
                                  ? '${_formatPct(diffPct)}% over-allocated (${_ngnFormatter.format((plannedTotal - _income).round())})'
                                  : '${_formatPct(diffPct)}% left (${_ngnFormatter.format((_income - plannedTotal).round())} remaining)',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: isExact100
                                ? context.halal
                                : totalPct > 100
                                    ? context.haram
                                    : context.questionable,
                          ),
                        ),
                      ),
                      if (!isExact100) ...[
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: _autoBalanceTo100,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            side: BorderSide(color: context.primary),
                            backgroundColor: context.primary.withValues(alpha: 0.08),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                          ),
                          child: Text(
                            totalPct < 100
                                ? 'Send ${_formatPct(diffPct)}% → Halal investments (100%)'
                                : 'Auto-balance shares to 100%',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.primary),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 22),

                // 8 Category Rows
                ..._rizqCategories.map((cat) {
                  final pct = _allocations[cat.key] ?? 0;
                  final amount = (_income * pct) / 100;
                  final isHighlighted = _activeKey == cat.key;
                  final isMoved = _checkedCategories[cat.key] == true;
                  return InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => setState(() => _activeKey = isHighlighted ? null : cat.key),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                      decoration: BoxDecoration(
                        color: isHighlighted ? context.bgSection : Colors.transparent,
                        border: Border(bottom: BorderSide(color: context.divider)),
                      ),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => _togglePaydayEnvelope(cat.key),
                            child: Container(
                              width: 20,
                              height: 20,
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                color: isMoved ? context.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isMoved ? context.primary : context.textMuted.withValues(alpha: 0.45),
                                  width: 1.5,
                                ),
                              ),
                              child: isMoved ? const Icon(Icons.check_rounded, size: 13, color: Colors.white) : null,
                            ),
                          ),
                          Container(
                            width: 11,
                            height: 11,
                            decoration: BoxDecoration(
                              color: cat.color,
                              borderRadius: BorderRadius.circular(3.5),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  cat.label,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: isMoved ? context.textMuted : context.textDark,
                                    decoration: isMoved ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                                Text(
                                  cat.subtitle,
                                  style: TextStyle(fontSize: 11, color: context.textMuted),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 66,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.bgSection,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: context.divider),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _pctControllers[cat.key],
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    textAlign: TextAlign.right,
                                    onChanged: (val) => _onPctChanged(cat.key, val),
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w800,
                                      color: context.textDark,
                                    ),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      border: InputBorder.none,
                                      enabledBorder: InputBorder.none,
                                      focusedBorder: InputBorder.none,
                                      filled: false,
                                      contentPadding: EdgeInsets.symmetric(vertical: 6),
                                    ),
                                  ),
                                ),
                                Text('%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          SizedBox(
                            width: 82,
                            child: Text(
                              _ngnFormatter.format(amount.round()),
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: context.textDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),

                const SizedBox(height: 14),

                // Summary Bar
                Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  runSpacing: 6,
                  spacing: 12,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: TextStyle(fontSize: 12.5, color: context.textMuted),
                        children: [
                          const TextSpan(text: 'Savings + halal investments: '),
                          TextSpan(
                            text: '${_formatPct(wealthPct)}% · ${_ngnFormatter.format(wealthNgn.round())}',
                            style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark),
                          ),
                        ],
                      ),
                    ),
                    RichText(
                      text: TextSpan(
                        style: TextStyle(fontSize: 12.5, color: context.textMuted),
                        children: [
                          const TextSpan(text: 'Planned total: '),
                          TextSpan(
                            text: _ngnFormatter.format(plannedTotal.round()),
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: isExact100 ? context.primary : context.textDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Payday Checklist Progress
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: context.bgSection,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Payday checklist (${_currentMonthKey()}): $movedCount/${_rizqCategories.length} moved · ${_ngnFormatter.format(movedAmount.round())}',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textDark),
                            ),
                          ),
                          if (movedCount > 0)
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  for (final cat in _rizqCategories) {
                                    _checkedCategories[cat.key] = false;
                                  }
                                });
                                _saveOfflineState();
                              },
                              child: Text(
                                'Clear',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.primary),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: movedCount / _rizqCategories.length,
                          minHeight: 5,
                          backgroundColor: context.divider,
                          valueColor: AlwaysStoppedAnimation<Color>(context.primary),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Action Buttons
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _resetToSuggestedSplit,
                      icon: const Icon(Icons.refresh_rounded, size: 17),
                      label: const Text('Reset to suggested split', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: _copyPlan,
                      icon: Icon(Icons.copy_rounded, size: 16, color: context.textDark),
                      label: Text(
                        'Copy Plan',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: context.textDark),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        side: BorderSide(color: context.divider),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    if ((_allocations['emergency'] ?? 0) > 0)
                      OutlinedButton.icon(
                        onPressed: _rollEmergencyToInvestments,
                        icon: const Icon(Icons.auto_awesome_rounded, size: 16, color: Color(0xFFEC4899)),
                        label: Text(
                          'Shift ${_formatPct(_allocations['emergency'] ?? 0)}% → Investments',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: context.textDark),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          side: BorderSide(color: context.divider),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Guidance Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.bgSection,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: context.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.verified_user_rounded, size: 18, color: context.primary),
                    const SizedBox(width: 8),
                    Text(
                      'How the suggested split works',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._guidancePoints.map(
                  (pt) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('•  ', style: TextStyle(fontWeight: FontWeight.w900, color: context.primary)),
                        Expanded(
                          child: Text(
                            pt,
                            style: TextStyle(fontSize: 12.5, height: 1.45, color: context.textBody),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/zakat_calculator'),
                  icon: Icon(Icons.calculate_outlined, size: 16, color: context.primary),
                  label: Text(
                    'Open Zakat Calculator',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: context.primary),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: context.divider),
                    backgroundColor: context.bgAlt,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Offline Compounding Projection Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.trending_up_rounded, size: 19, color: context.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Rizq Compounding Horizon (Offline)',
                        style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w900, color: context.textDark),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Models reaching your 6-month essential buffer, then rolling ${_formatPct(wealthPct)}% monthly into Halal investments.',
                  style: TextStyle(fontSize: 12.5, color: context.textMuted, height: 1.4),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'CURRENT EMERGENCY SAVED (₦)',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _emergencySavedController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            onChanged: (v) {
                              setState(() => _emergencySaved = double.tryParse(v) ?? 0);
                              _saveOfflineState();
                            },
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark),
                            decoration: InputDecoration(
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              filled: true,
                              fillColor: context.bgSection,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(color: context.divider),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'HALAL RETURN (${_annualReturnPct.round()}% P.A.)',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted),
                          ),
                          Slider(
                            value: _annualReturnPct,
                            min: 4,
                            max: 24,
                            divisions: 20,
                            activeColor: context.primary,
                            onChanged: (val) {
                              setState(() => _annualReturnPct = val);
                              _saveOfflineState();
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.bgSection,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.divider),
                  ),
                  child: Text(
                    '6-Month Target: ${_ngnFormatter.format((projection['sixMonthTarget'] as double).round())}  ·  '
                    '${projection['monthsToEmergency'] == 0 ? 'Buffer funded!' : projection['monthsToEmergency'] == null ? 'Set Emergency %' : '${projection['monthsToEmergency']} mos to fill'}',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: context.primary),
                  ),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.85,
                  children: (projection['horizons'] as List<Map<String, dynamic>>).map((h) {
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: context.bgSection,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: context.divider),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            (h['label'] as String).toUpperCase(),
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: context.textMuted),
                          ),
                          const SizedBox(height: 4),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _ngnFormatter.format((h['invested'] as double).round()),
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.primary),
                            ),
                          ),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              '+${_ngnFormatter.format((h['gains'] as double).round())} Halal growth',
                              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: context.halal),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (widget.isTab) {
      return bodyContent;
    }

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Rizq Compounder', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark)),
      ),
      body: SafeArea(child: bodyContent),
    );
  }
}

class _RizqDonutPainter extends CustomPainter {
  final List<_RizqCategory> categories;
  final Map<String, double> allocations;
  final double totalPct;
  final String? activeKey;
  final Color trackColor;

  _RizqDonutPainter({
    required this.categories,
    required this.allocations,
    required this.totalPct,
    required this.activeKey,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    const baseStroke = 30.0;
    final radius = (math.min(size.width, size.height) / 2) - (baseStroke / 2) - 4;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = baseStroke;
    canvas.drawCircle(center, radius, trackPaint);

    final denominator = totalPct > 100 ? totalPct : 100.0;
    double startAngle = -math.pi / 2;
    const gapRadians = 0.025;

    for (final cat in categories) {
      final pct = allocations[cat.key] ?? 0;
      if (pct <= 0) continue;

      final sweep = (pct / denominator) * 2 * math.pi;
      final drawSweep = sweep > gapRadians ? sweep - gapRadians : sweep;
      final isHighlighted = activeKey == cat.key;
      final dimmed = activeKey != null && !isHighlighted;

      final paint = Paint()
        ..color = dimmed ? cat.color.withValues(alpha: 0.55) : cat.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = isHighlighted ? baseStroke + 5 : baseStroke
        ..strokeCap = StrokeCap.butt;

      canvas.drawArc(rect, startAngle, drawSweep, false, paint);
      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _RizqDonutPainter oldDelegate) {
    if (oldDelegate.totalPct != totalPct ||
        oldDelegate.activeKey != activeKey ||
        oldDelegate.trackColor != trackColor) {
      return true;
    }
    for (final cat in categories) {
      if (oldDelegate.allocations[cat.key] != allocations[cat.key]) {
        return true;
      }
    }
    return false;
  }
}
