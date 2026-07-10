import 'package:flutter/material.dart';
import '../../features/auth/data/auth_repository.dart';

class AppStateProvider extends ChangeNotifier {
  final AuthRepository _authRepository = AuthRepository();
  Map<String, dynamic>? _userProfile;
  int _watchlistCount = 0;
  bool _isAuthenticated = false;

  Map<String, dynamic>? get userProfile => _userProfile;
  int get watchlistCount => _watchlistCount;
  bool get isAuthenticated => _isAuthenticated;

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
