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

const List<String> _trimPriority = [
  'lifestyle',
  'transport',
  'investments',
  'emergency',
  'food',
  'housing',
  'health',
  'sadaqa',
];

double _round1(double val) => (val * 10).roundToDouble() / 10;

class _RizqTrimItem {
  final String key;
  final String label;
  final double from;
  final double to;
  final double delta;

  const _RizqTrimItem({
    required this.key,
    required this.label,
    required this.from,
    required this.to,
    required this.delta,
  });
}

class _RizqRebalanceResult {
  final Map<String, double> allocations;
  final double maxAllowed;
  final bool cappedByLocks;
  final double finalTargetPct;
  final List<_RizqTrimItem> trimmed;
  final double remaining;

  const _RizqRebalanceResult({
    required this.allocations,
    required this.maxAllowed,
    required this.cappedByLocks,
    required this.finalTargetPct,
    required this.trimmed,
    required this.remaining,
  });
}

class _RizqSuggestionAction {
  final String id;
  final String label;
  final Map<String, double> nextAlloc;
  final String toast;

  const _RizqSuggestionAction({
    required this.id,
    required this.label,
    required this.nextAlloc,
    required this.toast,
  });
}

class _RizqSuggestion {
  final String targetKey;
  final double fromPct;
  final double toPct;
  final Map<String, double> baseAlloc;
  final List<_RizqTrimItem> trimmed;
  final double remaining;

  const _RizqSuggestion({
    required this.targetKey,
    required this.fromPct,
    required this.toPct,
    required this.baseAlloc,
    required this.trimmed,
    required this.remaining,
  });
}

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
  double _annualRent = 1200000;
  double _monthlyUtilities = 50000;
  bool _showRentHelper = false;
  String? _activeKey;

  late final TextEditingController _incomeController;
  late final TextEditingController _annualRentController;
  late final TextEditingController _monthlyUtilitiesController;
  final Map<String, double> _allocations = {};
  final Map<String, TextEditingController> _pctControllers = {};
  final Map<String, FocusNode> _pctFocusNodes = {};
  final Map<String, bool> _checkedCategories = {};
  final Map<String, bool> _lockedCategories = {};

  String? _sessionKey;
  Map<String, double>? _sessionBaseAlloc;
  String? _editingAmountKey;
  late final TextEditingController _amountController;
  late final FocusNode _amountFocusNode;
  _RizqSuggestion? _suggestion;
  int _lastLockToastMs = 0;

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
      _lockedCategories[cat.key] = false;
      final node = FocusNode();
      node.addListener(() => _onPctFocusChanged(cat.key, node.hasFocus));
      _pctFocusNodes[cat.key] = node;
    }
    _incomeController = TextEditingController(text: _plainNumberFormatter.format(_income));
    _annualRentController = TextEditingController(text: _annualRent.round().toString());
    _monthlyUtilitiesController = TextEditingController(text: _monthlyUtilities.round().toString());
    _amountController = TextEditingController();
    _amountFocusNode = FocusNode();
    _amountFocusNode.addListener(() {
      if (!_amountFocusNode.hasFocus && _editingAmountKey != null) {
        _commitAmountEdit();
      }
    });
    _loadOfflineState();
  }

  @override
  void dispose() {
    _incomeController.dispose();
    _annualRentController.dispose();
    _monthlyUtilitiesController.dispose();
    _amountController.dispose();
    _amountFocusNode.dispose();
    for (final c in _pctControllers.values) {
      c.dispose();
    }
    for (final f in _pctFocusNodes.values) {
      f.dispose();
    }
    super.dispose();
  }

  String _formatPct(double val) {
    if ((val - val.roundToDouble()).abs() < 0.01) {
      return val.round().toString();
    }
    return val.toStringAsFixed(1);
  }

  double _sumAllocations(Map<String, double> alloc) {
    double sum = 0;
    for (final cat in _rizqCategories) {
      sum += alloc[cat.key] ?? 0;
    }
    return _round1(sum);
  }

  Map<String, double> _capAllocationsTo100(Map<String, double> alloc) {
    final next = Map<String, double>.from(alloc);
    final total = _sumAllocations(next);
    if (total <= 100 || total <= 0) return next;
    double running = 0;
    for (int i = 0; i < _rizqCategories.length; i++) {
      final cat = _rizqCategories[i];
      if (i == _rizqCategories.length - 1) {
        next[cat.key] = math.max(0.0, _round1(100 - running));
      } else {
        final scaled = _round1(((next[cat.key] ?? 0) / total) * 100);
        next[cat.key] = scaled;
        running = _round1(running + scaled);
      }
    }
    return next;
  }

  _RizqRebalanceResult _rebalanceWithCap(
    Map<String, double> baseAlloc,
    String targetKey,
    double desiredPct, {
    String mode = 'priority',
    String? sourceKey,
  }) {
    double lockedOtherSum = 0;
    for (final cat in _rizqCategories) {
      if (cat.key != targetKey && (_lockedCategories[cat.key] ?? false)) {
        lockedOtherSum += baseAlloc[cat.key] ?? 0;
      }
    }
    lockedOtherSum = _round1(lockedOtherSum);
    final maxAllowed = math.max(0.0, _round1(100 - lockedOtherSum));
    final clampedDesired = math.max(0.0, _round1(desiredPct));
    final finalTargetPct = math.min(maxAllowed, clampedDesired);
    final cappedByLocks = clampedDesired > maxAllowed;

    final next = Map<String, double>.from(baseAlloc);
    next[targetKey] = finalTargetPct;
    final rawTotal = _sumAllocations(next);

    if (rawTotal > 100) {
      double excess = _round1(rawTotal - 100);
      final unlockedOthers = _rizqCategories
          .where((c) => c.key != targetKey && !(_lockedCategories[c.key] ?? false) && (next[c.key] ?? 0) > 0)
          .toList();

      if (mode == 'proportional') {
        final unlockedSum = _round1(unlockedOthers.fold(0.0, (s, c) => s + (next[c.key] ?? 0)));
        if (unlockedSum > 0) {
          for (final c in unlockedOthers) {
            if (excess <= 0) break;
            final avail = next[c.key] ?? 0;
            final cut = math.min(avail, math.min(excess, _round1((avail / unlockedSum) * excess)));
            next[c.key] = _round1(avail - cut);
            excess = _round1(excess - cut);
          }
        }
      }

      final order = sourceKey != null
          ? [sourceKey, ..._trimPriority.where((k) => k != sourceKey)]
          : _trimPriority;

      for (final k in order) {
        if (excess <= 0) break;
        if (k == targetKey || (_lockedCategories[k] ?? false)) continue;
        final avail = next[k] ?? 0;
        if (avail <= 0) continue;
        final cut = math.min(avail, excess);
        next[k] = _round1(avail - cut);
        excess = _round1(excess - cut);
      }

      double guardSum = _sumAllocations(next);
      if (guardSum > 100) {
        double over = _round1(guardSum - 100);
        final fallback = _rizqCategories
            .where((c) => c.key != targetKey && !(_lockedCategories[c.key] ?? false))
            .toList()
          ..sort((a, b) => (next[b.key] ?? 0).compareTo(next[a.key] ?? 0));
        for (final c in fallback) {
          if (over <= 0) break;
          final avail = next[c.key] ?? 0;
          final cut = math.min(avail, over);
          next[c.key] = _round1(avail - cut);
          over = _round1(over - cut);
        }
        guardSum = _sumAllocations(next);
        if (guardSum > 100) {
          next[targetKey] = math.max(0.0, _round1((next[targetKey] ?? 0) - (guardSum - 100)));
        }
      }
    }

    final trimmed = <_RizqTrimItem>[];
    for (final c in _rizqCategories) {
      if (c.key == targetKey) continue;
      final from = baseAlloc[c.key] ?? 0;
      final to = next[c.key] ?? 0;
      final delta = _round1(to - from);
      if (delta.abs() >= 0.05) {
        trimmed.add(_RizqTrimItem(key: c.key, label: c.label, from: from, to: to, delta: delta));
      }
    }

    return _RizqRebalanceResult(
      allocations: next,
      maxAllowed: maxAllowed,
      cappedByLocks: cappedByLocks,
      finalTargetPct: next[targetKey] ?? 0,
      trimmed: trimmed,
      remaining: math.max(0.0, _round1(100 - _sumAllocations(next))),
    );
  }

  List<_RizqTrimItem> _diffAllocations(Map<String, double> baseAlloc, Map<String, double> curAlloc, String excludeKey) {
    final list = <_RizqTrimItem>[];
    for (final c in _rizqCategories) {
      if (c.key == excludeKey) continue;
      final from = baseAlloc[c.key] ?? 0;
      final to = curAlloc[c.key] ?? 0;
      final delta = _round1(to - from);
      if (delta.abs() >= 0.05) {
        list.add(_RizqTrimItem(key: c.key, label: c.label, from: from, to: to, delta: delta));
      }
    }
    return list;
  }

  _RizqSuggestion? _buildSuggestion(Map<String, double> baseAlloc, String targetKey, Map<String, double> nextAlloc) {
    final fromPct = baseAlloc[targetKey] ?? 0;
    final toPct = nextAlloc[targetKey] ?? 0;
    final trimmed = _diffAllocations(baseAlloc, nextAlloc, targetKey);
    final remaining = math.max(0.0, _round1(100 - _sumAllocations(nextAlloc)));
    if ((toPct - fromPct).abs() < 0.05 && trimmed.isEmpty) return null;
    if (trimmed.isEmpty && remaining < 0.05) return null;
    return _RizqSuggestion(
      targetKey: targetKey,
      fromPct: fromPct,
      toPct: toPct,
      baseAlloc: Map<String, double>.from(baseAlloc),
      trimmed: trimmed,
      remaining: remaining,
    );
  }

  void _syncPctControllers({String? skipKey}) {
    for (final cat in _rizqCategories) {
      if (cat.key == skipKey) continue;
      final formatted = _formatPct(_allocations[cat.key] ?? 0);
      final ctrl = _pctControllers[cat.key];
      if (ctrl != null && ctrl.text != formatted) {
        ctrl.value = TextEditingValue(
          text: formatted,
          selection: TextSelection.collapsed(offset: formatted.length),
        );
      }
    }
  }

  void _showNotice(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  void _notifyLockCap(String label, double maxAllowed) {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (now - _lastLockToastMs > 2000) {
      _lastLockToastMs = now;
      _showNotice('Capped $label at ${_formatPct(maxAllowed)}% while other categories are locked.');
    }
  }

  void _onPctFocusChanged(String key, bool hasFocus) {
    final ctrl = _pctControllers[key];
    if (hasFocus) {
      _sessionKey = key;
      _sessionBaseAlloc = Map<String, double>.from(_allocations);
      if (ctrl != null) {
        ctrl.selection = TextSelection(baseOffset: 0, extentOffset: ctrl.text.length);
      }
    } else {
      final formatted = _formatPct(_allocations[key] ?? 0);
      if (ctrl != null && ctrl.text != formatted) {
        ctrl.value = TextEditingValue(
          text: formatted,
          selection: TextSelection.collapsed(offset: formatted.length),
        );
      }
      if (_sessionKey == key && _sessionBaseAlloc != null) {
        final nextSugg = _buildSuggestion(_sessionBaseAlloc!, key, _allocations);
        _sessionKey = null;
        _sessionBaseAlloc = null;
        if (nextSugg != null && mounted) {
          setState(() => _suggestion = nextSugg);
        }
      }
    }
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
        if (decoded['lockedCategories'] is Map) {
          final locked = decoded['lockedCategories'] as Map;
          for (final cat in _rizqCategories) {
            _lockedCategories[cat.key] = locked[cat.key] == true;
          }
        }

        final allocMap = decoded['allocations'];
        if (allocMap is Map) {
          for (final cat in _rizqCategories) {
            final v = double.tryParse(allocMap[cat.key]?.toString() ?? '');
            if (v != null && v >= 0 && v <= 100) {
              _allocations[cat.key] = v;
            }
          }
          final capped = _capAllocationsTo100(_allocations);
          _allocations.addAll(capped);
          _syncPctControllers();
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
        'annualRent': _annualRent,
        'monthlyUtilities': _monthlyUtilities,
        'checkedMonth': _currentMonthKey(),
        'checkedCategories': _checkedCategories,
        'lockedCategories': _lockedCategories,
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
    final digitsAndDots = raw.replaceAll(RegExp(r'[^0-9.]'), '');
    final dotIdx = digitsAndDots.indexOf('.');
    final sanitized = dotIdx == -1
        ? digitsAndDots
        : '${digitsAndDots.substring(0, dotIdx + 1)}${digitsAndDots.substring(dotIdx + 1).replaceAll('.', '')}';

    final baseAlloc = (_sessionKey == key && _sessionBaseAlloc != null)
        ? _sessionBaseAlloc!
        : Map<String, double>.from(_allocations);

    final desired = (sanitized.isEmpty || sanitized == '.')
        ? 0.0
        : (double.tryParse(sanitized) ?? 0.0);
    final res = _rebalanceWithCap(baseAlloc, key, desired);

    if (res.cappedByLocks || _round1(desired) > 100) {
      if (res.cappedByLocks) {
        final label = _rizqCategories.firstWhere((c) => c.key == key).label;
        _notifyLockCap(label, res.maxAllowed);
      }
      final cappedText = _formatPct(res.finalTargetPct);
      _pctControllers[key]?.value = TextEditingValue(
        text: cappedText,
        selection: TextSelection.collapsed(offset: cappedText.length),
      );
    } else if (sanitized != raw) {
      _pctControllers[key]?.value = TextEditingValue(
        text: sanitized,
        selection: TextSelection.collapsed(offset: sanitized.length),
      );
    }

    setState(() {
      _allocations.addAll(res.allocations);
      _syncPctControllers(skipKey: key);
    });
    _saveOfflineState();
  }

  void _stepPct(String key, double delta) {
    FocusScope.of(context).unfocus();
    _sessionKey = null;
    _sessionBaseAlloc = null;
    final anchorBase = (_suggestion?.targetKey == key)
        ? _suggestion!.baseAlloc
        : Map<String, double>.from(_allocations);
    final desired = _round1((_allocations[key] ?? 0) + delta);
    final res = _rebalanceWithCap(anchorBase, key, desired);
    if (res.cappedByLocks) {
      final label = _rizqCategories.firstWhere((c) => c.key == key).label;
      _notifyLockCap(label, res.maxAllowed);
    }
    setState(() {
      _allocations.addAll(res.allocations);
      _syncPctControllers();
      _suggestion = _buildSuggestion(anchorBase, key, _allocations);
    });
    _saveOfflineState();
  }

  void _startAmountEdit(String key, double currentAmount) {
    if (_income <= 0) {
      _showNotice('Enter your monthly take-home income first to budget by Naira amount.');
      return;
    }
    _sessionKey = key;
    _sessionBaseAlloc = Map<String, double>.from(_allocations);
    final text = _plainNumberFormatter.format(currentAmount.round());
    setState(() {
      _editingAmountKey = key;
      _amountController.value = TextEditingValue(
        text: text,
        selection: TextSelection(baseOffset: 0, extentOffset: text.length),
      );
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _amountFocusNode.requestFocus();
    });
  }

  void _onAmountChanged(String key, String raw) {
    final cleaned = raw.replaceAll(RegExp(r'[^0-9]'), '');
    final baseAlloc = (_sessionKey == key && _sessionBaseAlloc != null)
        ? _sessionBaseAlloc!
        : Map<String, double>.from(_allocations);

    if (cleaned.isEmpty) {
      final res = _rebalanceWithCap(baseAlloc, key, 0);
      setState(() {
        _allocations.addAll(res.allocations);
        _syncPctControllers();
      });
      _saveOfflineState();
      return;
    }

    final nairaVal = math.min(_income, double.tryParse(cleaned) ?? 0.0);
    final desiredPct = _income > 0 ? _round1((nairaVal / _income) * 100) : 0.0;
    final res = _rebalanceWithCap(baseAlloc, key, desiredPct);

    if (res.cappedByLocks) {
      final label = _rizqCategories.firstWhere((c) => c.key == key).label;
      _notifyLockCap(label, res.maxAllowed);
      final cappedText = _plainNumberFormatter.format(((_income * res.finalTargetPct) / 100).round());
      _amountController.value = TextEditingValue(
        text: cappedText,
        selection: TextSelection.collapsed(offset: cappedText.length),
      );
    } else {
      final formatted = _plainNumberFormatter.format(nairaVal.round());
      if (_amountController.text != formatted) {
        _amountController.value = TextEditingValue(
          text: formatted,
          selection: TextSelection.collapsed(offset: formatted.length),
        );
      }
    }

    setState(() {
      _allocations.addAll(res.allocations);
      _syncPctControllers();
    });
    _saveOfflineState();
  }

  void _commitAmountEdit() {
    final key = _editingAmountKey;
    final baseAlloc = _sessionBaseAlloc;
    _sessionKey = null;
    _sessionBaseAlloc = null;
    setState(() {
      _editingAmountKey = null;
      if (key != null && baseAlloc != null) {
        final nextSugg = _buildSuggestion(baseAlloc, key, _allocations);
        if (nextSugg != null) _suggestion = nextSugg;
      }
    });
  }

  void _toggleLockCategory(String key) {
    setState(() {
      _lockedCategories[key] = !(_lockedCategories[key] ?? false);
    });
    _saveOfflineState();
  }

  void _applySuggestionVariant(Map<String, double> nextAlloc, [String? feedback]) {
    setState(() {
      _allocations.addAll(_capAllocationsTo100(nextAlloc));
      _syncPctControllers();
      _suggestion = null;
    });
    _saveOfflineState();
    if (feedback != null) _showNotice(feedback);
  }

  void _resetToSuggestedSplit() {
    FocusScope.of(context).unfocus();
    _sessionKey = null;
    _sessionBaseAlloc = null;
    setState(() {
      _editingAmountKey = null;
      _suggestion = null;
      for (final cat in _rizqCategories) {
        _allocations[cat.key] = cat.defaultPct;
      }
      _syncPctControllers();
    });
    _saveOfflineState();
  }

  void _rollEmergencyToInvestments() {
    final em = _allocations['emergency'] ?? 0;
    if (em <= 0) return;
    setState(() {
      final nextInv = _round1((_allocations['investments'] ?? 0) + em);
      _allocations['emergency'] = 0;
      _allocations['investments'] = nextInv;
      _suggestion = null;
      _syncPctControllers();
    });
    _saveOfflineState();
  }

  void _autoBalanceTo100() {
    final currentTotal = _sumAllocations(_allocations);
    final delta = _round1(100 - currentTotal);
    if (delta.abs() < 0.05) return;

    final unlockedCats = _rizqCategories.where((c) => !(_lockedCategories[c.key] ?? false)).toList();
    if (unlockedCats.isEmpty) {
      _showNotice('All categories are locked. Unlock at least one to auto-balance.');
      return;
    }

    if (delta > 0) {
      if (!(_lockedCategories['investments'] ?? false)) {
        final nextInv = _round1((_allocations['investments'] ?? 0) + delta);
        setState(() {
          _allocations['investments'] = nextInv;
          _suggestion = null;
          _syncPctControllers();
        });
        _saveOfflineState();
        _showNotice('Added ${_formatPct(delta)}% to Halal investments.');
        return;
      }
      final unlockedSum = unlockedCats.fold(0.0, (s, c) => s + (_allocations[c.key] ?? 0));
      final next = Map<String, double>.from(_allocations);
      double added = 0;
      for (int i = 0; i < unlockedCats.length; i++) {
        final cat = unlockedCats[i];
        if (i == unlockedCats.length - 1) {
          next[cat.key] = math.min(100.0, _round1((_allocations[cat.key] ?? 0) + (delta - added)));
        } else {
          final share = unlockedSum > 0
              ? _round1(((_allocations[cat.key] ?? 0) / unlockedSum) * delta)
              : _round1(delta / unlockedCats.length);
          next[cat.key] = math.min(100.0, _round1((_allocations[cat.key] ?? 0) + share));
          added = _round1(added + share);
        }
      }
      setState(() {
        _allocations.addAll(_capAllocationsTo100(next));
        _suggestion = null;
        _syncPctControllers();
      });
      _saveOfflineState();
      _showNotice('Distributed ${_formatPct(delta)}% across unlocked categories.');
      return;
    }

    final curLifestyle = _allocations['lifestyle'] ?? 0;
    if (!(_lockedCategories['lifestyle'] ?? false) && curLifestyle + delta >= 0) {
      setState(() {
        _allocations['lifestyle'] = _round1(curLifestyle + delta);
        _suggestion = null;
        _syncPctControllers();
      });
      _saveOfflineState();
      return;
    }

    double lockedSum = 0;
    for (final c in _rizqCategories) {
      if (_lockedCategories[c.key] ?? false) lockedSum += _allocations[c.key] ?? 0;
    }
    lockedSum = _round1(lockedSum);
    final targetUnlockedSum = _round1(100 - lockedSum);
    final unlockedCurSum = unlockedCats.fold(0.0, (s, c) => s + (_allocations[c.key] ?? 0));
    if (targetUnlockedSum < 0 || unlockedCurSum <= 0) {
      _showNotice('Unlock a category to balance back to 100%.');
      return;
    }

    final next = Map<String, double>.from(_allocations);
    double running = 0;
    for (int i = 0; i < unlockedCats.length; i++) {
      final cat = unlockedCats[i];
      if (i == unlockedCats.length - 1) {
        next[cat.key] = math.max(0.0, _round1(targetUnlockedSum - running));
      } else {
        final val = _round1(((_allocations[cat.key] ?? 0) / unlockedCurSum) * targetUnlockedSum);
        next[cat.key] = val;
        running = _round1(running + val);
      }
    }
    setState(() {
      _allocations.addAll(next);
      _suggestion = null;
      _syncPctControllers();
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
    final baseAlloc = Map<String, double>.from(_allocations);
    final res = _rebalanceWithCap(baseAlloc, 'housing', _recommendedHousingPct);
    setState(() {
      _allocations.addAll(res.allocations);
      _syncPctControllers();
      _suggestion = _buildSuggestion(baseAlloc, 'housing', _allocations);
    });
    _saveOfflineState();
    _showNotice(
      'Housing share updated to ${_formatPct(res.finalTargetPct)}% (${_ngnFormatter.format(((_income * res.finalTargetPct) / 100).round())}/mo).',
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

  Widget? _buildSuggestionBanner(BuildContext context) {
    final sugg = _suggestion;
    if (sugg == null) return null;
    final targetCat = _rizqCategories.firstWhere(
      (c) => c.key == sugg.targetKey,
      orElse: () => _rizqCategories.first,
    );

    final actions = <_RizqSuggestionAction>[];
    if (sugg.trimmed.isNotEmpty) {
      final propRes = _rebalanceWithCap(sugg.baseAlloc, sugg.targetKey, sugg.toPct, mode: 'proportional');
      final differs = _rizqCategories.any(
        (c) => ((propRes.allocations[c.key] ?? 0) - (_allocations[c.key] ?? 0)).abs() >= 0.1,
      );
      if (differs) {
        actions.add(_RizqSuggestionAction(
          id: 'prop-trim',
          label: 'Split cut evenly across unlocked',
          nextAlloc: propRes.allocations,
          toast: 'Spread adjustment evenly across unlocked categories.',
        ));
      }

      final soleSource = sugg.trimmed.length == 1 ? sugg.trimmed.first.key : null;
      final candidates = _rizqCategories
          .where((c) =>
              c.key != sugg.targetKey &&
              c.key != soleSource &&
              !(_lockedCategories[c.key] ?? false) &&
              (sugg.baseAlloc[c.key] ?? 0) > 0)
          .toList()
        ..sort((a, b) => (sugg.baseAlloc[b.key] ?? 0).compareTo(sugg.baseAlloc[a.key] ?? 0));

      for (final cand in candidates.take(2)) {
        final res = _rebalanceWithCap(sugg.baseAlloc, sugg.targetKey, sugg.toPct, sourceKey: cand.key);
        final fromVal = sugg.baseAlloc[cand.key] ?? 0;
        final toVal = res.allocations[cand.key] ?? 0;
        if (toVal < fromVal) {
          actions.add(_RizqSuggestionAction(
            id: 'src-${cand.key}',
            label: 'Take from ${cand.label.split(' ').first} (${_formatPct(fromVal)}% → ${_formatPct(toVal)}%)',
            nextAlloc: res.allocations,
            toast: 'Adjusted ${cand.label} (${_formatPct(fromVal)}% → ${_formatPct(toVal)}%) instead.',
          ));
        }
      }
    } else if (sugg.remaining >= 0.05) {
      final rem = sugg.remaining;
      final targets = <_RizqCategory>[];
      if (sugg.targetKey != 'investments' && !(_lockedCategories['investments'] ?? false)) {
        targets.add(_rizqCategories.firstWhere((c) => c.key == 'investments'));
      }
      if (sugg.targetKey != 'emergency' && !(_lockedCategories['emergency'] ?? false)) {
        targets.add(_rizqCategories.firstWhere((c) => c.key == 'emergency'));
      }
      if (targets.length < 2) {
        for (final c in _rizqCategories) {
          if (targets.length >= 2) break;
          if (c.key != sugg.targetKey && !(_lockedCategories[c.key] ?? false) && !targets.any((t) => t.key == c.key)) {
            targets.add(c);
          }
        }
      }

      for (final dest in targets) {
        final cur = _allocations[dest.key] ?? 0;
        final nextVal = math.min(100.0, _round1(cur + rem));
        final actualAdd = _round1(nextVal - cur);
        if (actualAdd >= 0.05) {
          final nextMap = Map<String, double>.from(_allocations)..[dest.key] = nextVal;
          actions.add(_RizqSuggestionAction(
            id: 'boost-${dest.key}',
            label: '+${_formatPct(actualAdd)}% → ${dest.label} (${_formatPct(cur)}% → ${_formatPct(nextVal)}%)',
            nextAlloc: nextMap,
            toast: 'Added +${_formatPct(actualAdd)}% to ${dest.label}.',
          ));
        }
      }

      final unlockedOthers = _rizqCategories
          .where((c) => c.key != sugg.targetKey && !(_lockedCategories[c.key] ?? false))
          .toList();
      if (unlockedOthers.length >= 2) {
        final unlockedSum = unlockedOthers.fold(0.0, (s, c) => s + (_allocations[c.key] ?? 0));
        final spread = Map<String, double>.from(_allocations);
        double distributed = 0;
        for (int i = 0; i < unlockedOthers.length; i++) {
          final c = unlockedOthers[i];
          final cur = _allocations[c.key] ?? 0;
          if (i == unlockedOthers.length - 1) {
            spread[c.key] = math.min(100.0, _round1(cur + (rem - distributed)));
          } else {
            final share = unlockedSum > 0 ? _round1((cur / unlockedSum) * rem) : _round1(rem / unlockedOthers.length);
            spread[c.key] = math.min(100.0, _round1(cur + share));
            distributed = _round1(distributed + share);
          }
        }
        actions.add(_RizqSuggestionAction(
          id: 'spread-freed',
          label: 'Split +${_formatPct(rem)}% across unlocked',
          nextAlloc: _capAllocationsTo100(spread),
          toast: 'Distributed +${_formatPct(rem)}% across unlocked categories.',
        ));
      }
    }

    final isTrimBanner = sugg.trimmed.isNotEmpty;
    final trimmedDesc = sugg.trimmed
        .map((t) => '${t.label} (${_formatPct(t.from)}% → ${_formatPct(t.to)}%)')
        .join(', ');

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isTrimBanner ? context.primary.withValues(alpha: 0.08) : context.bgSection,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isTrimBanner ? context.primary : context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: TextStyle(fontSize: 12, height: 1.4, color: context.textDark),
                    children: isTrimBanner
                        ? [
                            TextSpan(
                              text: 'Capped at 100%: ',
                              style: TextStyle(fontWeight: FontWeight.w800, color: context.primary),
                            ),
                            const TextSpan(text: 'Adjusted '),
                            TextSpan(text: trimmedDesc, style: const TextStyle(fontWeight: FontWeight.w700)),
                            TextSpan(
                              text: ' when raising ${targetCat.label} (${_formatPct(sugg.fromPct)}% → ${_formatPct(sugg.toPct)}%).',
                            ),
                          ]
                        : [
                            TextSpan(
                              text: '+${_formatPct(sugg.remaining)}% (${_ngnFormatter.format(((_income * sugg.remaining) / 100).round())}) free: ',
                              style: TextStyle(fontWeight: FontWeight.w800, color: context.primary),
                            ),
                            TextSpan(
                              text: 'Lowered ${targetCat.label} (${_formatPct(sugg.fromPct)}% → ${_formatPct(sugg.toPct)}%). Adjust another bucket:',
                            ),
                          ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () => _applySuggestionVariant(sugg.baseAlloc, 'Reverted last allocation change.'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  minimumSize: const Size(0, 26),
                  side: BorderSide(color: context.divider),
                  backgroundColor: context.bg,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('Undo', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.textDark)),
              ),
              const SizedBox(width: 4),
              InkWell(
                borderRadius: BorderRadius.circular(6),
                onTap: () => setState(() => _suggestion = null),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.close_rounded, size: 16, color: context.textMuted),
                ),
              ),
            ],
          ),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: actions.map((act) {
                return GestureDetector(
                  onTap: () => _applySuggestionVariant(act.nextAlloc, act.toast),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: context.divider),
                    ),
                    child: Text(
                      act.label,
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: context.textDark),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalPct = _totalPct;
    final plannedTotal = (_income * totalPct) / 100;
    final wealthPct = _wealthPct;
    final wealthNgn = (_income * wealthPct) / 100;
    final isExact100 = (totalPct - 100).abs() < 0.05;
    final diffPct = ((100 - totalPct).abs() * 10).roundToDouble() / 10;
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

                const SizedBox(height: 18),

                // Smart Adjustment Suggestions Banner
                ?_buildSuggestionBanner(context),

                // 8 Category Rows
                ..._rizqCategories.map((cat) {
                  final pct = _allocations[cat.key] ?? 0;
                  final amount = (_income * pct) / 100;
                  final isHighlighted = _activeKey == cat.key;
                  final isMoved = _checkedCategories[cat.key] == true;
                  final isLocked = _lockedCategories[cat.key] == true;
                  final isEditingAmt = _editingAmountKey == cat.key;

                  double lockedOtherSum = 0;
                  for (final other in _rizqCategories) {
                    if (other.key != cat.key && (_lockedCategories[other.key] ?? false)) {
                      lockedOtherSum += _allocations[other.key] ?? 0;
                    }
                  }
                  final maxAllowedForRow = math.max(0.0, _round1(100 - lockedOtherSum));

                  return InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => setState(() => _activeKey = isHighlighted ? null : cat.key),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(4, 10, 4, 8),
                      decoration: BoxDecoration(
                        color: isHighlighted ? context.bgSection : Colors.transparent,
                        border: Border(bottom: BorderSide(color: context.divider)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => _togglePaydayEnvelope(cat.key),
                                child: Container(
                                  width: 20,
                                  height: 20,
                                  margin: const EdgeInsets.only(right: 10),
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
                                        fontSize: 13.5,
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
                              IconButton(
                                onPressed: () => _toggleLockCategory(cat.key),
                                tooltip: isLocked ? 'Unlock bucket' : 'Pin bucket during auto-balance',
                                padding: const EdgeInsets.all(6),
                                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                                style: IconButton.styleFrom(
                                  backgroundColor: isLocked ? context.questionableBg : Colors.transparent,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                icon: Icon(
                                  isLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
                                  size: 15,
                                  color: isLocked ? context.questionable : context.textMuted.withValues(alpha: 0.55),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.only(left: 30),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: context.bgSection,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: context.divider),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      InkWell(
                                        borderRadius: BorderRadius.circular(7),
                                        onTap: pct <= 0 ? null : () => _stepPct(cat.key, -1),
                                        child: Padding(
                                          padding: const EdgeInsets.all(5),
                                          child: Icon(
                                            Icons.remove_rounded,
                                            size: 14,
                                            color: pct <= 0 ? context.textDisabled : context.textMuted,
                                          ),
                                        ),
                                      ),
                                      SizedBox(
                                        width: 44,
                                        child: TextField(
                                          controller: _pctControllers[cat.key],
                                          focusNode: _pctFocusNodes[cat.key],
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
                                            contentPadding: EdgeInsets.symmetric(vertical: 4),
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.only(left: 2, right: 4),
                                        child: Text(
                                          '%',
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted),
                                        ),
                                      ),
                                      InkWell(
                                        borderRadius: BorderRadius.circular(7),
                                        onTap: pct >= maxAllowedForRow ? null : () => _stepPct(cat.key, 1),
                                        child: Padding(
                                          padding: const EdgeInsets.all(5),
                                          child: Icon(
                                            Icons.add_rounded,
                                            size: 14,
                                            color: pct >= maxAllowedForRow ? context.textDisabled : context.textMuted,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isEditingAmt)
                                  Container(
                                    width: 120,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: context.bgSection,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: context.primary),
                                    ),
                                    child: Row(
                                      children: [
                                        Text('₦', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted)),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: TextField(
                                            controller: _amountController,
                                            focusNode: _amountFocusNode,
                                            keyboardType: TextInputType.number,
                                            textAlign: TextAlign.right,
                                            onChanged: (val) => _onAmountChanged(cat.key, val),
                                            onSubmitted: (_) => _commitAmountEdit(),
                                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark),
                                            decoration: const InputDecoration(
                                              isDense: true,
                                              border: InputBorder.none,
                                              enabledBorder: InputBorder.none,
                                              focusedBorder: InputBorder.none,
                                              filled: false,
                                              contentPadding: EdgeInsets.symmetric(vertical: 5),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                else
                                  GestureDetector(
                                    onTap: () => _startAmountEdit(cat.key, amount),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: context.bgSection,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
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
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(999),
                            child: LinearProgressIndicator(
                              value: (pct / 100).clamp(0.0, 1.0),
                              minHeight: 2.5,
                              backgroundColor: Colors.transparent,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                cat.color.withValues(alpha: isMoved ? 0.35 : 0.72),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),

                const SizedBox(height: 14),

                // Summary Bar + Live Balance Chip
                Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  runSpacing: 8,
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
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (!isExact100)
                          GestureDetector(
                            onTap: _autoBalanceTo100,
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                              decoration: BoxDecoration(
                                color: totalPct > 100 ? context.haramBg : context.questionableBg,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                totalPct > 100
                                    ? '${_formatPct(totalPct)}% · Balance'
                                    : '${_formatPct(totalPct)}% (${_formatPct(diffPct)}% left) · Balance',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: totalPct > 100 ? context.haram : context.questionable,
                                ),
                              ),
                            ),
                          )
                        else
                          Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: context.halalBg,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '100%',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.halal),
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
