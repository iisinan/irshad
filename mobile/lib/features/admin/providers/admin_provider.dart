import 'package:flutter/foundation.dart';
import '../../../core/api/api_service.dart';

class AdminProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> get users => _users;

  List<Map<String, dynamic>> _complianceQueue = [];
  List<Map<String, dynamic>> get complianceQueue => _complianceQueue;

  List<Map<String, dynamic>> _tickers = [];
  List<Map<String, dynamic>> get tickers => _tickers;

  Map<String, dynamic> _zakatSettings = {'goldPrice': 125000.0, 'silverPrice': 1500.0};
  Map<String, dynamic> get zakatSettings => _zakatSettings;

  Future<void> fetchUsers() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.get('admin/users');
      _users = List<Map<String, dynamic>>.from(response.data['users'] ?? []);
    } catch (e) {
      debugPrint('Error fetching admin users: $e');
      // Fallback for demo
      _users = [
        {'name': 'Jane Doe', 'email': 'jane@example.com', 'role': 'Admin', 'status': 'Active'},
        {'name': 'John Smith', 'email': 'john@example.com', 'role': 'User', 'status': 'Active'},
        {'name': 'Ahmed Ali', 'email': 'ahmed@example.com', 'role': 'User', 'status': 'Suspended'},
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchComplianceQueue() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.get('admin/compliance');
      _complianceQueue = List<Map<String, dynamic>>.from(response.data['queue'] ?? []);
    } catch (e) {
      debugPrint('Error fetching compliance queue: $e');
      // Fallback for demo
      _complianceQueue = [
        {'symbol': 'MTNN', 'type': 'Financial', 'status': 'Pending Review', 'date': 'Today'},
        {'symbol': 'ZENITHBANK', 'type': 'Shariah', 'status': 'Under Review', 'date': 'Yesterday'},
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTickers() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.get('admin/tickers');
      _tickers = List<Map<String, dynamic>>.from(response.data['tickers'] ?? []);
    } catch (e) {
      debugPrint('Error fetching tickers: $e');
      _tickers = [
        {'symbol': 'MTNN', 'price': 250.50, 'status': 'Active'},
        {'symbol': 'ZENITHBANK', 'price': 38.20, 'status': 'Active'},
        {'symbol': 'DANGCEM', 'price': 650.00, 'status': 'Suspended'},
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> saveZakatSettings(double goldPrice, double silverPrice) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.post('admin/zakat-settings', {'goldPrice': goldPrice, 'silverPrice': silverPrice});
      _zakatSettings = {'goldPrice': goldPrice, 'silverPrice': silverPrice};
    } catch (e) {
      debugPrint('Error saving zakat settings: $e');
      _zakatSettings = {'goldPrice': goldPrice, 'silverPrice': silverPrice};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
