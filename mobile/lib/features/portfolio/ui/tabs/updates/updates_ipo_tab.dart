import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';


class UpdatesIpoTab extends StatelessWidget {
  const UpdatesIpoTab({super.key});

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
      'logo': 'assets/logos/dangote.png',
      'timeline': 'Q4 2026 - Q1 2027 (Est.)',
      'capacity': '650,000 barrels per day',
      'listingLocation': 'Nigerian Exchange (NGX), London (LSE)',
      'shariahAssessment': 'As a refining business, the core activity (petroleum processing) is generally considered permissible (Halal). A full AAOIFI screening regarding debt ratios (which may be substantial given the project size) and interest-bearing assets will be conducted once the official prospectus and financial statements are released.',
      'description': "The Dangote Petroleum Refinery and Petrochemicals FZE initial public offering is now live. The offering involves 4.1 billion ordinary shares aimed at raising ₦2.15 trillion (\$1.6 billion), representing one of the largest IPOs in African history. Minimum subscription is 10 shares (₦5,250), with subsequent multiples of 10. Irshad will provide a comprehensive Shariah compliance breakdown of the offer based on the official prospectus.",
      'dateStart': 'Sept 14, 2026',
      'dateEnd': 'Oct 13, 2026',
      'price': '₦525/share'
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
              Text('IPO Center', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3)),
              Text('Upcoming Initial Public Offerings & Shariah analysis', style: TextStyle(fontSize: 12, color: context.textMuted)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIPOCard(BuildContext context, Map<String, dynamic> ipo) {
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
          ],
        ),
      ),
    );
  }

  void _showModal(BuildContext context, Map<String, dynamic> ipo) {
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
