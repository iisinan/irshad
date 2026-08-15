import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import '../../../../core/api/api_service.dart';

class PortfolioProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _error;
  bool _isGuest = false;
  
  Map<String, dynamic> _summary = {
    'total_balance': 0.0,
    'purification_due': 0.0,
    'health_percentage': 100.0,
  };
  List<dynamic> _holdings = [];

  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isGuest => _isGuest;
  Map<String, dynamic> get summary => _summary;
  List<dynamic> get holdings => _holdings;

  PortfolioProvider() {
    fetchPortfolio();
  }

  Future<void> fetchPortfolio() async {
    const storage = FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
    final token = await storage.read(key: 'access_token');
    
    if (token == null) {
      _isGuest = true;
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    _isGuest = false;
    
    // 1. Load instantly from cache
    try {
      final box = await Hive.openBox('portfolioBox');
      final cachedStr = box.get('portfolio_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final int expiry = cached['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          final data = cached['data'];
          _summary = Map<String, dynamic>.from(data['summary'] ?? {});
          _holdings = List<dynamic>.from(data['holdings'] ?? []);
          _isLoading = false;
          notifyListeners();
        }
      }
    } catch (_) {}

    if (_isLoading) notifyListeners(); // only notify if we didn't just notify from cache

    // 2. Fetch live data silently
    try {
      final response = await ApiService().get('portfolio');
      if (response.data['status'] == 'success') {
        final summaryData = response.data['data']['summary'] ?? {};
        _summary = {
          'total_balance': num.tryParse(summaryData['total_balance']?.toString() ?? '0')?.toDouble() ?? 0.0,
          'cash_balance': num.tryParse(summaryData['cash_balance']?.toString() ?? '0')?.toDouble() ?? 0.0,
          'purification_due': num.tryParse(summaryData['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0,
          'health_percentage': num.tryParse(summaryData['health_percentage']?.toString() ?? '100')?.toDouble() ?? 100.0,
        };
        _holdings = response.data['data']['holdings'] ?? [];
        
        // Save to cache
        try {
          final box = await Hive.openBox('portfolioBox');
          await box.put('portfolio_data', jsonEncode({
            'data': response.data['data'],
            'expiry': DateTime.now().add(const Duration(minutes: 30)).millisecondsSinceEpoch
          }));
        } catch (_) {}
      } else {
        if (_holdings.isEmpty) _error = response.data['message'] ?? 'Failed to fetch portfolio';
      }
    } catch (e) {
      if (_holdings.isEmpty) _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> linkBroker(String brokerName) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService().post('broker/link', {
        'broker_name': brokerName,
      });

      if (response.data['status'] == 'success') {
        await fetchPortfolio();
        return true;
      } else {
        _error = response.data['message'] ?? 'Failed to link broker';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> executeTrade(String symbol, int shares) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService().post('portfolio/trade', {
        'symbol': symbol,
        'shares': shares,
      });

      if (response.data['status'] == 'success') {
        await fetchPortfolio(); // Refresh portfolio after trade
        return true;
      } else {
        _error = response.data['message'] ?? 'Trade failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> bulkAddHoldings(List<Map<String, dynamic>> holdings) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService().post('portfolio/bulk', {
        'holdings': holdings,
      });

      if (response.data['status'] == 'success') {
        await fetchPortfolio(); 
        return true;
      } else {
        _error = response.data['message'] ?? 'Failed to add holdings';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  Future<bool> updateHolding(int id, double shares, double averageBuyPrice) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService().put('portfolio/$id', {
        'shares': shares,
        'average_buy_price': averageBuyPrice,
      });

      if (response.data['status'] == 'success') {
        await fetchPortfolio();
        return true;
      } else {
        _error = response.data['message'] ?? 'Failed to update holding';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateZakatDate(String date) async {
    try {
      final response = await ApiService().put('profile', {
        'preferences': {'zakat_hawl_date': date}
      });
      return response.data['status'] == 'success';
    } catch (e) {
      debugPrint('Failed to update zakat date: $e');
      return false;
    }
  }


  void clear() {
    _summary = {
      'total_balance': 0.0,
      'purification_due': 0.0,
      'health_percentage': 100.0,
    };
    _holdings = [];
    _error = null;
    _isGuest = true;
    notifyListeners();
  }
}
