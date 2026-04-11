import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';

class UserActivityRepository {
  final ApiService _apiService = ApiService();

  Future<List<Map<String, dynamic>>> getFavorites() async {
    try {
      final response = await _apiService.get('favorites');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<bool> addToFavorites(String type, int referenceId) async {
    try {
      final response = await _apiService.post('favorites', {
        'type': type,
        'reference_id': referenceId,
      });
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeFromFavorites(String type, int referenceId) async {
    try {
      final response = await _apiService.dio.delete('favorites', data: {
        'type': type,
        'reference_id': referenceId,
      });
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getHistory({String? action}) async {
    try {
      final path = action != null ? '/history?action=$action' : '/history';
      final response = await _apiService.get(path.startsWith('/') ? path.substring(1) : path);
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']['history']);
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<void> trackAction(String action, String referenceId) async {
    try {
      await _apiService.post('history', {
        'action': action,
        'reference_id': referenceId,
      });
    } catch (e) {
      // Silent error
    }
  }
}
