import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StockRepository {
  final ApiService _apiService = ApiService();

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
      final response = await _apiService.get('stocks/$symbol');
      if (response.statusCode == 200) {
        final data = response.data['data'];
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
}
