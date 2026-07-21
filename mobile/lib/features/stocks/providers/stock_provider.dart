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
  int _currentPage = 1;
  int _lastPage = 1;

  List<Map<String, dynamic>> get ngxStocks => _ngxStocks;
  bool get isLoading => _isLoading;
  String? get error => _error;

  StockProvider() {
    _loadCachedData();
  }

  Future<void> _loadCachedData() async {
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get('ngx_stocks_v7');
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
      if (_currentPage > _lastPage) return; // Reached end
    } else {
      _currentPage = 1;
      _ngxStocks.clear();
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Modify repository to pass page
      final response = await _repository.getNgxStocksPaginated(_currentPage);
      
      final List newStocks = response['data'] ?? [];
      _lastPage = response['last_page'] ?? 1;

      final validStocks = newStocks.where((s) {
        final priceStr = s['latest_price']?.toString() ?? '0';
        final price = double.tryParse(priceStr) ?? 0.0;
        return price > 0.0;
      }).map((s) => Map<String, dynamic>.from(s)).toList();

      if (validStocks.isNotEmpty) {
        _ngxStocks.addAll(validStocks);
        _currentPage++;
        
        // Only cache the first page for fast initial load
        if (!loadMore) {
          try {
            final box = await Hive.openBox(_boxName);
            final cacheWrapper = {
              'data': _ngxStocks,
              'expiry': _getNext3AM(),
            };
            await box.put('ngx_stocks_v8', jsonEncode(cacheWrapper));
          } catch (e) {
            // ignore
          }
        }
      } else if (!loadMore) {
        _error = "No stocks available.";
      }
    } catch (e) {
      if (!loadMore) _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getStockDetails(String symbol) async {
    try {
      final box = await Hive.openBox(_boxName);
      final cachedStr = box.get('details_v6_$symbol');
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
        await box.put('details_v6_$symbol', jsonEncode(cacheWrapper));
      } catch (e) {
        // ignore
      }
    }
    return data;
  }
}
