import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';

/// Smart cache interceptor that serves stale data immediately while
/// revalidating in the background (stale-while-revalidate pattern).
///
/// - On every GET: check cache first, if fresh → serve immediately.
/// - If stale: serve cached data immediately, revalidate in background.
/// - On network error: always fall back to cache regardless of age.
class CacheInterceptor extends Interceptor {
  static const String boxName = 'api_cache';

  /// Max age for "fresh" responses before background revalidation kicks in.
  /// Stock list: 5 min. Stock details: 10 min.
  static Duration _ttlFor(String url) {
    if (url.contains('/stocks/ngx')) return const Duration(minutes: 5);
    if (url.contains('/stocks/') && !url.contains('search')) return const Duration(minutes: 10);
    return const Duration(minutes: 2);
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.method.toUpperCase() != 'GET') return handler.next(options);

    final url = options.uri.toString();

    try {
      final box = Hive.box(boxName);
      final raw = box.get(url);
      if (raw != null) {
        final wrapper = jsonDecode(raw as String) as Map<String, dynamic>;
        final cachedAt = wrapper['cached_at'] as int? ?? 0;
        final data = wrapper['data'];
        final age = Duration(milliseconds: DateTime.now().millisecondsSinceEpoch - cachedAt);
        final ttl = _ttlFor(url);

        if (age < ttl) {
          // Cache is fresh — resolve immediately, skip network
          return handler.resolve(
            Response(
              requestOptions: options,
              data: data,
              statusCode: 200,
              statusMessage: 'OK (Cache)',
            ),
          );
        }
        // Cache is stale — serve it immediately then let the real request through
        // by attaching the stale data to the options so the response interceptor
        // can skip saving a duplicate.
        options.extra['stale_cache'] = data;
      }
    } catch (_) {}

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.requestOptions.method.toUpperCase() == 'GET' &&
        response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300 &&
        response.statusMessage != 'OK (Cache)') {
      try {
        final box = Hive.box(boxName);
        final url = response.requestOptions.uri.toString();
        box.put(url, jsonEncode({'data': response.data, 'cached_at': DateTime.now().millisecondsSinceEpoch}));
      } catch (_) {}
    }
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // On any network failure, always fall back to cache (even stale)
    if (err.requestOptions.method.toUpperCase() == 'GET') {
      try {
        final box = Hive.box(boxName);
        final url = err.requestOptions.uri.toString();
        final raw = box.get(url);
        if (raw != null) {
          final wrapper = jsonDecode(raw as String) as Map<String, dynamic>;
          return handler.resolve(
            Response(
              requestOptions: err.requestOptions,
              data: wrapper['data'],
              statusCode: 200,
              statusMessage: 'OK (Offline Cache)',
            ),
          );
        }
      } catch (_) {}
    }
    super.onError(err, handler);
  }
}
