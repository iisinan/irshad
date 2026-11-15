import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import 'cache_interceptor.dart';
import '../widgets/upgrade_paywall_bottom_sheet.dart';


class UpgradeRequiredException implements Exception {
  final String message;
  final String? requiredTier;
  final String? feature;

  const UpgradeRequiredException({
    required this.message,
    this.requiredTier,
    this.feature,
  });

  @override
  String toString() => message;
}

/// Singleton ApiService — one Dio instance, one interceptor stack, everywhere.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Global navigator key for redirecting to /login on 401.
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  ApiService._internal() {
    dio = Dio(BaseOptions(
      baseUrl: dotenv.env['API_BASE_URL'] ?? 'https://irshad-backend-production.up.railway.app/api/v1/',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      receiveDataWhenStatusError: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));

    // Cache Interceptor for offline support
    dio.interceptors.add(CacheInterceptor());

    // Auth token injection
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        String? token;
        try {
          token = await _storage.read(key: 'access_token');
        } catch (e) {
          debugPrint('FlutterSecureStorage read failed in ApiService: $e');
          await _storage.deleteAll();
        }
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },

      onResponse: (response, handler) {
        _syncScreenUsageFromResponse(response.data);
        return handler.next(response);
      },

      onError: (DioException error, handler) async {
        final isUpgradeRequired = error.response?.statusCode == 403 &&
            (error.response?.data?['error'] == 'Upgrade Required' ||
                error.response?.data?['upgrade_required'] == true);
        final handleManually = error.requestOptions.extra['handle_upgrade_manually'] == true;

        if (isUpgradeRequired) {
          _refreshProfileOnUpgradeRequired();
        }

        if (isUpgradeRequired && !handleManually) {
          final context = navigatorKey.currentContext;
          if (context != null) {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => UpgradePaywallBottomSheet(
                message: error.response?.data?['message'] ?? 'This feature requires an active Rawdha or Noor membership tier.',
                requiredTier: error.response?.data?['required_tier']?.toString(),
              ),
            );
          }
        }
        if (error.response?.statusCode == 401) {

          final isAuthRoute = error.requestOptions.path.contains('login') || error.requestOptions.path.contains('register') || error.requestOptions.path.contains('auth/google');
          if (!isAuthRoute) {
            debugPrint('401 Unauthorized encountered for ${error.requestOptions.path}');
            // Automatic logout has been disabled per user request.
            // The user will remain logged in until they manually click 'Sign Out'.
          }
        }
        return handler.next(error);
      },
    ));
  }

  void _syncScreenUsageFromResponse(dynamic responseData) {
    if (responseData is! Map) return;
    final dynamic payload = responseData['data'];
    final dynamic rawUsage = payload is Map
        ? payload['screen_usage']
        : responseData['screen_usage'];
    final dynamic rawPurifyUsage = payload is Map
        ? payload['purification_usage']
        : responseData['purification_usage'];
    final dynamic rawSummary = payload is Map
        ? payload['usage_summary']
        : responseData['usage_summary'];

    if (rawUsage is! Map && rawPurifyUsage is! Map && rawSummary is! Map) return;
    final context = navigatorKey.currentContext;
    if (context == null) return;
    try {
      final appState = Provider.of<AppStateProvider>(context, listen: false);
      if (rawSummary is Map) {
        appState.updateUsageSummary(Map<String, dynamic>.from(rawSummary));
      }
      if (rawUsage is Map) {
        appState.updateScreenUsage(Map<String, dynamic>.from(rawUsage));
      }
      if (rawPurifyUsage is Map) {
        appState.updateUsageSummary({
          'purifications_per_month': Map<String, dynamic>.from(rawPurifyUsage),
        });
      }
    } catch (_) {}
  }

  void _refreshProfileOnUpgradeRequired() {
    final context = navigatorKey.currentContext;
    if (context == null) return;
    try {
      Provider.of<AppStateProvider>(context, listen: false).loadProfile();
    } catch (_) {}
  }

  Future<Response> post(String path, dynamic data) async {
    return dio.post(path, data: data);
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters, Map<String, dynamic>? extra}) async {
    return dio.get(
      path,
      queryParameters: queryParameters,
      options: extra != null ? Options(extra: extra) : null,
    );
  }

  Future<Response> put(String path, dynamic data) async {
    return dio.put(path, data: data);
  }

  Future<Response> delete(String path) async {
    return dio.delete(path);
  }
}
