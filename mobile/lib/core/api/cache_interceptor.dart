import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';

class CacheInterceptor extends Interceptor {
  static const String boxName = 'api_cache';

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // Only cache successful GET requests
    if (response.requestOptions.method.toUpperCase() == 'GET' && 
        response.statusCode != null && 
        response.statusCode! >= 200 && 
        response.statusCode! < 300) {
      
      try {
        final box = Hive.box(boxName);
        final url = response.requestOptions.uri.toString();
        // Save the raw data
        box.put(url, jsonEncode(response.data));
      } catch (e) {
        // Ignore cache write errors
      }
    }
    
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Check if it's a network error and a GET request
    if (err.requestOptions.method.toUpperCase() == 'GET' && _isNetworkError(err)) {
      try {
        final box = Hive.box(boxName);
        final url = err.requestOptions.uri.toString();
        
        if (box.containsKey(url)) {
          final cachedData = box.get(url);
          if (cachedData != null) {
            // We have cached data! Return a successful response instead of the error.
            final response = Response(
              requestOptions: err.requestOptions,
              data: jsonDecode(cachedData),
              statusCode: 200,
              statusMessage: 'OK (Cached)',
            );
            return handler.resolve(response);
          }
        }
      } catch (e) {
        // Ignore cache read errors and fall through to the network error
      }
    }
    
    super.onError(err, handler);
  }

  bool _isNetworkError(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.connectionError ||
           err.type == DioExceptionType.unknown; // Sometimes socket exceptions are 'unknown'
  }
}
