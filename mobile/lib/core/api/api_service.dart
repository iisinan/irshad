import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _prodUrl = 'https://irshad-backend.onrender.com/api/v1/';
  static const String _devUrl = 'http://10.0.2.2:8000/api/v1/';

  final Dio dio = Dio(BaseOptions(
    baseUrl: kReleaseMode ? _prodUrl : _devUrl,
    receiveDataWhenStatusError: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  Future<Response> post(String path, Map<String, dynamic> data) async {
    return await dio.post(path, data: data);
  }

  Future<Response> get(String path) async {
    return await dio.get(path);
  }

  Future<Response> put(String path, Map<String, dynamic> data) async {
    return await dio.put(path, data: data);
  }
}
