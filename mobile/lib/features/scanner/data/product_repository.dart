import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class ProductRepository {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>?> scanBarcode(String barcode) async {
    try {
      final response = await _apiService.post('scan', {'barcode': barcode});
      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _cacheProduct(data);
        return data;
      }
    } on DioException catch (e) {
       throw e.response?.data['message'] ?? 'Scanning failed';
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> searchProducts(String query) async {
    try {
      final response = await _apiService.get('products/search?q=$query');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<void> _cacheProduct(Map<String, dynamic> product) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> history = prefs.getStringList('scan_history') ?? [];
    
    // Add to history and keep unique
    history.removeWhere((item) => jsonDecode(item)['barcode'] == product['barcode']);
    history.insert(0, jsonEncode(product));
    
    // Limit to 20 items
    if (history.length > 20) history = history.sublist(0, 20);
    
    await prefs.setStringList('scan_history', history);
  }

  Future<List<Map<String, dynamic>>> getScanHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList('scan_history') ?? [];
    return history.map((item) => Map<String, dynamic>.from(jsonDecode(item))).toList();
  }
}
