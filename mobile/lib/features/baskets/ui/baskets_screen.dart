import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/basket_provider.dart';
import '../models/basket.dart';
import '../../stocks/ui/basket_detail_screen.dart';
import '../../stocks/ui/create_basket_screen.dart';

class BasketsScreen extends StatefulWidget {
  const BasketsScreen({super.key});

  @override
  State<BasketsScreen> createState() => _BasketsScreenState();
}

class _BasketsScreenState extends State<BasketsScreen> {
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BasketProvider>().fetchBaskets();
    });
  }

  void _onFilterTap(String label) {
    if (label == 'Thematic') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
              SizedBox(width: 10),
              Text('Thematic baskets are coming soon!', style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          backgroundColor: const Color(0xFF6C47FF),
        ),
      );
      return;
    }
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
              : _selectedFilter == 'Thematic'
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
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: _buildFilterRow(),
                  ),
                ),
                if (filtered.isEmpty)
                  SliverFillRemaining(child: _buildEmptyState(context))
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
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
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeroHeader(BuildContext context, List<Basket> baskets) {
    final customCount = baskets.where((b) => b.userId != null).length;
    final totalTickers = baskets.fold<int>(0, (sum, b) => sum + (b.symbols?.length ?? 0));

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        padding: const EdgeInsets.all(24),
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
                  child: const Icon(Icons.shopping_basket_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Your Baskets', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: -0.5)),
                    Text('Halal-screened collections', style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontWeight: FontWeight.w600, fontSize: 12)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                _buildStat('${baskets.length}', 'Total Baskets'),
                _buildStatDivider(),
                _buildStat('$customCount', 'Custom'),
                _buildStatDivider(),
                _buildStat('$totalTickers', 'Tickers'),
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
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontWeight: FontWeight.w600, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(width: 1, height: 32, color: Colors.white.withValues(alpha: 0.25), margin: const EdgeInsets.symmetric(horizontal: 4));
  }

  Widget _buildFilterRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(label: 'All', isSelected: _selectedFilter == 'All', onTap: () => _onFilterTap('All')),
          const SizedBox(width: 8),
          _FilterChip(label: 'Custom', isSelected: _selectedFilter == 'Custom', icon: Icons.tune_rounded, onTap: () => _onFilterTap('Custom')),
          const SizedBox(width: 8),
          _FilterChip(label: 'Thematic', isSelected: _selectedFilter == 'Thematic', icon: Icons.auto_awesome_rounded, onTap: () => _onFilterTap('Thematic')),
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
              width: 80, height: 80,
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
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.isSelected, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? context.primary : context.bgAlt,
          borderRadius: BorderRadius.circular(50),
          border: Border.all(color: isSelected ? context.primary : context.divider),
          boxShadow: isSelected ? [BoxShadow(color: context.primary.withValues(alpha: 0.25), blurRadius: 10, offset: const Offset(0, 4))] : [],
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
    final List<String> symbols = (basket.symbols ?? []).map((s) => s.toString()).toList();
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
                                  width: 34, height: 34,
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
