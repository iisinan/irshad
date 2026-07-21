import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import '../models/basket.dart';

class BasketRepository {
  final ApiService _apiService = ApiService();

  Future<List<Basket>> fetchBaskets() async {
    try {
      final response = await _apiService.get('stocks/baskets');
      if (response.statusCode == 200) {
        final data = response.data['data'] as List;
        return data.map((json) => Basket.fromJson(json)).toList();
      }
    } catch (e) {
      // Handle error implicitly by returning empty list
    }
    return [];
  }

  Future<Map<String, dynamic>> investInBasket(int basketId, double amount) async {
    try {
      final response = await _apiService.post('stocks/baskets/$basketId/invest', {
        'amount': amount,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': response.data['data'], 'message': response.data['message']};
      }
      return {'success': false, 'message': 'Unknown error occurred'};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Failed to invest in basket',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
