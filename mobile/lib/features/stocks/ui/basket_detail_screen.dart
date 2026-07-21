import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../providers/stock_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../../baskets/providers/basket_provider.dart';
import '../../portfolio/providers/portfolio_provider.dart';
import '../../../core/widgets/company_avatar.dart';

class BasketDetailScreen extends StatefulWidget {
  final dynamic basket;

  const BasketDetailScreen({super.key, required this.basket});

  @override
  State<BasketDetailScreen> createState() => _BasketDetailScreenState();
}

class _BasketDetailScreenState extends State<BasketDetailScreen> {
  List<dynamic> _basketStocks = [];
  bool _isLoading = true;
  
  double _avgChange = 0.0;
  int _halalCount = 0;
  dynamic _topPerformer;

  @override
  void initState() {
    super.initState();
    _loadBasketStocks();
  }

  void _loadBasketStocks() async {
    List<String> symbols = [];
    if (widget.basket['symbols'] is String) {
      try {
        final decoded = jsonDecode(widget.basket['symbols']);
        symbols = List<String>.from(decoded);
      } catch (e) {
        // ignore
      }
    } else if (widget.basket['symbols'] is List) {
      symbols = List<String>.from(widget.basket['symbols']);
    }

    final provider = Provider.of<StockProvider>(context, listen: false);
    
    if (provider.ngxStocks.isEmpty) {
      await provider.fetchNgxStocks();
    }

    final allStocks = provider.ngxStocks;
    final stocks = allStocks.where((s) => symbols.contains(s['symbol'])).toList();
    
    double totalChange = 0;
    int halal = 0;
    dynamic top;
    double maxChange = -double.infinity;

    for (var stock in stocks) {
      final changePct = num.tryParse(stock['price_change_pct']?.toString() ?? '0')?.toDouble() ?? 0.0;
      totalChange += changePct;

      final statusStr = stock['status']?['status']?.toString().toUpperCase() ?? '';
      if (statusStr == 'HALAL') halal++;

      if (changePct > maxChange) {
        maxChange = changePct;
        top = stock;
      }
    }

    setState(() {
      _basketStocks = stocks;
      if (stocks.isNotEmpty) {
        _avgChange = totalChange / stocks.length;
        _halalCount = halal;
        _topPerformer = top;
      }
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              _buildSliverAppBar(),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.basket['name'] ?? 'Sector Details',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: context.textDark,
                          letterSpacing: -1,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.basket['description'] ?? '',
                        style: TextStyle(
                          color: context.textBody,
                          fontSize: 16,
                          height: 1.6,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // SECTOR INSIGHTS
                      _buildInsightsSection(),
                      
                      const SizedBox(height: 40),
                      Text(
                        'SECTOR COMPONENTS',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: context.textMuted,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
              if (_isLoading)
                SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: context.primary)),
                )
              else if (_basketStocks.isEmpty)
                SliverFillRemaining(
                  child: Center(child: Text('No stocks found in this sector', style: TextStyle(color: context.textMuted))),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.only(left: 16, right: 16, bottom: 120),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildStockCard(_basketStocks[index], index);
                      },
                      childCount: _basketStocks.length,
                    ),
                  ),
                ),
            ],
          ),
          
          // BOTTOM INVEST BUTTON
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: EdgeInsets.only(
                    left: 24, right: 24, top: 20, 
                    bottom: MediaQuery.of(context).padding.bottom + 20
                  ),
                  decoration: BoxDecoration(
                    color: context.bg.withOpacity(0.8),
                    border: Border(top: BorderSide(color: context.divider.withOpacity(0.5))),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [context.primary, context.primary.withOpacity(0.8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: context.primary.withOpacity(0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () => _showInvestSheet(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        minimumSize: const Size(double.infinity, 60),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Invest in Sector',
                            style: TextStyle(
                              fontSize: 18, 
                              fontWeight: FontWeight.bold, 
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 280.0,
      floating: false,
      pinned: true,
      backgroundColor: context.bg,
      elevation: 0,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              color: Colors.white.withOpacity(0.2),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ),
      ),
      actions: [
        if (widget.basket['user_id'] != null)
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  color: Colors.white.withOpacity(0.2),
                  child: IconButton(
                    icon: const Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                    onPressed: () async {
                      final result = await Navigator.pushNamed(context, '/edit_basket', arguments: widget.basket);
                      if (result == true) {
                        Navigator.pop(context, true);
                      }
                    },
                  ),
                ),
              ),
            ),
          )
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            widget.basket['image_url'] != null
                ? Image.network(
                    widget.basket['image_url'],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: context.divider),
                  )
                : Container(color: context.primary),
            // Gradient Overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.4),
                    Colors.black.withOpacity(0.1),
                    context.bg,
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightsSection() {
    if (_basketStocks.isEmpty) return const SizedBox.shrink();

    final isPositiveTrend = _avgChange >= 0;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _buildInsightCard(
                'Sector Trend',
                '${isPositiveTrend ? '+' : ''}${_avgChange.toStringAsFixed(2)}%',
                isPositiveTrend ? context.halal : context.haram,
                isPositiveTrend ? Icons.trending_up_rounded : Icons.trending_down_rounded,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildInsightCard(
                'Compliance',
                '$_halalCount/${_basketStocks.length}',
                context.primary,
                Icons.check_circle_outline_rounded,
              ),
            ),
          ],
        ),
        if (_topPerformer != null) ...[
          const SizedBox(height: 16),
          _buildTopPerformerCard(),
        ]
      ],
    );
  }

  Widget _buildInsightCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10, offset: const Offset(0, 4),
          )
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(title, style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(color: context.textDark, fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildTopPerformerCard() {
    final changePct = num.tryParse(_topPerformer['price_change_pct']?.toString() ?? '0') ?? 0.0;
    final isPositive = changePct >= 0;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [context.halalBg.withOpacity(0.5), context.bgAlt],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.halal.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.halal.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.star_rounded, color: context.halal, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Top Performer', style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(
                  _topPerformer['name'] ?? _topPerformer['symbol'],
                  style: TextStyle(color: context.textDark, fontSize: 16, fontWeight: FontWeight.bold),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isPositive ? '+' : ''}${changePct.toStringAsFixed(2)}%',
                style: TextStyle(color: context.halal, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 2),
              Text('Today', style: TextStyle(color: context.textMuted, fontSize: 11)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildStockCard(dynamic company, int index) {
    final statusObj = company['status'];
    final statusStr = statusObj != null ? statusObj['status'].toString().toUpperCase() : 'QUESTIONABLE';
    final isCompliant = statusStr == 'HALAL';
    
    final latestPrice = num.tryParse(company['latest_price']?.toString() ?? '0') ?? 0.0;
    final isPositive = (double.tryParse(company['price_change']?.toString() ?? '0') ?? 0) >= 0;
    final priceStr = '₦ ${latestPrice.toStringAsFixed(2)}';
    final changePct = num.tryParse(company['price_change_pct']?.toString() ?? '0') ?? 0.0;
    final changeStr = '${isPositive ? '+' : ''}${changePct.toStringAsFixed(2)}%';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => Navigator.pushNamed(context, '/stock_details', arguments: company),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CompanyAvatar(
                  logoUrl: company['logo_url'],
                  symbol: company['symbol'] ?? '???',
                  size: 48,
                  borderRadius: 14,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            company['symbol'],
                            style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 17),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isCompliant ? context.halalBg : context.questionableBg,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              statusStr,
                              style: TextStyle(
                                color: isCompliant ? context.halal : context.questionable,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        company['name'],
                        style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      priceStr,
                      style: TextStyle(color: context.textDark, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isPositive ? context.halalBg.withOpacity(0.5) : context.haramBg.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        changeStr,
                        style: TextStyle(
                          color: isPositive ? context.halal : context.haram,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showInvestSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _InvestBottomSheet(basket: widget.basket),
    );
  }
}

class _InvestBottomSheet extends StatefulWidget {
  final dynamic basket;

  const _InvestBottomSheet({required this.basket});

  @override
  State<_InvestBottomSheet> createState() => _InvestBottomSheetState();
}

class _InvestBottomSheetState extends State<_InvestBottomSheet> {
  final TextEditingController _amountController = TextEditingController(text: '1000');
  bool _isLoading = false;

  void _submit() async {
    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount < 1000) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Minimum investment is ₦1,000'), backgroundColor: context.haram),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    final provider = context.read<BasketProvider>();
    final result = await provider.investInBasket(widget.basket['id'], amount);
    
    setState(() => _isLoading = false);

    if (!mounted) return;
    Navigator.pop(context);

    if (result['success']) {
      if (mounted) context.read<PortfolioProvider>().fetchPortfolio();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Investment successful! 🎉'), backgroundColor: context.halal),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to invest'), backgroundColor: context.haram),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
      child: Container(
        padding: EdgeInsets.only(left: 24, right: 24, top: 32, bottom: bottomInset + 32),
        decoration: BoxDecoration(
          color: context.bg.withOpacity(0.9),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          border: Border.all(color: context.divider.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -5))
          ]
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 48, height: 5, decoration: BoxDecoration(color: context.divider, borderRadius: BorderRadius.circular(3))),
            ),
            const SizedBox(height: 32),
            Text(
              'Invest in ${widget.basket['name']}',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
            ),
            const SizedBox(height: 12),
            Text(
              'Enter the amount you wish to invest. It will be automatically distributed among the Shariah-compliant assets in this sector.',
              style: TextStyle(color: context.textBody, fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                color: context.bgAlt,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.primary.withOpacity(0.3), width: 2),
              ),
              child: TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: context.textDark),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  prefixText: '₦ ',
                  prefixStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: context.primary),
                  labelText: 'Amount',
                  labelStyle: TextStyle(color: context.textMuted, fontSize: 16),
                ),
              ),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 60,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [context.primary, context.primary.withOpacity(0.8)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: context.primary.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 8)),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
                    : const Text('Confirm Investment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
