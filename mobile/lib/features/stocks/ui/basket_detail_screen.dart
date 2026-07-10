import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../providers/stock_provider.dart';

class BasketDetailScreen extends StatefulWidget {
  final dynamic basket;

  const BasketDetailScreen({super.key, required this.basket});

  @override
  State<BasketDetailScreen> createState() => _BasketDetailScreenState();
}

class _BasketDetailScreenState extends State<BasketDetailScreen> {
  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);
  static const Color compliantGreen = Color(0xFF16A34A);
  static const Color questionableAmber = Color(0xFFD97706);

  List<dynamic> _basketStocks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBasketStocks();
  }

  void _loadBasketStocks() async {
    // The symbols are stored as a JSON array string in the database
    List<String> symbols = [];
    if (widget.basket['symbols'] is String) {
      try {
        final decoded = jsonDecode(widget.basket['symbols']);
        symbols = List<String>.from(decoded);
      } catch (e) {
        debugPrint('Error decoding symbols: $e');
      }
    } else if (widget.basket['symbols'] is List) {
      symbols = List<String>.from(widget.basket['symbols']);
    }

    final provider = Provider.of<StockProvider>(context, listen: false);
    
    // Ensure we have stocks loaded
    if (provider.ngxStocks.isEmpty) {
      await provider.fetchNgxStocks();
    }

    // Filter stocks by symbols in basket
    final allStocks = provider.ngxStocks;
    setState(() {
      _basketStocks = allStocks.where((s) => symbols.contains(s['symbol'])).toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.basket['name'] ?? 'Basket Details',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: textDark,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.basket['description'] ?? '',
                    style: const TextStyle(
                      color: textMuted,
                      fontSize: 15,
                      height: 1.5,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'COMPONENTS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: textMuted,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: primaryGreen)),
            )
          else if (_basketStocks.isEmpty)
            const SliverFillRemaining(
              child: Center(child: Text('No stocks found in this basket', style: TextStyle(color: textMuted))),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      children: [
                        _buildStockRow(_basketStocks[index]),
                        if (index < _basketStocks.length - 1)
                          const Divider(color: divider, height: 1),
                      ],
                    ),
                  );
                },
                childCount: _basketStocks.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 200.0,
      floating: false,
      pinned: true,
      backgroundColor: bgColor,
      elevation: 0,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.white,
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: widget.basket['image_url'] != null
            ? Image.network(
                widget.basket['image_url'],
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200),
              )
            : Container(color: Colors.grey.shade200),
      ),
    );
  }

  Widget _buildStockRow(dynamic company) {
    final statusObj = company['status'];
    final statusStr = statusObj != null ? statusObj['status'].toString().toUpperCase() : 'QUESTIONABLE';
    final isCompliant = statusStr == 'HALAL';
    
    final latestPrice = num.tryParse(company['latest_price']?.toString() ?? '0') ?? 0.0;
    final isPositive = (company['price_change'] ?? 0) >= 0;
    final priceStr = '₦ ${latestPrice.toStringAsFixed(2)}';
    final changePct = num.tryParse(company['price_change_pct']?.toString() ?? '0') ?? 0.0;
    final changeStr = '${changePct.toStringAsFixed(2)}%';

    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/stock_details', arguments: company),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        company['symbol'],
                        style: const TextStyle(
                          color: textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: isCompliant ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusStr,
                          style: TextStyle(
                            color: isCompliant ? compliantGreen : questionableAmber,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    company['name'],
                    style: const TextStyle(color: textMuted, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  priceStr,
                  style: const TextStyle(
                    color: textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  changeStr,
                  style: TextStyle(
                    color: isPositive ? compliantGreen : Colors.red,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
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
