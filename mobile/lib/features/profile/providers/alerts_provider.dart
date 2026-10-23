import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import '../../../core/api/api_service.dart';

class AlertsProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Map<String, dynamic>> _alerts = [];
  List<Map<String, dynamic>> get alerts => _alerts;

  Future<void> _syncAlertSymbolsToHive() async {
    try {
      final symbols = _alerts
          .where((a) => a['active'] == true)
          .map((a) => (a['symbol'] ?? '').toString().toUpperCase().trim())
          .where((s) => s.isNotEmpty)
          .toSet()
          .toList();
      final box = await Hive.openBox('updatesBox');
      await box.put('user_alert_symbols', symbols);
    } catch (_) {}
  }

  Future<void> fetchAlerts() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.get('alerts');
      final dynamic raw = response.data['data'] ?? response.data['alerts'] ?? [];
      if (raw is List) {
        _alerts = raw.map<Map<String, dynamic>>((a) {
          final map = Map<String, dynamic>.from(a as Map);
          return {
            'id': map['id'],
            'symbol': map['symbol'] ?? '',
            'type': map['type'] ?? 'Price',
            'condition': map['condition']?.toString() ?? 'Target',
            'value': map['value'] ?? map['target_price'],
            'active': map['active'] ?? map['is_active'] ?? true,
          };
        }).toList();
      } else {
        _alerts = [];
      }
      await _syncAlertSymbolsToHive();
    } catch (e) {
      debugPrint('Error fetching alerts: $e');
      _alerts = [];
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
      await _syncAlertSymbolsToHive();
      try {
        await _api.put('alerts/$alertId', {'active': isActive});
      } catch (e) {
        debugPrint('Error toggling alert: $e');
        // Revert on error
        _alerts[index]['active'] = !isActive;
        notifyListeners();
        await _syncAlertSymbolsToHive();
      }
    }
  }

  Future<void> deleteAlert(int alertId) async {
    final index = _alerts.indexWhere((a) => a['id'] == alertId);
    if (index != -1) {
      final removed = _alerts.removeAt(index);
      notifyListeners();
      await _syncAlertSymbolsToHive();
      try {
        await _api.delete('alerts/$alertId');
      } catch (e) {
        debugPrint('Error deleting alert: $e');
        _alerts.insert(index, removed);
        notifyListeners();
        await _syncAlertSymbolsToHive();
      }
    }
  }
}
