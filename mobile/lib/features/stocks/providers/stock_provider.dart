import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import '../data/stock_repository.dart';

class StockProvider extends ChangeNotifier {
  final StockRepository _repository = StockRepository();
  final String _boxName = 'stocksBox';
  
  List<Map<String, dynamic>> _ngxStocks = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get ngxStocks => _ngxStocks;
  bool get isLoading => _isLoading;
  String? get error => _error;

  StockProvider() {
    _loadCachedData();
  }

  Future<void> _loadCachedData() async {
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get('ngx_stocks_v4');
      if (cachedStr != null) {
        final Map<String, dynamic> cacheWrapper = jsonDecode(cachedStr);
        final int expiry = cacheWrapper['expiry'] ?? 0;
        
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          _ngxStocks = List<Map<String, dynamic>>.from(cacheWrapper['data']);
          notifyListeners();
        } else {
          // Cache expired, fetch fresh
          fetchNgxStocks();
        }
      } else {
        fetchNgxStocks();
      }
    } catch (e) {
      // ignore
    }
    fetchNgxStocks();
  }

  int _getNext3AM() {
    final now = DateTime.now();
    var next3AM = DateTime(now.year, now.month, now.day, 3, 0, 0);
    if (now.isAfter(next3AM)) {
      next3AM = next3AM.add(const Duration(days: 1));
    }
    return next3AM.millisecondsSinceEpoch;
  }

  Future<void> fetchNgxStocks() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final stocks = await _repository.getNgxStocks();
      if (stocks.isNotEmpty) {
        _ngxStocks = stocks;
        // Cache it until next 3 AM
        try {
          final box = await Hive.openBox(_boxName);
          final cacheWrapper = {
            'data': _ngxStocks,
            'expiry': _getNext3AM(),
          };
          await box.put('ngx_stocks_v4', jsonEncode(cacheWrapper));
        } catch (e) {
          // ignore
        }
      } else {
        _error = "No stocks available.";
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getStockDetails(String symbol) async {
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get('details_v4_$symbol');
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
        final cacheWrapper = {
          'data': data,
          'expiry': _getNext3AM(),
        };
        await box.put('details_v4_$symbol', jsonEncode(cacheWrapper));
      } catch (e) {
        // ignore
      }
    }
    return data;
  }
}
