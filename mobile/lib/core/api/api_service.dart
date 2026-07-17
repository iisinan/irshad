import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'cache_interceptor.dart';

/// Singleton ApiService — one Dio instance, one interceptor stack, everywhere.
class ApiService {
  static const String _prodUrl = 'https://irshad-k3el.onrender.com/api/v1/';
  static const String _devUrl  = 'http://10.0.2.2:8000/api/v1/';

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Global navigator key for redirecting to /login on 401.
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  ApiService._internal() {
    dio = Dio(BaseOptions(
      baseUrl: _prodUrl,
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
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401) {
          final isAuthRoute = error.requestOptions.path.contains('login') || error.requestOptions.path.contains('register');
          if (!isAuthRoute) {
            await _storage.delete(key: 'access_token');
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<Response> post(String path, dynamic data) async {
    return dio.post(path, data: data);
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> put(String path, dynamic data) async {
    return dio.put(path, data: data);
  }

  Future<Response> delete(String path) async {
    return dio.delete(path);
  }
}
