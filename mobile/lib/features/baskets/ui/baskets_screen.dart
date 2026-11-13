import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive/hive.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/basket_provider.dart';
import '../models/basket.dart';
import '../../stocks/ui/basket_detail_screen.dart';
import '../../stocks/ui/create_basket_screen.dart';

/* ─── Irshad Thematic Baskets Data (Coming Soon) ──────────────────────────── */
class IrshadThematicBasketItem {
  final String id;
  final String name;
  final String tagline;
  final String description;
  final String targetYield;
  final String riskLevel;
  final String rebalanceFreq;
  final String aaoifiScore;
  final String category;
  final Color color;
  final Color bg;
  final IconData icon;
  final List<Map<String, String>> constituents;

  const IrshadThematicBasketItem({
    required this.id,
    required this.name,
    required this.tagline,
    required this.description,
    required this.targetYield,
    required this.riskLevel,
    required this.rebalanceFreq,
    required this.aaoifiScore,
    required this.category,
    required this.color,
    required this.bg,
    required this.icon,
    required this.constituents,
  });
}

const List<IrshadThematicBasketItem> _irshadThematicBaskets = [
  IrshadThematicBasketItem(
    id: 'irshad-shariah-titans',
    name: 'Irshad Shariah Titans 10',
    tagline: 'Flagship Core NGX Allocation',
    description:
        'The definitive basket of Nigeria’s highest-capitalization, highest-liquidity companies meeting strict AAOIFI Shariah standards. Built for capital preservation and dividend compounding.',
    targetYield: '14.8%',
    riskLevel: 'Moderate',
    rebalanceFreq: 'Quarterly',
    aaoifiScore: '100% Halal',
    category: 'Flagship',
    color: Color(0xFF10B981),
    bg: Color(0x1A10B981),
    icon: Icons.military_tech_rounded,
    constituents: [
      {'symbol': 'MTNN', 'weight': '22%'},
      {'symbol': 'DANGCEM', 'weight': '20%'},
      {'symbol': 'BUAFOODS', 'weight': '18%'},
      {'symbol': 'SEPLAT', 'weight': '15%'},
      {'symbol': 'PRESCO', 'weight': '13%'},
      {'symbol': 'OKOMUOIL', 'weight': '12%'},
    ],
  ),
  IrshadThematicBasketItem(
    id: 'irshad-dividend-aristocrats',
    name: 'Shariah Dividend Aristocrats',
    tagline: 'High Yield & Cashflow Compounding',
    description:
        'Companies with a 5+ year uninterrupted dividend distribution history, low debt-to-equity ratios (<30%), and negligible impermissible interest income.',
    targetYield: '17.2%',
    riskLevel: 'Conservative',
    rebalanceFreq: 'Semi-Annual',
    aaoifiScore: '100% Halal',
    category: 'High Yield',
    color: Color(0xFFF59E0B),
    bg: Color(0x1AF59E0B),
    icon: Icons.monetization_on_rounded,
    constituents: [
      {'symbol': 'SEPLAT', 'weight': '25%'},
      {'symbol': 'PRESCO', 'weight': '20%'},
      {'symbol': 'OKOMUOIL', 'weight': '20%'},
      {'symbol': 'TOTAL', 'weight': '18%'},
      {'symbol': 'NASCON', 'weight': '17%'},
    ],
  ),
  IrshadThematicBasketItem(
    id: 'irshad-food-security',
    name: 'Halal Food Security & FMCG',
    tagline: 'Essential Consumption & Agriculture',
    description:
        'High-margin consumer goods, food staples, and agribusiness powerhouses feeding over 220 million people with continuous pricing power against inflation.',
    targetYield: '15.4%',
    riskLevel: 'Moderate',
    rebalanceFreq: 'Quarterly',
    aaoifiScore: '100% Halal',
    category: 'Consumer Staples',
    color: Color(0xFF06B6D4),
    bg: Color(0x1A06B6D4),
    icon: Icons.shopping_bag_rounded,
    constituents: [
      {'symbol': 'BUAFOODS', 'weight': '30%'},
      {'symbol': 'FLOURMILL', 'weight': '25%'},
      {'symbol': 'PRESCO', 'weight': '20%'},
      {'symbol': 'NASCON', 'weight': '15%'},
      {'symbol': 'UNILEVER', 'weight': '10%'},
    ],
  ),
  IrshadThematicBasketItem(
    id: 'irshad-infrastructure',
    name: 'Islamic Green Infrastructure',
    tagline: 'Cement, Energy & Heavy Industry',
    description:
        'Industrial giants driving West African infrastructure development, housing, and urban expansion, adhering to zero-interest project financing frameworks.',
    targetYield: '13.9%',
    riskLevel: 'Growth',
    rebalanceFreq: 'Quarterly',
    aaoifiScore: '100% Halal',
    category: 'Heavy Industry',
    color: Color(0xFF8B5CF6),
    bg: Color(0x1A8B5CF6),
    icon: Icons.foundation_rounded,
    constituents: [
      {'symbol': 'DANGCEM', 'weight': '35%'},
      {'symbol': 'BUACEMENT', 'weight': '30%'},
      {'symbol': 'WAPCO', 'weight': '20%'},
      {'symbol': 'CUTIX', 'weight': '15%'},
    ],
  ),
];

class BasketsScreen extends StatefulWidget {
  const BasketsScreen({super.key});

  @override
  State<BasketsScreen> createState() => _BasketsScreenState();
}

class _BasketsScreenState extends State<BasketsScreen> {
  String _selectedFilter = 'All';
  bool _isWaitlisted = false;

  @override
  void initState() {
    super.initState();
    _loadWaitlistState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BasketProvider>().fetchBaskets();
    });
  }

  Future<void> _loadWaitlistState() async {
    try {
      final box = await Hive.openBox('updatesBox');
      if (mounted) {
        setState(() {
          _isWaitlisted = box.get('irshad_thematic_waitlist', defaultValue: false) == true;
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleWaitlist() async {
    final next = !_isWaitlisted;
    setState(() => _isWaitlisted = next);
    try {
      final box = await Hive.openBox('updatesBox');
      await box.put('irshad_thematic_waitlist', next);
    } catch (_) {}
    if (mounted && next) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.check_circle_rounded, color: Color(0xFF6EE7B7), size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  "You're on the priority waitlist! We'll notify you as soon as Irshad Thematic Baskets launch.",
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF1E293B),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  void _onFilterTap(String label) {
    setState(() => _selectedFilter = label);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      floatingActionButton: _buildFab(context),
      body: Consumer<BasketProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return Center(child: CircularProgressIndicator(color: context.primary));
          }

          if (provider.error != null) {
            return _buildError(context, provider);
          }

          final baskets = provider.baskets;
          final filtered = _selectedFilter == 'Custom'
              ? baskets.where((b) => b.userId != null).toList()
              : _selectedFilter == 'Curated'
                  ? baskets.where((b) => b.userId == null).toList()
                  : baskets;

          return RefreshIndicator(
            color: context.primary,
            onRefresh: () => provider.fetchBaskets(),
            child: CustomScrollView(
              slivers: [
                _buildHeroHeader(context, baskets),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: _buildFilterRow(),
                  ),
                ),
                if (_selectedFilter == 'Irshad Thematic')
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildThematicSectionHeader(context),
                          const SizedBox(height: 14),
                          _buildIrshadThematicBlurredSection(context),
                        ],
                      ),
                    ),
                  )
                else if (filtered.isEmpty)
                  SliverFillRemaining(child: _buildEmptyState(context))
                else ...[
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(20, 0, 20, _selectedFilter == 'All' ? 20 : 120),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final basket = filtered.elementAt(index);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _BasketCard(
                              basket: basket,
                              onTap: () async {
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => BasketDetailScreen(basket: basket.toJson()),
                                  ),
                                );
                                if (result == true && context.mounted) {
                                  context.read<BasketProvider>().fetchBaskets();
                                }
                              },
                            ),
                          );
                        },
                        childCount: filtered.length,
                      ),
                    ),
                  ),
                  if (_selectedFilter == 'All')
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildThematicSectionHeader(context),
                            const SizedBox(height: 14),
                            _buildIrshadThematicBlurredSection(context),
                          ],
                        ),
                      ),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildThematicSectionHeader(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Irshad Thematic Baskets',
              style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 17, letterSpacing: -0.3),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.25)),
              ),
              child: const Text(
                'COMING SOON',
                style: TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 0.4),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          "Proprietary algorithmic portfolios curated and managed by Irshad's Islamic Finance research desk.",
          style: TextStyle(color: context.textMuted, fontSize: 12, height: 1.4),
        ),
      ],
    );
  }

  Widget _buildIrshadThematicBlurredSection(BuildContext context) {
    return Stack(
      children: [
        // 1. Underlying constituent cards (blurred)
        ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Column(
            children: _irshadThematicBaskets.map((b) => _buildThematicCard(context, b)).toList(),
          ),
        ),

        // 2. Frosted Glass Blur Filter & Announcement Overlay
        Positioned.fill(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 7.5, sigmaY: 7.5),
              child: Container(
                color: Colors.black.withValues(alpha: 0.42),
                padding: const EdgeInsets.all(18),
                alignment: Alignment.center,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                  decoration: BoxDecoration(
                    color: context.bg,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: context.primary.withValues(alpha: 0.35), width: 1.5),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 28, offset: const Offset(0, 8)),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Top gradient highlight
                      Container(
                        height: 3,
                        width: 100,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF06B6D4), Color(0xFFF59E0B)]),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      // Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: context.primary.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome_rounded, size: 12, color: context.primary),
                            const SizedBox(width: 5),
                            Text(
                              'IRSHAD EXCLUSIVE • COMING SOON',
                              style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 9.5, letterSpacing: 0.5),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Irshad Thematic Baskets',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: -0.4),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Institutional-grade, algorithmically rebalanced Shariah portfolios designed by certified Islamic finance scholars. Automated quarterly rebalancing, dividend compounding, and one-click execution.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.textMuted, fontSize: 11.5, height: 1.45, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        alignment: WrapAlignment.center,
                        children: [
                          _buildPreviewChip(context, Icons.verified_rounded, '100% AAOIFI Certified', const Color(0xFF10B981)),
                          _buildPreviewChip(context, Icons.autorenew_rounded, 'Auto-Rebalanced', const Color(0xFF06B6D4)),
                          _buildPreviewChip(context, Icons.workspace_premium_rounded, 'Noor & Rawdah Access', const Color(0xFFF59E0B)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _toggleWaitlist,
                          icon: Icon(_isWaitlisted ? Icons.check_circle_rounded : Icons.auto_awesome_rounded, size: 16, color: Colors.white),
                          label: Text(
                            _isWaitlisted ? "You're on the Waitlist!" : 'Notify Me When Ready',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isWaitlisted ? const Color(0xFF10B981) : context.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _isWaitlisted ? 'We will notify you the moment beta access opens.' : 'Be the first to invest when Irshad Thematic Baskets launch.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildThematicCard(BuildContext context, IrshadThematicBasketItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 14, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Accent bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: item.color,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: item.bg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(item.icon, color: item.color, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: -0.3),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.tagline,
                            style: TextStyle(color: item.color, fontWeight: FontWeight.w700, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: item.bg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        item.category.toUpperCase(),
                        style: TextStyle(color: item.color, fontWeight: FontWeight.w900, fontSize: 9.5, letterSpacing: 0.4),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  item.description,
                  style: TextStyle(color: context.textMuted, fontSize: 12, height: 1.4),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: item.constituents.map((c) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: context.bgAlt,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: context.divider),
                      ),
                      child: RichText(
                        text: TextSpan(
                          text: '${c['symbol']} ',
                          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700, fontSize: 11),
                          children: [
                            TextSpan(
                              text: c['weight'],
                              style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                Divider(height: 1, color: context.divider),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Target Yield: ${item.targetYield}',
                      style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w900, fontSize: 12),
                    ),
                    Text(
                      item.aaoifiScore,
                      style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewChip(BuildContext context, IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700, fontSize: 10.5),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroHeader(BuildContext context, List<Basket> baskets) {
    final customCount = baskets.where((b) => b.userId != null).length;
    final curatedCount = baskets.where((b) => b.userId == null).length;
    final totalTickers = baskets.fold<int>(0, (sum, b) => sum + b.symbols.length);

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [context.primary, Color.lerp(context.primary, const Color(0xFF6C47FF), 0.7)!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: context.primary.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        margin: const EdgeInsets.only(bottom: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'INVESTING BASKETS',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 9.5, letterSpacing: 0.5),
                        ),
                      ),
                      const Text(
                        'Investing Baskets',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Curated collections & custom Shariah strategies',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w500, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                _buildStat('${baskets.length}', 'Total'),
                _buildStatDivider(),
                _buildStat('$curatedCount', 'Curated'),
                _buildStatDivider(),
                _buildStat('$customCount', 'Custom'),
                _buildStatDivider(),
                _buildStat('$totalTickers', 'Tickers'),
              ],
            ),
            const SizedBox(height: 18),
            // Two Action Buttons side by side: "Create Custom Basket" and "Irshad Thematic Basket"
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const CreateBasketScreen()),
                      );
                      if (result == true && context.mounted) {
                        context.read<BasketProvider>().fetchBaskets();
                      }
                    },
                    icon: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
                    label: const Text(
                      'Create Custom',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.35)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => _selectedFilter = 'Irshad Thematic');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedFilter == 'Irshad Thematic' ? Colors.white : Colors.white.withValues(alpha: 0.15),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: _selectedFilter == 'Irshad Thematic' ? Colors.white : Colors.white.withValues(alpha: 0.35),
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.auto_awesome_rounded,
                          size: 14,
                          color: _selectedFilter == 'Irshad Thematic' ? context.primary : const Color(0xFFFDE047),
                        ),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            'Irshad Thematic',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: _selectedFilter == 'Irshad Thematic' ? context.primary : Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: _selectedFilter == 'Irshad Thematic'
                                ? context.primary.withValues(alpha: 0.12)
                                : Colors.black.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'SOON',
                            style: TextStyle(
                              color: _selectedFilter == 'Irshad Thematic' ? context.primary : const Color(0xFFFDE047),
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontWeight: FontWeight.w600, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(width: 1, height: 28, color: Colors.white.withValues(alpha: 0.25), margin: const EdgeInsets.symmetric(horizontal: 4));
  }

  Widget _buildFilterRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(label: 'All', isSelected: _selectedFilter == 'All', onTap: () => _onFilterTap('All')),
          const SizedBox(width: 8),
          _FilterChip(label: 'Curated', isSelected: _selectedFilter == 'Curated', icon: Icons.verified_outlined, onTap: () => _onFilterTap('Curated')),
          const SizedBox(width: 8),
          _FilterChip(label: 'Custom', isSelected: _selectedFilter == 'Custom', icon: Icons.tune_rounded, onTap: () => _onFilterTap('Custom')),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Irshad Thematic',
            isSelected: _selectedFilter == 'Irshad Thematic',
            icon: Icons.auto_awesome_rounded,
            badgeText: 'SOON',
            onTap: () => _onFilterTap('Irshad Thematic'),
          ),
        ],
      ),
    );
  }

  Widget _buildFab(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 80 + MediaQuery.of(context).padding.bottom),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [context.primary, Color.lerp(context.primary, const Color(0xFF6C47FF), 0.6)!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(50),
          boxShadow: [
            BoxShadow(color: context.primary.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 6)),
          ],
        ),
        child: FloatingActionButton.extended(
          heroTag: null,
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const CreateBasketScreen()),
            );
            if (result == true && context.mounted) {
              context.read<BasketProvider>().fetchBaskets();
            }
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(Icons.add_rounded, color: Colors.white),
          label: const Text('Create custom basket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.2)),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.shopping_basket_outlined, size: 40, color: context.primary),
            ),
            const SizedBox(height: 20),
            Text('No baskets yet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
            const SizedBox(height: 8),
            Text(
              _selectedFilter == 'Custom'
                  ? 'Tap the button below to build\nyour first custom basket.'
                  : 'No baskets match this filter.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(BuildContext context, BasketProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off_rounded, color: context.haram, size: 48),
          const SizedBox(height: 16),
          Text('Failed to load baskets', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => provider.fetchBaskets(),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final IconData? icon;
  final String? badgeText;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    this.icon,
    this.badgeText,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? context.primary : context.bgAlt,
          borderRadius: BorderRadius.circular(50),
          border: Border.all(color: isSelected ? context.primary : context.divider),
          boxShadow: isSelected
              ? [BoxShadow(color: context.primary.withValues(alpha: 0.25), blurRadius: 10, offset: const Offset(0, 4))]
              : [],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: isSelected ? Colors.white : context.textMuted),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : context.textMuted,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            if (badgeText != null) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badgeText!,
                  style: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFFD97706),
                    fontSize: 8.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BasketCard extends StatelessWidget {
  final Basket basket;
  final VoidCallback onTap;

  const _BasketCard({required this.basket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final List<String> symbols = basket.symbols.map((s) => s.toString()).toList();
    final displaySymbols = symbols.take(4).toList();
    final remainingCount = symbols.length > 4 ? symbols.length - 4 : 0;
    final isCustom = basket.userId != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.divider),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 16, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top accent bar
            Container(
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isCustom
                      ? [context.primary, Color.lerp(context.primary, const Color(0xFF6C47FF), 0.7)!]
                      : [const Color(0xFF10B981), const Color(0xFF059669)],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              basket.name,
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.4),
                            ),
                            if (basket.description != null && basket.description!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  basket.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.4, fontWeight: FontWeight.w500),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: isCustom
                              ? context.primary.withValues(alpha: 0.08)
                              : const Color(0xFF10B981).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isCustom ? Icons.tune_rounded : Icons.auto_awesome_rounded,
                              size: 11,
                              color: isCustom ? context.primary : const Color(0xFF10B981),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isCustom ? 'CUSTOM' : 'THEMATIC',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: isCustom ? context.primary : const Color(0xFF10B981),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Bottom row: tickers + stock count + arrow
                  Row(
                    children: [
                      // Overlapping ticker avatars
                      if (displaySymbols.isNotEmpty)
                        SizedBox(
                          width: (displaySymbols.length * 26.0) + 10,
                          height: 34,
                          child: Stack(
                            children: List.generate(displaySymbols.length, (index) {
                              final colors = [
                                context.primary,
                                const Color(0xFF6C47FF),
                                const Color(0xFF10B981),
                                const Color(0xFFFF6B47),
                              ];
                              return Positioned(
                                left: index * 22.0,
                                child: Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: colors[index % colors.length],
                                    border: Border.all(color: context.bg, width: 2),
                                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 4)],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    displaySymbols[index].substring(0, 1),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                                  ),
                                ),
                              );
                            }),
                          ),
                        ),
                      const SizedBox(width: 8),
                      if (remainingCount > 0)
                        Text('+$remainingCount', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w700, fontSize: 13))
                      else if (symbols.isEmpty)
                        Text('No assets', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
                      const Spacer(),
                      Text(
                        '${symbols.length} stock${symbols.length == 1 ? '' : 's'}',
                        style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: context.bgAlt,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.arrow_forward_ios_rounded, size: 12, color: context.textMuted),
                      ),
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
}
