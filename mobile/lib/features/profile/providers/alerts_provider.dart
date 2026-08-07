import 'package:flutter/foundation.dart';
import '../../../core/api/api_service.dart';

class AlertsProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Map<String, dynamic>> _alerts = [];
  List<Map<String, dynamic>> get alerts => _alerts;

  Future<void> fetchAlerts() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.get('alerts');
      _alerts = List<Map<String, dynamic>>.from(response.data['alerts'] ?? []);
    } catch (e) {
      debugPrint('Error fetching alerts: $e');
      // Fallback for demo
      _alerts = [
        {'id': 1, 'symbol': 'MTNN', 'type': 'Price', 'condition': 'Above', 'value': 250.00, 'active': true},
        {'id': 2, 'symbol': 'ZENITHBANK', 'type': 'Compliance', 'condition': 'Status Change', 'value': null, 'active': true},
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleAlert(int alertId, bool isActive) async {
    final index = _alerts.indexWhere((a) => a['id'] == alertId);
    if (index != -1) {
      _alerts[index]['active'] = isActive;
      notifyListeners();
      try {
        await _api.put('alerts/$alertId', {'active': isActive});
      } catch (e) {
        debugPrint('Error toggling alert: $e');
        // Revert on error
        _alerts[index]['active'] = !isActive;
        notifyListeners();
      }
    }
  }
}
