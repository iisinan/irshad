import 'package:dio/dio.dart';
import '../../../core/api/api_service.dart';
import '../../../core/notifications/notification_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:convert';
import 'package:hive/hive.dart';

class AuthRepository {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: '900192262603-1v5t8hgmboe173j1h997p1bfk4kedn4k.apps.googleusercontent.com',
  );

  Future<Map<String, dynamic>?> register(String name, String email, String password, String passwordConfirmation, {String? location, String? phoneNumber, String? investorType, String? primaryUseCase, String? investmentExperience}) async {
    try {
      final response = await _apiService.post('register', {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
        'location': location,
        'phone_number': phoneNumber,
        'investor_type': investorType,
        'primary_use_case': primaryUseCase,
        'investment_experience': investmentExperience,
      });

      if (response.statusCode == 201) {
        final data = response.data['data'];
        await _storage.write(key: 'access_token', value: data['access_token']);
        registerFCMToken();
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
        registerFCMToken();
        return data['user'];
      }
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Login failed';
    }
    return null;
  }

  Future<Map<String, dynamic>?> loginWithGoogle(String idToken) async {
    try {
      final response = await _apiService.post('auth/google', {
        'credential': idToken,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _storage.write(key: 'access_token', value: data['access_token']);
        registerFCMToken();
        return data['user'];
      }
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Google login failed';
    }
    return null;
  }

  Future<Map<String, dynamic>?> signInWithGoogleFlow() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) return null; // user canceled
      
      final GoogleSignInAuthentication auth = await account.authentication;
      final String? idToken = auth.idToken;
      
      if (idToken == null) throw 'Missing Google ID Token';
      
      return await loginWithGoogle(idToken);
    } catch (e) {
      throw 'Google Sign In failed: $e';
    }
  }

  Future<void> logout() async {
    try {
      // We don't await google sign out strictly to avoid hanging if not logged in via Google
      _googleSignIn.signOut().catchError((_) => null);
      
      // Attempt backend logout with a strict 3-second timeout
      await _apiService.post('logout', {}).timeout(const Duration(seconds: 3));
    } catch (e) {
      // In case of network error or timeout, proceed to clear local token
    } finally {
      await _storage.deleteAll();
      try {
        Hive.box('api_cache').clear();
      } catch (_) {}
      try {
        if (Hive.isBoxOpen('portfolioBox')) {
          Hive.box('portfolioBox').clear();
        } else {
          final box = await Hive.openBox('portfolioBox');
          await box.clear();
        }
      } catch (_) {}
    }
  }

  Future<void> deleteAccount() async {
    try {
      await _apiService.delete('account');
    } catch (e) {
      // Ignore network errors, proceed with local logout
    } finally {
      await _storage.deleteAll();
      try {
        Hive.box('api_cache').clear();
      } catch (_) {}
      try {
        if (Hive.isBoxOpen('portfolioBox')) {
          Hive.box('portfolioBox').clear();
        } else {
          final box = await Hive.openBox('portfolioBox');
          await box.clear();
        }
      } catch (_) {}
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await _apiService.get('profile');
      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _storage.write(key: 'cached_profile', value: jsonEncode(data));
        return data;
      }
    } on DioException catch (e) {
      // Return cached data if offline
      final cached = await _storage.read(key: 'cached_profile');
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

  void registerFCMToken() async {
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

  Future<void> unsubscribeFCMToken() async {
    try {
      await _apiService.post('notifications/unsubscribe', {});
      await FirebaseMessaging.instance.deleteToken();
    } catch (e) {
      // Non-fatal
    }
  }
  
  Future<void> updateDigestPreference(bool enabled) async {
    try {
      await _apiService.put('updates/digest', {'email_enabled': enabled});
    } catch (e) {
      // Non-fatal
    }
  }
}
