import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import '../data/stock_repository.dart';

class StockProvider extends ChangeNotifier {
  final StockRepository _repository = StockRepository();
  final String _boxName = 'stocksBox';
  static const String _cacheKey = 'ngx_stocks_v10';

  List<Map<String, dynamic>> _ngxStocks = [];
  /// True only when verdicts have been confirmed by a live server response.
  bool _verdictsConfirmed = false;
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _lastPage = 1;

  List<Map<String, dynamic>> get ngxStocks => _ngxStocks;
  bool get isLoading => _isLoading;
  /// Whether the displayed verdicts are confirmed by live data (not just cache).
  bool get verdictsConfirmed => _verdictsConfirmed;
  String? get error => _error;

  StockProvider() {
    _init();
  }

  Future<void> _init() async {
    // Step 1: Load cached skeleton instantly for fast render (prices, names, sectors)
    // but mark verdicts as UNCONFIRMED until live data arrives.
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get(_cacheKey);
      if (cachedStr != null) {
        final Map<String, dynamic> cacheWrapper = jsonDecode(cachedStr);
        final List<Map<String, dynamic>> cached =
            List<Map<String, dynamic>>.from(cacheWrapper['data'] ?? []);
        if (cached.isNotEmpty) {
          // Mark each stock's status as unconfirmed so the UI can show a pending state
          _ngxStocks = cached.map((s) {
            final copy = Map<String, dynamic>.from(s);
            copy['_verdict_pending'] = true;
            return copy;
          }).toList();
          _verdictsConfirmed = false;
          notifyListeners();
        }
      }
    } catch (_) {}

    // Step 2: Always fetch live data immediately — verdicts must be accurate.
    await fetchNgxStocks();
  }

  int _getNext3AM() {
    final now = DateTime.now();
    var next3AM = DateTime(now.year, now.month, now.day, 3, 0, 0);
    if (now.isAfter(next3AM)) {
      next3AM = next3AM.add(const Duration(days: 1));
    }
    return next3AM.millisecondsSinceEpoch;
  }

  Future<void> fetchNgxStocks({bool loadMore = false}) async {
    if (_isLoading) return;

    if (loadMore) {
      if (_currentPage > _lastPage) return;
    } else {
      _currentPage = 1;
      // Don't clear — keep the cached skeleton visible while fetching
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _repository.getNgxStocksPaginated(_currentPage);

      final List newStocks = response['data'] ?? [];
      _lastPage = response['last_page'] ?? 1;

      final validStocks = newStocks.where((s) {
        final price = double.tryParse(s['latest_price']?.toString() ?? '0') ?? 0.0;
        return price > 0.0;
      }).map((s) {
        final copy = Map<String, dynamic>.from(s);
        copy['_verdict_pending'] = false; // Live data — verdict confirmed
        return copy;
      }).toList();

      if (validStocks.isNotEmpty) {
        if (loadMore) {
          _ngxStocks.addAll(validStocks);
        } else {
          // Replace list with fresh live data (verdicts confirmed)
          _ngxStocks = validStocks;
        }
        _verdictsConfirmed = true;
        _currentPage++;

        // Cache the fresh confirmed list
        if (!loadMore) {
          try {
            final box = await Hive.openBox(_boxName);
            await box.put(
              _cacheKey,
              jsonEncode({
                'data': _ngxStocks.map((s) {
                  // Strip the runtime flag before caching
                  final copy = Map<String, dynamic>.from(s);
                  copy.remove('_verdict_pending');
                  return copy;
                }).toList(),
                'expiry': _getNext3AM(),
              }),
            );
          } catch (_) {}
        }
      } else if (!loadMore) {
        if (_ngxStocks.isEmpty) _error = 'No stocks available.';
      }
    } catch (e) {
      if (!loadMore && _ngxStocks.isEmpty) _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getStockDetails(String symbol) async {
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get('details_v8_$symbol');
      if (cachedStr != null) {
        final Map<String, dynamic> cacheWrapper = jsonDecode(cachedStr);
        final int expiry = cacheWrapper['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          return Map<String, dynamic>.from(cacheWrapper['data']);
        }
      }
      return await _fetchAndCacheDetails(symbol);
    } catch (e) {
      return await _fetchAndCacheDetails(symbol);
    }
  }

  Future<Map<String, dynamic>?> _fetchAndCacheDetails(String symbol) async {
    final data = await _repository.getStockDetails(symbol);
    if (data != null) {
      try {
        final box = await Hive.openBox(_boxName);
        await box.put(
          'details_v8_$symbol',
          jsonEncode({'data': data, 'expiry': _getNext3AM()}),
        );
      } catch (_) {}
    }
    return data;
  }
}
