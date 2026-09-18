import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:irshad_mobile/core/widgets/company_avatar.dart';
import 'package:irshad_mobile/features/stocks/ui/stock_detail_screen.dart';

class UpdatesDividendsTab extends StatefulWidget {
  const UpdatesDividendsTab({super.key});

  @override
  State<UpdatesDividendsTab> createState() => _UpdatesDividendsTabState();
}

class _UpdatesDividendsTabState extends State<UpdatesDividendsTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _dividends = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedStr = box.get('news_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final int expiry = cached['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          final cachedData = cached['data'] is Map && cached['data']['data'] != null ? cached['data']['data'] : cached['data'];
          if (cachedData is Map<String, dynamic>) {
            if (mounted) setState(() { _dividends = cachedData['dividends'] ?? []; _isLoading = false; });
          }
        }
      }
    } catch (_) {}

    try {
      final response = await ApiService().get('updates/news');
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data is Map && response.data['data'] != null ? response.data['data'] : response.data;
          if (data is Map<String, dynamic>) {
            setState(() { _dividends = data['dividends'] ?? []; _isLoading = false; _error = null; });
            try {
              final box = await Hive.openBox('updatesBox');
              box.put('news_data', jsonEncode({ 'expiry': DateTime.now().millisecondsSinceEpoch + 15 * 60 * 1000, 'data': data }));
            } catch (_) {}
          }
        }
      } else {
        if (mounted && _dividends.isEmpty) setState(() { _error = 'Failed to load dividends'; _isLoading = false; });
      }
    } catch (e) {
      if (mounted && _dividends.isEmpty) setState(() { _error = 'Failed to load dividends'; _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(children: List.generate(3, (i) => _buildSkeleton())),
      );
    }
    if (_error != null) {
      return Center(child: Text(_error!, style: TextStyle(color: context.haram, fontWeight: FontWeight.bold)));
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFD1A562).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.star_outline, size: 18, color: Color(0xFFD1A562)),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dividends & Payouts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3)),
                  Text('${_dividends.length} recent announcements', style: TextStyle(fontSize: 12, color: context.textMuted, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_dividends.isEmpty)
            Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('No Dividend News', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600))))
          else
            ..._dividends.map((rawItem) => _buildMarketCard(Map<String, dynamic>.from(rawItem as Map))),
        ],
      ),
    );
  }

  Widget _buildSkeleton() {
    return Container(
      height: 120,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(16)),
    );
  }

  Widget _buildMarketCard(Map<String, dynamic> item) {
    return GestureDetector(
      onTap: () {
        if (item['company'] != null && item['company']['id'] != null) {
          StockDetailScreen.openWithLoading(context, item['company']);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          border: Border.all(color: context.appColors.divider),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (item['company'] != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    CompanyAvatar(logoUrl: item['company']['logo_url'], symbol: item['company']['symbol'], size: 24),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item['company']['name'] ?? '',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: context.textDark),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: Icon(Icons.star_outline, size: 16, color: context.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['title'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: context.textDark, height: 1.3)),
                      if (item['content'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4, bottom: 8),
                          child: Text(
                            (item['content'] as String).length > 140 ? '${(item['content'] as String).substring(0, 140)}...' : item['content'],
                            style: TextStyle(fontSize: 11, color: context.textMuted, height: 1.4),
                          ),
                        ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (item['source'] != null) Text(item['source'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted)),
                          Text(item['time_ago'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
