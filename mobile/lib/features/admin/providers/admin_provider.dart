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

  bool _isLoadingFinances = false;
  bool get isLoadingFinances => _isLoadingFinances;

  String? _financesError;
  String? get financesError => _financesError;

  Map<String, dynamic> _financesSummary = {};
  Map<String, dynamic> get financesSummary => _financesSummary;

  Map<String, dynamic> _financesCharts = {};
  Map<String, dynamic> get financesCharts => _financesCharts;

  List<Map<String, dynamic>> _financesTransactions = [];
  List<Map<String, dynamic>> get financesTransactions => _financesTransactions;

  int _financesPage = 1;
  int get financesPage => _financesPage;

  int _financesLastPage = 1;
  int get financesLastPage => _financesLastPage;

  Future<void> fetchFinances({
    int page = 1,
    String search = '',
    String status = 'all',
    String type = 'all',
    String plan = 'all',
  }) async {
    _isLoadingFinances = true;
    _financesError = null;
    notifyListeners();
    try {
      final params = <String, dynamic>{'page': page, 'per_page': 20};
      if (search.trim().isNotEmpty) params['search'] = search.trim();
      if (status != 'all') params['status'] = status;
      if (type != 'all') params['type'] = type;
      if (plan != 'all') params['plan'] = plan;

      final response = await _api.get('admin/finances', queryParameters: params);
      final data = response.data as Map<String, dynamic>? ?? {};

      _financesSummary = Map<String, dynamic>.from(data['summary'] ?? {});
      _financesCharts = Map<String, dynamic>.from(data['charts'] ?? {});

      final pager = data['transactions'] as Map<String, dynamic>? ?? {};
      _financesPage = (pager['current_page'] as num?)?.toInt() ?? 1;
      _financesLastPage = (pager['last_page'] as num?)?.toInt() ?? 1;
      final rawList = pager['data'] as List? ?? [];
      _financesTransactions = rawList
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    } catch (e) {
      debugPrint('Error fetching admin finances: $e');
      _financesError = 'Unable to load payment records.';
    } finally {
      _isLoadingFinances = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> verifyFinanceTransaction(int id) async {
    try {
      final response = await _api.post('admin/finances/$id/verify', {});
      final data = response.data is Map ? Map<String, dynamic>.from(response.data) : <String, dynamic>{};
      return data;
    } catch (e) {
      debugPrint('Error verifying finance transaction $id: $e');
      rethrow;
    }
  }

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
