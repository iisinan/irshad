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

  Future<bool> addToFavorites(String type, int referenceId, {bool alertWhatsapp = false, bool alertEmail = false}) async {
    try {
      final response = await _apiService.post('favorites', {
        'type': type,
        'reference_id': referenceId,
        'alert_whatsapp': alertWhatsapp,
        'alert_email': alertEmail,
      });
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateFavoriteAlerts(int favoriteId, bool alertWhatsapp, bool alertEmail) async {
    try {
      final response = await _apiService.put('favorites/$favoriteId', {
        'alert_whatsapp': alertWhatsapp,
        'alert_email': alertEmail,
      });
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeFromFavorites(int favoriteId) async {
    try {
      final response = await _apiService.delete('favorites/$favoriteId');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Watchlist Methods (Stocks)
  Future<List<Map<String, dynamic>>> getWatchlist() async {
    try {
      final response = await _apiService.get('watchlist');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      // Handle error
    }
    return [];
  }

  Future<bool> addToWatchlist(String symbol, {Map<String, bool>? alerts}) async {
    try {
      final body = {
        'symbol': symbol,
        if (alerts != null) ...alerts,
      };
      final response = await _apiService.post('watchlist', body);
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> addMultipleToWatchlist(List<String> symbols, {bool alertInApp = false, bool alertPush = false, bool alertEmail = false}) async {
    try {
      final response = await _apiService.post('watchlist/bulk', {
        'symbols': symbols,
        'alert_inapp': alertInApp,
        'alert_push': alertPush,
        'alert_email': alertEmail,
      });
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateWatchlistAlerts(String symbol, Map<String, bool> alerts) async {
    try {
      final response = await _apiService.put('watchlist/$symbol', alerts);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeFromWatchlist(String symbol) async {
    try {
      final response = await _apiService.delete('watchlist/$symbol');
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
