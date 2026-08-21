import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_service.dart';
import '../../../../core/widgets/company_avatar.dart';
import '../../providers/portfolio_provider.dart';
import '../../../stocks/providers/stock_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class PortfolioOverviewTab extends StatefulWidget {
  const PortfolioOverviewTab({super.key});

  @override
  State<PortfolioOverviewTab> createState() => _PortfolioOverviewTabState();
}

class _PortfolioOverviewTabState extends State<PortfolioOverviewTab> {
  String _selectedFilter = 'All';
  bool _fabPressed = false;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PortfolioProvider>();

    return Scaffold(
      backgroundColor: context.bg,
      floatingActionButton: provider.isGuest
          ? null
          : Padding(
              padding: const EdgeInsets.only(bottom: 90.0, right: 4.0),
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showAddHoldingSheet(context);
                },
                onTapDown: (_) => setState(() => _fabPressed = true),
                onTapUp: (_) => setState(() => _fabPressed = false),
                onTapCancel: () => setState(() => _fabPressed = false),
                child: AnimatedScale(
                  scale: _fabPressed ? 0.88 : 1.0,
                  duration: const Duration(milliseconds: 120),
                  curve: Curves.easeOut,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: _fabPressed
                          ? []
                          : [
                              BoxShadow(
                                color: context.primary.withOpacity(0.18),
                                blurRadius: 14,
                                spreadRadius: 0,
                                offset: const Offset(0, 4),
                              ),
                            ],
                    ),
                    child: Icon(
                      Icons.add_circle_rounded,
                      color: context.primary.withOpacity(0.55),
                      size: 56,
                    ),
                  ),
                ),
              ),
            ),
      body: Builder(
        builder: (context) {
          if (provider.isLoading && provider.summary['total_balance'] == 0) {
            return Center(child: CircularProgressIndicator(color: context.primary));
          }

          if (provider.isGuest) {
            return _buildGuestView(context);
          }

          int halalCount = 0;
          int needsPurif = 0;
          int nonHalalCount = 0;
          int doubtfulCount = 0;
          double totalReturn = 0;

          for (var h in provider.holdings) {
            final symbol = h['symbol'] ?? 'S';
            final statusRaw = h['status']?.toString().toLowerCase() ?? (h['is_halal'] == true ? 'halal' : 'non-halal');
            final finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].contains(symbol) ? 'halal' : statusRaw;
            final isHalal = finalStatus == 'halal' || finalStatus == 'compliant';
            
            final purificationDue = num.tryParse(h['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;
            final nonCompliantRatio = num.tryParse(h['non_compliant_ratio']?.toString() ?? '0')?.toDouble() ?? 0.0;
            final needsPurification = purificationDue > 0 || nonCompliantRatio > 0;
            
            if (isHalal) {
              if (needsPurification) needsPurif++;
              else halalCount++;
            } else if (finalStatus == 'doubtful') {
              doubtfulCount++;
            } else {
              nonHalalCount++;
            }

            totalReturn += num.tryParse(h['return_percentage']?.toString() ?? '0')?.toDouble() ?? 0.0;
          }

          double avgReturn = provider.holdings.isNotEmpty ? totalReturn / provider.holdings.length : 0.0;

          List<dynamic> filteredHoldings = provider.holdings.where((h) {
            final symbol = h['symbol'] ?? 'S';
            final statusRaw = h['status']?.toString().toLowerCase() ?? (h['is_halal'] == true ? 'halal' : 'non-halal');
            final finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].contains(symbol) ? 'halal' : statusRaw;
            final isHalal = finalStatus == 'halal' || finalStatus == 'compliant';
            
            final purificationDue = num.tryParse(h['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;
            final nonCompliantRatio = num.tryParse(h['non_compliant_ratio']?.toString() ?? '0')?.toDouble() ?? 0.0;
            final needsPurification = purificationDue > 0 || nonCompliantRatio > 0;

            if (_selectedFilter == 'All') return true;
            if (_selectedFilter == 'Compliant') return isHalal && !needsPurification;
            if (_selectedFilter == 'Compliant (Purify)') return isHalal && needsPurification;
            if (_selectedFilter == 'Doubtful') return finalStatus == 'doubtful';
            if (_selectedFilter == 'Non-Compliant') return !isHalal && finalStatus != 'doubtful';
            return true;
          }).toList();

          return RefreshIndicator(
            onRefresh: provider.fetchPortfolio,
            color: context.primary,
            backgroundColor: context.bgAlt,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 100.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBalanceCard(context, provider, halalCount, needsPurif, nonHalalCount, doubtfulCount, avgReturn),
                    const SizedBox(height: 24),
                    _buildFilterTabs(context),
                    const SizedBox(height: 24),
                    if (provider.holdings.isNotEmpty)
                      Text(
                        'Holdings',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
                      ),
                    if (provider.holdings.isNotEmpty) const SizedBox(height: 12),
                    if (filteredHoldings.isEmpty && provider.holdings.isEmpty) _buildEmptyState(context),
                    if (filteredHoldings.isEmpty && provider.holdings.isNotEmpty) 
                      Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(child: Text('No holdings match this filter.', style: TextStyle(color: context.textMuted))),
                      ),
                    ...filteredHoldings.asMap().entries.map((entry) => _buildHoldingItem(context, entry.value, entry.key)),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterTabs(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildFilterChip('All', Icons.layers),
                _buildFilterChip('Compliant', Icons.verified_user_outlined),
                _buildFilterChip('Compliant (Purify)', Icons.water_drop_outlined),
                _buildFilterChip('Doubtful', Icons.help_outline),
                _buildFilterChip('Non-Compliant', Icons.warning_amber_rounded),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, IconData icon) {
    bool isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? context.bg : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))] : [],
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isSelected ? context.primary : context.textMuted),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? context.primary : context.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestView(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: context.accentSoft,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(Icons.pie_chart_outline_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text('Track Your Halal Portfolio',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: context.textDark),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Sign in to track your NGX holdings, monitor Shariah compliance and calculate your Zakat.',
              style: TextStyle(color: context.textMuted, fontSize: 15, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                  elevation: 0,
                ),
                child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/register'),
              child: Text('Create a free account →', style: TextStyle(color: context.primary, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      alignment: Alignment.center,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(28),
            ),
            child: Icon(Icons.account_balance_wallet_outlined, size: 48, color: context.primary),
          ),
          const SizedBox(height: 24),
          Text(
            'Your Portfolio is Empty',
            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Start tracking your investments and ensure they align with Islamic financial principles.',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.textMuted, height: 1.6, fontSize: 15),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => _showAddHoldingSheet(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Your First Asset', style: TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, PortfolioProvider provider, int halalCount, int needsPurif, int nonHalalCount, int doubtfulCount, double avgReturn) {
    bool isUp = avgReturn >= 0;
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 24, offset: const Offset(0, 8)),
        ],
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [context.bg, context.bgAlt],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -50,
            top: -50,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [context.primary.withOpacity(0.08), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            left: 10,
            bottom: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [context.primary.withOpacity(0.06), Colors.transparent],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total Portfolio Value',
                  style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: '₦',
                              style: TextStyle(
                                color: context.textDark.withOpacity(0.5),
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0,
                              ),
                            ),
                            TextSpan(
                              text: NumberFormat('#,##0', 'en_US').format(
                                (provider.summary['total_balance'] as num).toDouble(),
                              ),
                              style: TextStyle(
                                color: context.textDark,
                                fontSize: 42,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -2.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (provider.holdings.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: (isUp ? context.halal : context.haram).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                                color: isUp ? context.halal : context.haram,
                                size: 12,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                '${isUp ? '+' : ''}${avgReturn.toStringAsFixed(2)}%',
                                style: TextStyle(
                                  color: isUp ? context.halal : context.haram,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                Divider(height: 1, thickness: 0.5, color: context.divider),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildStatBadge(context, Icons.verified_user_outlined, 'Shariah Compliant', halalCount, context.halal),
                    if (needsPurif > 0)
                      _buildStatBadge(context, Icons.water_drop_outlined, 'Purify', needsPurif, const Color(0xFFEAB308)),
                    if (nonHalalCount > 0)
                      _buildStatBadge(context, Icons.warning_amber_rounded, 'Shariah Non-Compliant', nonHalalCount, context.haram),
                    if (doubtfulCount > 0)
                      _buildStatBadge(context, Icons.help_outline, 'Doubtful', doubtfulCount, const Color(0xFFF59E0B)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBadge(BuildContext context, IconData icon, String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 13),
          const SizedBox(width: 5),
          Text(label, style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          Text(count.toString(), style: TextStyle(color: context.textDark, fontSize: 13, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }


  Widget _buildHoldingItem(BuildContext context, dynamic holding, int index) {
    final symbol = holding['symbol'] ?? 'S';
    final statusRaw = holding['status']?.toString().toLowerCase() ?? (holding['is_halal'] == true ? 'halal' : 'non-halal');
    final finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].contains(symbol) ? 'halal' : statusRaw;

    final purificationDue = num.tryParse(holding['purification_due']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final nonCompliantRatio = num.tryParse(holding['non_compliant_ratio']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final totalDividends = num.tryParse(holding['total_dividends']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final hasBeenPurified = context.read<PortfolioProvider>().purifications.any((p) => p['symbol'] == symbol);

    Color accentColor;
    String badgeText;

    if (finalStatus == 'halal' || finalStatus == 'compliant') {
      if (purificationDue > 0 || nonCompliantRatio > 0) {
        accentColor = const Color(0xFFEAB308);
        badgeText = 'Purification Due';
      } else {
        accentColor = context.halal;
        badgeText = 'Compliant';
      }
    } else if (finalStatus == 'non-halal' || finalStatus == 'non_halal' || finalStatus == 'non-compliant' || finalStatus == 'fail') {
      accentColor = context.haram;
      badgeText = 'Non-Compliant';
    } else {
      accentColor = const Color(0xFFF59E0B);
      badgeText = 'Doubtful';
    }

    final double returnPct = num.tryParse(holding['return_percentage']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final double val = num.tryParse(holding['total_value']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final double shares = num.tryParse(holding['shares']?.toString() ?? '0')?.toDouble() ?? 0.0;
    final bool isUp = returnPct >= 0;
    final fmt = NumberFormat('#,##0', 'en_US');

    final String? gracePeriodEndsAtStr = holding['grace_period_ends_at'];
    int? daysLeft;
    if (gracePeriodEndsAtStr != null) {
      final end = DateTime.tryParse(gracePeriodEndsAtStr);
      if (end != null) {
        daysLeft = end.difference(DateTime.now()).inDays;
      }
    }

    return GestureDetector(
      onTap: () => _showEditHoldingSheet(context, holding),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.divider.withOpacity(0.6)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          CompanyAvatar(
                            logoUrl: holding['logo_url'],
                            symbol: symbol,
                            size: 42,
                            borderRadius: 12,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        symbol,
                                        style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 15, letterSpacing: -0.3),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 7),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: accentColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        badgeText,
                                        style: TextStyle(color: accentColor, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.2),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '₦${fmt.format(val)}',
                                style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 15, letterSpacing: -0.5),
                              ),
                              const SizedBox(height: 4),
                              if (returnPct != 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: (isUp ? context.halal : context.haram).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                                          size: 9, color: isUp ? context.halal : context.haram),
                                      const SizedBox(width: 2),
                                      Text(
                                        '${isUp ? '+' : ''}${returnPct.toStringAsFixed(2)}%',
                                        style: TextStyle(color: isUp ? context.halal : context.haram, fontSize: 10, fontWeight: FontWeight.w800),
                                      ),
                                    ],
                                  ),
                                )
                              else
                                Text('${shares.toStringAsFixed(0)} shares',
                                    style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Row(
                          children: [
                            if (returnPct != 0)
                              Text('${shares.toStringAsFixed(0)} shares',
                                  style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                            if (totalDividends > 0) ...[  
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: context.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(5)),
                                child: Text('₦${fmt.format(totalDividends)} div', style: TextStyle(color: context.primary, fontSize: 9, fontWeight: FontWeight.w800)),
                              ),
                            ],
                            if (purificationDue > 0) ...[  
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: context.haram.withOpacity(0.08), borderRadius: BorderRadius.circular(5)),
                                child: Text('₦${fmt.format(purificationDue)} to purify', style: TextStyle(color: context.haram, fontSize: 9, fontWeight: FontWeight.w800)),
                              ),
                            ],
                            const Spacer(),
                            if (badgeText == 'Purification Due')
                              hasBeenPurified
                                  ? Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: context.halal.withOpacity(0.1),
                                        border: Border.all(color: context.halal.withOpacity(0.25)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.check_circle_outline, size: 12, color: context.halal),
                                          const SizedBox(width: 4),
                                          Text('Purified', style: TextStyle(color: context.halal, fontSize: 10, fontWeight: FontWeight.w800)),
                                        ],
                                      ),
                                    )
                                  : GestureDetector(
                                      onTap: () {
                                        DefaultTabController.of(context).animateTo(2);
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF59E0B).withOpacity(0.1),
                                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.25)),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.water_drop_outlined, size: 12, color: Color(0xFFD97706)),
                                            SizedBox(width: 4),
                                            Text('Purify Now', style: TextStyle(color: Color(0xFFD97706), fontSize: 10, fontWeight: FontWeight.w800)),
                                          ],
                                        ),
                                      ),
                                    ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  ),
                ),
              ),
            ),
            if (daysLeft != null)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, size: 14, color: Color(0xFFEF4444)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        daysLeft! > 0
                            ? 'Grace period ends in $daysLeft day${daysLeft! > 1 ? 's' : ''}. Please plan to exit your position.'
                            : 'Grace period has expired. Please sell immediately.',
                        style: const TextStyle(
                          color: Color(0xFFEF4444),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
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

  void _showAddHoldingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddHoldingBottomSheet(),
    );
  }

  void _showEditHoldingSheet(BuildContext context, dynamic holding) {
    final qtyController = TextEditingController(text: holding['shares'].toString());
    final priceController = TextEditingController(text: holding['average_buy_price'].toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.bg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (bottomSheetContext) {
        bool isSaving = false;
        return StatefulBuilder(builder: (ctx, setState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Edit ${holding['symbol']}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.3)),
                          const SizedBox(height: 4),
                          Text('Adjust your position size and average price', style: TextStyle(fontSize: 12, color: context.textMuted)),
                        ],
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(bottomSheetContext),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: context.bgAlt, shape: BoxShape.circle),
                          child: Icon(Icons.close, size: 16, color: context.textMuted),
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(color: context.divider, height: 1),
                Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('SHARES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.8)),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: qtyController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: context.bgAlt,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.primary, width: 2)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('AVG PRICE (₦)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.8)),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: priceController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: context.bgAlt,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.primary, width: 2)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(bottomSheetContext),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: context.textDark,
                                side: BorderSide(color: context.divider, width: 2),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: isSaving ? null : () async {
                                setState(() => isSaving = true);
                                try {
                                  final provider = Provider.of<PortfolioProvider>(context, listen: false);
                                  final shares = double.tryParse(qtyController.text) ?? 0.0;
                                  final price = double.tryParse(priceController.text) ?? 0.0;
                                  if (shares == 0) {
                                    await ApiService().delete('portfolio/${holding['id']}');
                                    await provider.fetchPortfolio();
                                  } else {
                                    await provider.updateHolding(holding['id'], shares, price);
                                  }
                                  if (mounted) Navigator.pop(bottomSheetContext);
                                } catch (e) {
                                  if (mounted) ScaffoldMessenger.of(bottomSheetContext).showSnackBar(SnackBar(content: Text('Failed to save: $e'), backgroundColor: context.haram));
                                } finally {
                                  setState(() => isSaving = false);
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: context.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                elevation: 0,
                              ),
                              child: isSaving 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }
}

class _HoldingFormData {
  final TextEditingController symbol = TextEditingController();
  final TextEditingController shares = TextEditingController();
  final TextEditingController price = TextEditingController();
  final TextEditingController date = TextEditingController();
  final FocusNode symbolFocus = FocusNode();

  void dispose() {
    symbol.dispose();
    shares.dispose();
    price.dispose();
    date.dispose();
    symbolFocus.dispose();
  }
}

class AddHoldingBottomSheet extends StatefulWidget {
  final String? preSelectedSymbol;
  final double? preSelectedPrice;
  const AddHoldingBottomSheet({Key? key, this.preSelectedSymbol, this.preSelectedPrice}) : super(key: key);
  @override
  State<AddHoldingBottomSheet> createState() => _AddHoldingBottomSheetState();
}

class _AddHoldingBottomSheetState extends State<AddHoldingBottomSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<_HoldingFormData> _holdings = [];
  double _estimatedTotal = 0.0;
  bool _isSubmitting = false;
  String? _brokerName;
  bool _isLinking = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _addNewHoldingForm();
    // Pre-fill symbol if provided
    if (widget.preSelectedSymbol != null && _holdings.isNotEmpty) {
      _holdings.first.symbol.text = widget.preSelectedSymbol!;
    }
    // Pre-fill price if provided
    if (widget.preSelectedPrice != null && _holdings.isNotEmpty && widget.preSelectedPrice! > 0) {
      _holdings.first.price.text = widget.preSelectedPrice!.toStringAsFixed(2);
      _calculateTotal();
    }
  }

  void _addNewHoldingForm() {
    final form = _HoldingFormData();
    form.shares.addListener(_calculateTotal);
    form.price.addListener(_calculateTotal);
    setState(() {
      _holdings.add(form);
    });
  }

  void _calculateTotal() {
    double total = 0.0;
    for (var form in _holdings) {
      double shares = double.tryParse(form.shares.text) ?? 0.0;
      double price = double.tryParse(form.price.text) ?? 0.0;
      total += (shares * price);
    }
    setState(() {
      _estimatedTotal = total;
    });
  }

  @override
  void dispose() {
    for (var form in _holdings) {
      form.shares.removeListener(_calculateTotal);
      form.price.removeListener(_calculateTotal);
      form.dispose();
    }
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _submitHoldings() async {
    List<Map<String, dynamic>> payload = [];
    for (var form in _holdings) {
      if (form.symbol.text.trim().isEmpty) continue;
      payload.add({
        'symbol': form.symbol.text.trim().toUpperCase(),
        'shares': double.tryParse(form.shares.text) ?? 0,
        'average_buy_price': double.tryParse(form.price.text) ?? 0,
        'purchase_date': form.date.text.trim().isEmpty ? null : form.date.text.trim(),
      });
    }

    if (payload.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter at least one holding with a symbol.'), backgroundColor: context.haram));
      return;
    }

    setState(() => _isSubmitting = true);
    final provider = Provider.of<PortfolioProvider>(context, listen: false);
    bool success = await provider.bulkAddHoldings(payload);
    setState(() => _isSubmitting = false);

    if (success) {
      final prefs = await SharedPreferences.getInstance();
      final hasZakatDate = prefs.getString('ZAKAT_DATE_KEY') != null;
      if (!hasZakatDate) {
        String firstPurchaseDate = payload.firstWhere((p) => p['purchase_date'] != null, orElse: () => {'purchase_date': DateTime.now().toString().substring(0, 10)})['purchase_date'];
        if (mounted) _showZakatDatePrompt(firstPurchaseDate);
      } else {
        if (mounted) Navigator.pop(context);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to add holdings.'), backgroundColor: context.haram));
      }
    }
  }

  void _showZakatDatePrompt(String purchaseDate) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: context.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: context.bgAlt, shape: BoxShape.circle),
                child: Icon(Icons.calculate_outlined, color: context.primary, size: 32),
              ),
              const SizedBox(height: 24),
              Text('Set Zakat Hawl Date?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
              const SizedBox(height: 16),
              Text(
                'We noticed you haven\'t set a Zakat Hawl Date. Based on your purchase, would you like to set your Hawl date to $purchaseDate?',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.6),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        if (mounted) Navigator.pop(this.context);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: context.textDark,
                        side: BorderSide(color: context.divider),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Not Now', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        final provider = Provider.of<PortfolioProvider>(this.context, listen: false);
                        bool updated = await provider.updateZakatDate(purchaseDate);
                        if (updated) {
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setString('irshad_zakat_hawl_date', purchaseDate);
                        }
                        if (mounted) Navigator.pop(ctx);
                        if (mounted) _showZakatConfirmation(purchaseDate);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        elevation: 0,
                      ),
                      child: const Text('Yes, Set Date', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showZakatConfirmation(String date) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: context.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: context.halal.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(Icons.check_circle_outline, color: context.halal, size: 32),
              ),
              const SizedBox(height: 24),
              Text('Zakat Hawl Set', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
              const SizedBox(height: 16),
              Text(
                'Your Zakat Hawl Date has been successfully set to $date. We will calculate your due Zakat starting from this date.',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.6),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  if (mounted) Navigator.pop(this.context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('Awesome', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add Holdings', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark)),
                    const SizedBox(height: 4),
                    Text('Update your portfolio tracking.', style: TextStyle(fontSize: 14, color: context.textMuted)),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.divider),
                    ),
                    child: Icon(Icons.close, size: 16, color: context.textMuted),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: context.primary,
            unselectedLabelColor: context.textMuted,
            indicatorColor: context.primary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w700),
            padding: const EdgeInsets.symmetric(horizontal: 24),
            tabs: const [
              Tab(text: 'Manual Entry'),
              Tab(icon: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.description_outlined, size: 16), SizedBox(width: 4), Text('Import Statement')])),
              Tab(icon: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.lock_outline, size: 16), SizedBox(width: 4), Text('Link Broker')])),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildManualEntryTab(),
                _buildImportTab(),
                _buildBrokerTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualEntryTab() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              for (int i = 0; i < _holdings.length; i++)
                _buildHoldingForm(i),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _addNewHoldingForm,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: context.bgAlt,
                    border: Border.all(color: context.primary.withOpacity(0.5), style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add, color: context.primary, size: 20),
                      const SizedBox(width: 8),
                      Text('Add Another Holding', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border(top: BorderSide(color: context.divider)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Estimated Total', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 16)),
                  Text('₦${_estimatedTotal.toStringAsFixed(2)}', style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 24)),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Cancel', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitHoldings,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isSubmitting 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Confirm Addition', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHoldingForm(int index) {
    final form = _holdings[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('HOLDING #${index + 1}', style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
              if (_holdings.length > 1)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      form.shares.removeListener(_calculateTotal);
                      form.price.removeListener(_calculateTotal);
                      _holdings.removeAt(index);
                      _calculateTotal();
                    });
                  },
                  child: Icon(Icons.close, size: 16, color: context.textMuted),
                )
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildTickerSymbolField(form)),
              const SizedBox(width: 16),
              Expanded(child: _buildTextField('Shares', controller: form.shares, hint: '0', keyboardType: TextInputType.numberWithOptions(decimal: true))),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildTextField('Avg Price (₦)', controller: form.price, hint: '0.00', keyboardType: TextInputType.numberWithOptions(decimal: true))),
              const SizedBox(width: 16),
              Expanded(child: _buildTextField(
                'Purchase Date', 
                controller: form.date, 
                hint: 'yyyy-mm-dd', 
                suffixIcon: Icons.calendar_today_outlined,
                readOnly: true,
                onTap: () async {
                  DateTime? picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: ColorScheme.light(
                            primary: context.primary,
                            onPrimary: Colors.white,
                            onSurface: context.textDark,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (picked != null) {
                    form.date.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
                  }
                },
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTickerSymbolField(_HoldingFormData form) {
    return RawAutocomplete<Map<String, dynamic>>(
      textEditingController: form.symbol,
      focusNode: form.symbolFocus,
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text == '') {
          return const Iterable<Map<String, dynamic>>.empty();
        }
        final stocks = Provider.of<StockProvider>(context, listen: false).ngxStocks;
        return stocks.where((stock) {
          final symbol = stock['symbol']?.toString().toLowerCase() ?? '';
          final name = stock['name']?.toString().toLowerCase() ?? '';
          final query = textEditingValue.text.toLowerCase();
          return symbol.contains(query) || name.contains(query);
        });
      },
      displayStringForOption: (option) => option['symbol']?.toString() ?? '',
      onSelected: (Map<String, dynamic> selection) {
        form.price.text = selection['latest_price']?.toString() ?? '0.00';
        _calculateTotal();
      },
      fieldViewBuilder: (BuildContext context, TextEditingController textEditingController, FocusNode focusNode, VoidCallback onFieldSubmitted) {
        return _buildTextField(
          'Ticker Symbol',
          controller: textEditingController,
          focusNode: focusNode,
          prefixIcon: Icons.search,
          hint: 'CMFC',
        );
      },
      optionsViewBuilder: (BuildContext context, AutocompleteOnSelected<Map<String, dynamic>> onSelected, Iterable<Map<String, dynamic>> options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Material(
              elevation: 12.0,
              borderRadius: BorderRadius.circular(16),
              color: context.bg,
              shadowColor: Colors.black.withOpacity(0.5),
              clipBehavior: Clip.antiAlias,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: 260,
                  maxWidth: MediaQuery.of(context).size.width - 88,
                  minWidth: MediaQuery.of(context).size.width - 88,
                ),
                child: ListView.separated(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  itemCount: options.length,
                  separatorBuilder: (context, index) => Divider(height: 1, color: context.divider.withOpacity(0.3)),
                  itemBuilder: (BuildContext context, int index) {
                    final option = options.elementAt(index);
                    return InkWell(
                      onTap: () => onSelected(option),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(option['symbol'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 15)),
                                  const SizedBox(height: 2),
                                  Text(option['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTextField(String label, {required TextEditingController controller, FocusNode? focusNode, String? hint, IconData? prefixIcon, IconData? suffixIcon, TextInputType? keyboardType, bool readOnly = false, VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          readOnly: readOnly,
          onTap: onTap,
          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: context.textMuted, size: 20) : null,
            suffixIcon: suffixIcon != null ? Icon(suffixIcon, color: context.textMuted, size: 20) : null,
            filled: true,
            fillColor: context.bg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.divider.withOpacity(0.5))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
          ),
        ),
      ],
    );
  }

  Widget _buildImportTab() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: context.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.file_upload_outlined, color: context.primary, size: 16),
                const SizedBox(width: 8),
                Text('Bulk Import', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Upload Statement', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
          const SizedBox(height: 16),
          Text(
            'Upload your trade log or portfolio statement (PDF/CSV) to automatically extract your holdings.',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 32),
          Expanded(
            child: GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('File selected', style: TextStyle(fontWeight: FontWeight.bold)),
                    content: const Text('Parsing logic will connect to the backend here.'),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    actions: [
                      TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(this.context); }, child: Text('OK', style: TextStyle(color: context.primary, fontWeight: FontWeight.bold))),
                    ],
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: context.bgAlt,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: context.divider, style: BorderStyle.solid, width: 2),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(color: context.bg, shape: BoxShape.circle),
                      child: Icon(Icons.cloud_upload_outlined, size: 28, color: context.textMuted),
                    ),
                    const SizedBox(height: 16),
                    Text('Tap to Browse Files', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                    const SizedBox(height: 4),
                    Text('Supports .pdf, .csv, and .xlsx', style: TextStyle(fontSize: 12, color: context.textMuted)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrokerTab() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: context.halal.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified_user_outlined, color: context.halal, size: 16),
                const SizedBox(width: 8),
                Text('End-to-End Encrypted', style: TextStyle(color: context.halal, fontWeight: FontWeight.w800, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Link your Broker', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
          const SizedBox(height: 16),
          Text(
            'Connect your brokerage account to Irshad to seamlessly track your Shariah-compliant investments.',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 32),
          Text('SELECT AN INSTITUTION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1.0)),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.2,
              children: ['Meristem', 'Stanbic IBTC', 'CSCS', 'Risevest'].map((broker) {
                bool isSelected = _brokerName == broker;
                return GestureDetector(
                  onTap: () => setState(() => _brokerName = broker),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isSelected ? context.primary.withOpacity(0.1) : context.bgAlt,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isSelected ? context.primary : context.divider, width: 2),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: isSelected ? context.bg : context.bgAlt,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(broker[0], style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark)),
                        ),
                        const SizedBox(height: 8),
                        Text(broker, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: (_isLinking || _brokerName == null) ? null : () async {
              setState(() => _isLinking = true);
              final provider = Provider.of<PortfolioProvider>(context, listen: false);
              bool success = await provider.linkBroker(_brokerName!);
              setState(() => _isLinking = false);
              if (success) {
                if (mounted) Navigator.pop(context);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$_brokerName linked successfully.'), backgroundColor: context.halal));
              } else {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to link broker.'), backgroundColor: context.haram));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: context.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: _isLinking
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Continue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ],
      ),
    );
  }
}
