import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:irshad_mobile/core/widgets/company_avatar.dart';
import 'package:irshad_mobile/features/stocks/ui/stock_detail_screen.dart';

class UpdatesComplianceTab extends StatefulWidget {
  const UpdatesComplianceTab({super.key});

  @override
  State<UpdatesComplianceTab> createState() => _UpdatesComplianceTabState();
}

class _UpdatesComplianceTabState extends State<UpdatesComplianceTab> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _data;
  
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

  Widget _buildStatusBadge(String? status) {
    if (status == null) return const SizedBox.shrink();
    final s = status.toLowerCase().replaceAll('-', '_');
    final isHalal = s == 'halal' || s == 'compliant';
    final isHaram = s == 'non_compliant';
    final color = isHalal ? const Color(0xFF22c55e) : isHaram ? const Color(0xFFef4444) : const Color(0xFFf59e0b);
    final bg = isHalal ? const Color(0xFFf0fdf4) : isHaram ? const Color(0xFFfef2f2) : const Color(0xFFFFFBEB);
    final label = isHalal ? 'Compliant' : isHaram ? 'Non-Compliant' : 'Doubtful';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
    );
  }

  Widget _buildComplianceCard(Map<String, dynamic> item) {
    final isWorsening = item['new_status'] == 'non_compliant' || item['new_status'] == 'non-compliant';
    final isImproving = item['new_status'] == 'halal' && (item['previous_status'] == 'non_compliant' || item['previous_status'] == 'non-compliant');
    final borderColor = isWorsening ? context.appColors.haram : isImproving ? context.appColors.halal : context.appColors.divider;

    return GestureDetector(
      onTap: () => StockDetailScreen.openWithLoading(context, item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, left: 24, right: 24),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: context.bg,
          border: Border.all(color: borderColor.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
          ],
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
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _buildStatusBadge(item['previous_status']),
                          const Icon(Icons.arrow_downward_rounded, size: 12, color: Colors.grey),
                          _buildStatusBadge(item['new_status']),
                        ],
                      )
                    ],
                  ),
                  if (item['reason'] != null)
                    Container(
                      margin: const EdgeInsets.only(top: 10, bottom: 8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isWorsening ? context.appColors.haramBg : context.bgAlt,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: RichText(
                        text: TextSpan(
                          style: TextStyle(fontSize: 12, color: context.appColors.textBody, height: 1.4, fontFamily: 'Manrope'),
                          children: [
                            const TextSpan(text: 'Reason: ', style: TextStyle(fontWeight: FontWeight.bold)),
                            TextSpan(text: item['reason']),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    item['time_ago'] ?? '',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted),
                  ),
                ],
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

    List<dynamic> items = _data?['compliance_changes'] ?? [];

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      children: [
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'No compliance updates available',
                style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
              ),
            ),
          )
        else
          ...items.map((item) => _buildComplianceCard(item)),
      ],
    );
  }
}
