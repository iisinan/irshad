import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';

class UpdatesTab extends StatefulWidget {
  const UpdatesTab({super.key});

  @override
  State<UpdatesTab> createState() => _UpdatesTabState();
}

class _UpdatesTabState extends State<UpdatesTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _news = [];

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  Future<void> _fetchNews() async {
    // 1. Try cache first
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedStr = box.get('news_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final int expiry = cached['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          if (mounted) {
            setState(() {
              _news = cached['data'] ?? [];
              _isLoading = false;
            });
          }
        }
      }
    } catch (_) {}

    // 2. Fetch live data silently
    try {
      final response = await ApiService().get('updates/news');
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data['data'] ?? [];
          
          try {
            final box = await Hive.openBox('updatesBox');
            await box.put('news_data', jsonEncode({
              'data': data,
              'expiry': DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch
            }));
          } catch (_) {}

          setState(() {
            _news = data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted && _news.isEmpty) {
          setState(() {
            _error = 'Failed to fetch news';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted && _news.isEmpty) {
        setState(() {
          _error = 'Error loading news';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));
    if (_news.isEmpty) return Center(child: Text('No updates available', style: TextStyle(color: context.textMuted)));

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      itemCount: _news.length,
      itemBuilder: (context, index) {
        final item = _news[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item['symbol'] != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(item['symbol'], style: TextStyle(color: context.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              if (item['symbol'] != null) const SizedBox(height: 8),
              Text(item['title'] ?? '', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: context.textDark)),
              const SizedBox(height: 8),
              Text(item['summary'] ?? '', style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.4)),
              const SizedBox(height: 12),
              Text(item['published_at'] ?? '', style: TextStyle(fontSize: 12, color: context.textMuted)),
            ],
          ),
        );
      },
    );
  }
}
