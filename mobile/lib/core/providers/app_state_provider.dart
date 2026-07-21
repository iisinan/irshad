import 'package:flutter/material.dart';
import '../../features/auth/data/auth_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppStateProvider extends ChangeNotifier {
  final AuthRepository _authRepository = AuthRepository();
  Map<String, dynamic>? _userProfile;
  int _watchlistCount = 0;
  bool _isAuthenticated = false;
  ThemeMode _themeMode = ThemeMode.light;

  Map<String, dynamic>? get userProfile => _userProfile;
  int get watchlistCount => _watchlistCount;
  bool get isAuthenticated => _isAuthenticated;
  ThemeMode get themeMode => _themeMode;

  Future<void> loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    final String? themeStr = prefs.getString('theme_mode');
    if (themeStr == 'dark') _themeMode = ThemeMode.dark;
    else if (themeStr == 'system') _themeMode = ThemeMode.system;
    else _themeMode = ThemeMode.light;
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    if (mode == ThemeMode.light) await prefs.setString('theme_mode', 'light');
    else if (mode == ThemeMode.dark) await prefs.setString('theme_mode', 'dark');
    else await prefs.setString('theme_mode', 'system');
    notifyListeners();
  }

  Future<void> loadProfile() async {
    final profile = await _authRepository.getProfile();
    if (profile != null) {
      _userProfile = profile;
      _isAuthenticated = true;
      notifyListeners();
    }
  }

  void setUserProfile(Map<String, dynamic> profile) {
    _userProfile = profile;
    notifyListeners();
  }

  void setWatchlistCount(int count) {
    _watchlistCount = count;
    notifyListeners();
  }

  void incrementWatchlist() {
    _watchlistCount++;
    notifyListeners();
  }

  void decrementWatchlist() {
    if (_watchlistCount > 0) {
      _watchlistCount--;
      notifyListeners();
    }
  }

  void setAuthenticated(bool isAuth) {
    _isAuthenticated = isAuth;
    notifyListeners();
  }
}
