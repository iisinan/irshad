import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/basket_provider.dart';
import '../../stocks/ui/basket_detail_screen.dart';
import '../../stocks/ui/create_basket_screen.dart';

class BasketsScreen extends StatefulWidget {
  const BasketsScreen({super.key});

  @override
  State<BasketsScreen> createState() => _BasketsScreenState();
}

class _BasketsScreenState extends State<BasketsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BasketProvider>().fetchBaskets();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      floatingActionButton: Padding(
        padding: EdgeInsets.only(bottom: 80 + MediaQuery.of(context).padding.bottom),
        child: FloatingActionButton.extended(
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const CreateBasketScreen()),
            );
            if (result == true && context.mounted) {
              context.read<BasketProvider>().fetchBaskets();
            }
          },
          backgroundColor: context.primary,
          icon: const Icon(Icons.add_rounded, color: Colors.white),
          label: const Text('Custom Basket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ),
      body: Consumer<BasketProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, color: context.haram, size: 48),
                  const SizedBox(height: 16),
                  Text(provider.error!, style: TextStyle(color: context.textDark)),
                  TextButton(
                    onPressed: () => provider.fetchBaskets(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchBaskets(),
            child: ListView(
              padding: const EdgeInsets.only(top: 16, left: 16, right: 16, bottom: 100),
              children: [
                // Filter Chips (Placeholder / Visual Only for now)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(label: 'All', isSelected: true),
                      const SizedBox(width: 8),
                      _FilterChip(label: 'Custom', isSelected: false),
                      const SizedBox(width: 8),
                      _FilterChip(label: 'Thematic', isSelected: false),
                      const SizedBox(width: 8),
                      _FilterChip(label: 'Equities', isSelected: false),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                if (provider.baskets.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Center(
                      child: Text(
                        'No baskets available right now.',
                        style: TextStyle(color: context.textMuted),
                      ),
                    ),
                  )
                else
                  ...provider.baskets.map((basket) {
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
                  }).toList(),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;

  const _FilterChip({required this.label, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? context.primary.withValues(alpha: 0.1) : context.bgAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSelected ? context.primary : context.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isSelected ? context.primary : context.textMuted,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            ),
          ),
          if (isSelected) ...[
            const SizedBox(width: 4),
            Icon(Icons.check, size: 16, color: context.primary),
          ],
        ],
      ),
    );
  }
}

class _BasketCard extends StatelessWidget {
  final dynamic basket;
  final VoidCallback onTap;

  const _BasketCard({required this.basket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final List<dynamic> symbols = basket.symbols is String 
        ? (basket.symbols.isNotEmpty && basket.symbols.startsWith('[')) ? [] /* Fallback parsing if needed but already parsed in provider */ : []
        : basket.symbols;
        
    final displaySymbols = symbols.take(2).toList();
    final remainingCount = symbols.length > 2 ? symbols.length - 2 : 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    basket.name,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: context.textDark,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.divider.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    basket.user_id != null ? 'CUSTOM' : 'THEMATIC',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: context.textMuted,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              basket.description ?? 'No description provided for this basket.',
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: context.textMuted,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                if (displaySymbols.isNotEmpty)
                  SizedBox(
                    width: (displaySymbols.length * 28.0) + 10,
                    height: 36,
                    child: Stack(
                      children: List.generate(displaySymbols.length, (index) {
                        return Positioned(
                          left: index * 24.0,
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: context.primary,
                              border: Border.all(color: context.bgAlt, width: 2),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              displaySymbols[index].toString().substring(0, 1),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                if (remainingCount > 0)
                  Text(
                    '+ $remainingCount more',
                    style: TextStyle(
                      color: context.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                if (symbols.isEmpty)
                  Text(
                    'No assets',
                    style: TextStyle(
                      color: context.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
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
