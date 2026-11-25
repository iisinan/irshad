import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/features/portfolio/ui/tabs/resources_tab.dart';

const Map<String, dynamic> _defaultDangoteUpdateVideo = {
  'id': 40,
  'title': 'Update on Dangote Refinery IPO',
  'scholar': 'Irshad',
  'type': 'video',
  'category': 'Investing Literacy',
  'url': 'https://irshad-backend-production.up.railway.app/api/v1/resources/media/fNUH0FFpAqm0ukNEo2yatrR0wfpadba5TuZWz0df.mp4',
  'thumbnail': null,
  'duration': null,
  'description': 'Latest update and Shariah compliance analysis on the Dangote Petroleum Refinery & Petrochemicals Initial Public Offering (IPO).',
};

class UpdatesIpoTab extends StatefulWidget {
  const UpdatesIpoTab({super.key});

  @override
  State<UpdatesIpoTab> createState() => _UpdatesIpoTabState();
}

class _UpdatesIpoTabState extends State<UpdatesIpoTab> {
  Map<String, dynamic> _dangoteVideo = Map<String, dynamic>.from(_defaultDangoteUpdateVideo);

  @override
  void initState() {
    super.initState();
    _syncDangoteVideoFromResources();
  }

  Map<String, dynamic>? _matchDangoteVideo(List<dynamic> list) {
    for (final item in list) {
      if (item is Map) {
        final type = (item['type'] ?? '').toString().toLowerCase();
        if (type != 'video') continue;
        final title = (item['title'] ?? '').toString().toLowerCase();
        final id = item['id'];
        if (id == 40 || (title.contains('dangote') && (title.contains('ipo') || title.contains('refin')))) {
          return Map<String, dynamic>.from(item);
        }
      }
    }
    return null;
  }

  Future<void> _syncDangoteVideoFromResources() async {
    try {
      final box = await Hive.openBox('resourcesBox');
      final cachedStr = box.get('resources_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final List<dynamic> list = cached['data'] ?? [];
        final matched = _matchDangoteVideo(list);
        if (matched != null && mounted) {
          setState(() {
            _dangoteVideo = {
              ..._defaultDangoteUpdateVideo,
              ...matched,
            };
          });
        }
      }
    } catch (_) {}

    try {
      final response = await ApiService().get('resources');
      if (response.statusCode == 200) {
        final List<dynamic> list = response.data['data'] ?? [];
        final matched = _matchDangoteVideo(list);
        if (matched != null && mounted) {
          setState(() {
            _dangoteVideo = {
              ..._defaultDangoteUpdateVideo,
              ...matched,
            };
          });
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final ipoData = {
      'id': 'dangote-refinery',
      'name': 'Dangote Refinery',
      'status': 'OPEN',
      'statusColor': context.appColors.halal,
      'statusBg': context.appColors.halalBg,
      'sector': 'Oil & Gas',
      'exchange': 'NGX (Planned)',
      'valuation': '~\$20B+',
      'logo': 'assets/logos/DPRP.png',
      'timeline': 'Q4 2026 - Q1 2027 (Est.)',
      'capacity': '650,000 barrels per day',
      'listingLocation': 'Nigerian Exchange (NGX), London (LSE)',
      'shariahAssessment': 'As a refining business, the core activity (petroleum processing) is permissible (Halal). The H1 2026 audited statements have been analyzed: The company holds ₦5.66B in debt (0.0086% Debt Ratio) and ₦4.26B in cash (0.0065% Cash Ratio), while impure income stands safely at 0.35%. It passes all AAOIFI quantitative financial screening ratios. Status: 100% HALAL.',
      'description': "The Dangote Petroleum Refinery and Petrochemicals FZE initial public offering is now live. The offering involves 4.1 billion ordinary shares aimed at raising ₦2.15 trillion (\$1.6 billion), representing one of the largest IPOs in African history. Minimum subscription is 10 shares (₦5,250), with subsequent multiples of 10. The offering is officially certified as Shariah-compliant.",
      'dateStart': 'Sept 14, 2026',
      'dateEnd': 'Oct 13, 2026',
      'price': '₦525/share',
      'sourceUrl': 'https://acrobat.adobe.com/id/urn:aaid:sc:EU:9676fb4f-2d53-4785-a994-5cac81b2c454?viewer%21megaVerb=group-discover',
      'updateVideo': _dangoteVideo,
    };

    return ListView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      children: [
        _buildHeader(context),
        const SizedBox(height: 24),
        _buildIPOCard(context, ipoData),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: context.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(Icons.rocket_launch_outlined, color: context.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PO Center', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3)),
              Text('Upcoming Public Offerings & Shariah analysis', style: TextStyle(fontSize: 12, color: context.textMuted)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVideoUpdateBanner(BuildContext context, Map<String, dynamic> video, {bool isModal = false}) {
    final title = (video['title'] ?? 'Update on Dangote Refinery IPO').toString();
    final scholar = (video['scholar'] ?? 'Irshad').toString();
    final category = (video['category'] ?? 'Investing Literacy').toString();
    final thumbnail = video['thumbnail']?.toString();

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => showResourceVideoModal(context, video),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: isModal ? 16 : 20, vertical: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              context.primary.withValues(alpha: 0.12),
              context.bgAlt,
            ],
          ),
          borderRadius: isModal
              ? BorderRadius.circular(18)
              : const BorderRadius.vertical(bottom: Radius.circular(20)),
          border: isModal
              ? Border.all(color: context.primary.withValues(alpha: 0.25))
              : Border(top: BorderSide(color: context.appColors.divider)),
        ),
        child: Row(
          children: [
            // Video preview box with Play overlay
            Container(
              width: 86,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.16),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              clipBehavior: Clip.hardEdge,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (thumbnail != null && thumbnail.isNotEmpty)
                    Image.network(
                      thumbnail,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  Container(color: Colors.black.withValues(alpha: 0.22)),
                  Center(
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: context.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: context.primary,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.videocam_rounded, size: 10, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              'VIDEO UPDATE',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: context.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w900,
                      color: context.textDark,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'By $scholar • Tap to watch video',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: context.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: context.primary,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: context.primary.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.play_arrow_rounded, size: 14, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'Watch',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIPOCard(BuildContext context, Map<String, dynamic> ipo) {
    final updateVideo = ipo['updateVideo'] as Map<String, dynamic>?;

    return GestureDetector(
      onTap: () => _showModal(context, ipo),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [context.bgAlt, context.bg],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.appColors.divider),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 12, offset: const Offset(0, 4)),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: context.appColors.divider),
                    ),
                    child: ipo['logo'].startsWith('http') ? Image.network(ipo['logo'], fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.business)) : Image.asset(ipo['logo'], fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.business)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(ipo['name'], style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: ipo['statusBg'], borderRadius: BorderRadius.circular(100)),
                              child: Text(ipo['status'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: ipo['statusColor'])),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.business_outlined, size: 12, color: context.textMuted),
                            const SizedBox(width: 4),
                            Text(ipo['sector'], style: TextStyle(fontSize: 12, color: context.textMuted)),
                            const SizedBox(width: 12),
                            Icon(Icons.bar_chart_outlined, size: 12, color: context.textMuted),
                            const SizedBox(width: 4),
                            Text(ipo['exchange'], style: TextStyle(fontSize: 12, color: context.textMuted)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, indent: 20, endIndent: 20),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.access_time_outlined, size: 12, color: context.primary),
                          const SizedBox(width: 4),
                          Text('Offer Period', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: context.textMuted, letterSpacing: 0.5)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${ipo['dateStart'].split(',')[0]} - ${ipo['dateEnd'].split(',')[0]}', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                    ],
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: context.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.chevron_right_rounded, size: 18, color: context.primary),
                  ),
                ],
              ),
            ),
            if (updateVideo != null)
              _buildVideoUpdateBanner(context, updateVideo),
          ],
        ),
      ),
    );
  }

  void _showModal(BuildContext context, Map<String, dynamic> ipo) {
    final updateVideo = ipo['updateVideo'] as Map<String, dynamic>?;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: context.appColors.divider)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.appColors.divider),
                    ),
                    child: ipo['logo'].startsWith('http') ? Image.network(ipo['logo'], fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.business)) : Image.asset(ipo['logo'], fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.business)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(ipo['name'], style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: ipo['statusBg'], borderRadius: BorderRadius.circular(100)),
                              child: Text(ipo['status'], style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: ipo['statusColor'])),
                            ),
                          ],
                        ),
                        Text('Initial Public Offering Details', style: TextStyle(fontSize: 12, color: context.textMuted)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(color: context.bgAlt, shape: BoxShape.circle),
                      child: Icon(Icons.close_rounded, size: 18, color: context.textMuted),
                    ),
                  ),
                ],
              ),
            ),
            
            // Body
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  if (updateVideo != null) ...[
                    _buildVideoUpdateBanner(context, updateVideo, isModal: true),
                    const SizedBox(height: 20),
                  ],
                  // Key Metrics
                  Row(
                    children: [
                      Expanded(child: _buildMetricItem(context, 'Starts', ipo['dateStart'], Icons.access_time_outlined)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildMetricItem(context, 'Ends', ipo['dateEnd'], Icons.access_time_outlined)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildMetricItem(context, 'Share Price', ipo['price'], Icons.attach_money_rounded),
                  
                  const SizedBox(height: 32),
                  
                  // Overview
                  Row(
                    children: [
                      Icon(Icons.description_outlined, size: 20, color: context.primary),
                      const SizedBox(width: 8),
                      Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(ipo['description'], style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.6)),
                  
                  const SizedBox(height: 32),
                  
                  // Details Grid
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.bgAlt,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.appColors.divider),
                    ),
                    child: Column(
                      children: [
                        _buildDetailRow(context, 'Capacity', ipo['capacity']),
                        const Divider(height: 24),
                        _buildDetailRow(context, 'Listing', ipo['listingLocation']),
                        const Divider(height: 24),
                        _buildDetailRow(context, 'Timeline', ipo['timeline']),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Shariah Assessment
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.appColors.halalBg.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: context.appColors.halal.withOpacity(0.2)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.shield_outlined, size: 24, color: context.appColors.halal),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Preliminary Shariah Assessment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.appColors.halal)),
                              const SizedBox(height: 8),
                              Text(ipo['shariahAssessment'], style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
                              if (ipo['sourceUrl'] != null) ...[
                                const SizedBox(height: 16),
                                GestureDetector(
                                  onTap: () async {
                                    final url = Uri.parse(ipo['sourceUrl']);
                                    if (await canLaunchUrl(url)) {
                                      await launchUrl(url, mode: LaunchMode.inAppWebView);
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: context.bgAlt,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: context.appColors.divider),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.open_in_new_rounded, size: 14, color: context.textDark),
                                        const SizedBox(width: 8),
                                        Text(
                                          'View Original Document',
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textDark),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(BuildContext context, String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.appColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: context.textMuted),
              const SizedBox(width: 6),
              Text(label.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(label.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.5)),
        ),
        Expanded(
          child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
        ),
      ],
    );
  }
}
