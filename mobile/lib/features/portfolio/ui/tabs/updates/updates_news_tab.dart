import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:irshad_mobile/core/widgets/company_avatar.dart';
import 'package:irshad_mobile/features/stocks/ui/stock_detail_screen.dart';
import 'package:url_launcher/url_launcher_string.dart';

class UpdatesNewsTab extends StatefulWidget {
  const UpdatesNewsTab({super.key});

  @override
  State<UpdatesNewsTab> createState() => _UpdatesNewsTabState();
}

class _UpdatesNewsTabState extends State<UpdatesNewsTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _data;
  String _activeSection = 'business';

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  Future<void> _fetchNews() async {
    try {
      final box = await Hive.openBox('updatesBox');
      final cachedStr = box.get('news_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final int expiry = cached['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          if (mounted) {
            setState(() {
              _data = cached['data'];
              _isLoading = false;
            });
          }
        }
      }
    } catch (_) {}

    try {
      final response = await ApiService().get('updates/news');
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data;
          
          try {
            final box = await Hive.openBox('updatesBox');
            await box.put('news_data', jsonEncode({
              'data': data,
              'expiry': DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch
            }));
          } catch (_) {}

          setState(() {
            _data = data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted && _data == null) {
          setState(() {
            _error = 'Failed to fetch news';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted && _data == null) {
        setState(() {
          _error = 'Error loading news';
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildSectionPills() {
    final complianceChanges = _data?['compliance_changes'] ?? [];
    
    final sections = [
      
      {'id': 'business', 'label': 'Business Activity', 'icon': Icons.bolt_outlined, 'color': const Color(0xFFF59E0B)},
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: sections.map((s) {
          final isActive = _activeSection == s['id'];
          final color = s['color'] as Color;
          return GestureDetector(
            onTap: () => setState(() => _activeSection = s['id'] as String),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? color.withValues(alpha: 0.1) : context.bgAlt,
                border: Border.all(color: isActive ? color : context.appColors.divider),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(s['icon'] as IconData, size: 16, color: isActive ? color : context.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    s['label'] as String,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: isActive ? color : context.textMuted,
                    ),
                  ),
                  if (s['id'] == 'compliance' && (s['count'] as int) > 0)
                    Container(
                      margin: const EdgeInsets.only(left: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${s['count']}',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatusBadge(String? status) {
    status = status?.replaceAll('-', '_');
    Color bg = context.appColors.questionableBg;
    Color border = context.appColors.questionableBg;
    Color color = context.appColors.questionable;
    String label = 'Doubtful';

    if (status == 'halal') {
      bg = context.appColors.halalBg;
      border = context.appColors.halal;
      color = context.appColors.halal;
      label = 'Shariah Compliant';
    } else if (status == 'non_compliant') {
      bg = context.appColors.haramBg;
      border = context.appColors.haram;
      color = context.appColors.haram;
      label = 'Shariah Non-Compliant';
    } else if (status == 'watchlist') {
      bg = context.appColors.review.withValues(alpha: 0.1);
      border = context.appColors.review;
      color = context.appColors.review;
      label = 'Watchlist';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color),
      ),
    );
  }

  Widget _buildBusinessCard(Map<String, dynamic> item) {
    return GestureDetector(
      onTap: () => StockDetailScreen.openWithLoading(context, item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, left: 24, right: 24),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: context.bg,
          border: Border.all(color: context.appColors.divider),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CompanyAvatar(symbol: item['symbol'], logoUrl: item['logo_url'], size: 40),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['name'] ?? item['symbol'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                            Text(item['symbol'] ?? '', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: context.textMuted)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.bgAlt,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          item['activity_label'] ?? item['activity_type'] ?? '',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textDark),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(item['summary'] ?? '', style: TextStyle(fontSize: 12, color: context.appColors.textBody, height: 1.5)),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(item['source'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted)),
                      Text(item['time_ago'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMarketCard(Map<String, dynamic> item) {
    return GestureDetector(
      onTap: () async {
        final url = item['source_url'] as String?;
        if (url != null && url.isNotEmpty) {
          try {
            await launchUrlString(url, mode: LaunchMode.externalApplication);
          } catch (e) {
            debugPrint("Could not launch $url");
          }
        }
      },
      child: Container(
      margin: const EdgeInsets.only(bottom: 12, left: 24, right: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.bar_chart_outlined, size: 16, color: context.primary),
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
          if (item['image_url'] != null && (item['image_url'] as String).isNotEmpty)
            Container(
              width: 70,
              height: 70,
              margin: const EdgeInsets.only(left: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(
                  image: NetworkImage(item['image_url']),
                  fit: BoxFit.cover,
                ),
              ),
            ),
        ],
      ),
    ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));

    List<dynamic> items = [];
    if (_activeSection == 'business') {
      items = _data?['business_updates'] ?? [];
    } else if (_activeSection == 'market') {
      items = _data?['market_intelligence'] ?? [];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionPills(),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'No updates available',
                style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
              ),
            ),
          )
        else
          ...items.map((item) {
            if (_activeSection == 'business') return _buildBusinessCard(item);
            return _buildMarketCard(item);
          }),
      ],
    );
  }
}
