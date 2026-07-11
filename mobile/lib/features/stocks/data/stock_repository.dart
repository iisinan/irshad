import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StockRepository {
  final ApiService _apiService = ApiService();

  int _getNext3AM() {
    final now = DateTime.now();
    DateTime next3AM = DateTime(now.year, now.month, now.day, 3, 0, 0);
    if (now.isAfter(next3AM)) {
      next3AM = next3AM.add(const Duration(days: 1));
    }
    return next3AM.millisecondsSinceEpoch;
  }

  Future<List<Map<String, dynamic>>> searchStocks(String query) async {
    try {
      final response = await _apiService.get('stocks/search?q=$query');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<Map<String, dynamic>?> getStockDetails(String symbol) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = 'irshad_stock_${symbol}_cache_v2';
      final cachedStr = prefs.getString(cacheKey);
      if (cachedStr != null) {
        final cachedData = jsonDecode(cachedStr);
        final expiry = cachedData['expiry'] as int;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          final data = Map<String, dynamic>.from(cachedData['data']);
          await _cacheStock(data);
          return data;
        }
      }

      final response = await _apiService.get('stocks/$symbol');
      if (response.statusCode == 200) {
        final data = response.data['data'];
        await prefs.setString(cacheKey, jsonEncode({
          'data': data,
          'expiry': _getNext3AM(),
        }));
        await _cacheStock(data);
        return data;
      }
    } on DioException catch (e) {
       throw e.response?.data['message'] ?? 'Failed to fetch stock details';
    }
    return null;
  }

  Future<Map<String, dynamic>?> checkStock(String symbol) async {
    try {
      final response = await _apiService.get('stocks/check/$symbol');
      if (response.statusCode == 200) {
        return response.data['data'];
      }
    } on DioException catch (e) {
       throw e.response?.data['message'] ?? 'Screening failed';
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> getNgxStocks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = 'irshad_stocks_cache_v2';
      final cachedStr = prefs.getString(cacheKey);
      if (cachedStr != null) {
        final cachedData = jsonDecode(cachedStr);
        final expiry = cachedData['expiry'] as int;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          return List<Map<String, dynamic>>.from(cachedData['data']);
        }
      }

      final response = await _apiService.get('stocks/ngx');
      if (response.statusCode == 200) {
        final dataList = List<Map<String, dynamic>>.from(response.data['data']);
        await prefs.setString(cacheKey, jsonEncode({
          'data': dataList,
          'expiry': _getNext3AM(),
        }));
        return dataList;
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<void> _cacheStock(Map<String, dynamic> stock) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> history = prefs.getStringList('stock_history') ?? [];
    
    history.removeWhere((item) => jsonDecode(item)['symbol'] == stock['symbol']);
    history.insert(0, jsonEncode(stock));
    
    if (history.length > 20) history = history.sublist(0, 20);
    
    await prefs.setStringList('stock_history', history);
  }

  Future<List<Map<String, dynamic>>> getStockHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList('stock_history') ?? [];
    return history.map((item) => Map<String, dynamic>.from(jsonDecode(item))).toList();
  }

  Future<String?> fetchAiAnalysis(String symbol) async {
    try {
      final response = await _apiService.get('stocks/$symbol/analysis');
      if (response.statusCode == 200) {
        return response.data['data']['analysis'];
      }
    } on DioException catch (e) {
       throw e.response?.data['message'] ?? 'Failed to fetch AI analysis';
    }
    return null;
  }

  Future<Map<String, dynamic>?> updateStockStatus(String symbol, String status, String reason) async {
    try {
      final response = await _apiService.put('stocks/$symbol/status', {
        'status': status,
        'reason': reason,
      });
      if (response.statusCode == 200) {
        return response.data['data'];
      }
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Failed to update status';
    }
    return null;
  }
}
