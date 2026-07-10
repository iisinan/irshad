import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import '../../../core/notifications/notification_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class AuthRepository {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>?> register(String name, String email, String password, String passwordConfirmation, {String? location}) async {
    try {
      final response = await _apiService.post('register', {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
        'location': location,
      });

      if (response.statusCode == 201) {
        final data = response.data['data'];
        await _storage.write(key: 'access_token', value: data['access_token']);
        _registerFCMToken();
        return data['user'];
      }
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Registration failed';
    }
    return null;
  }

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await _apiService.post('login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _storage.write(key: 'access_token', value: data['access_token']);
        _registerFCMToken();
        return data['user'];
      }
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Login failed';
    }
    return null;
  }

  Future<void> logout() async {
    try {
      await _apiService.post('logout', {});
    } catch (e) {
      // In case of network error, still clear local token
    } finally {
      await _storage.delete(key: 'access_token');
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await _apiService.get('profile');
      if (response.statusCode == 200) {
        final data = response.data['data'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cached_profile', jsonEncode(data));
        return data;
      }
    } on DioException catch (e) {
      // Return cached data if offline
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('cached_profile');
      if (cached != null) {
        return jsonDecode(cached);
      }
    }
    return null;
  }

  Future<Map<String, dynamic>?> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.put('profile', data);
      if (response.statusCode == 200) {
        return response.data['data'];
      }
    } on DioException catch (e) {
       throw e.response?.data['message'] ?? 'Profile update failed';
    }
    return null;
  }

  void _registerFCMToken() async {
    try {
      final pushService = PushNotificationService();
      final token = await pushService.getToken();
      if (token != null) {
        await _apiService.post('notifications/subscribe', {'fcm_token': token});
      }
    } catch (e) {
      // Non-fatal
    }
  }
}
