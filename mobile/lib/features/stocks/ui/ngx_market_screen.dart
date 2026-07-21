import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/stock_provider.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../../../core/widgets/company_avatar.dart';
class NgxMarketScreen extends StatefulWidget {
  const NgxMarketScreen({super.key});

  @override
  State<NgxMarketScreen> createState() => _NgxMarketScreenState();
}

class _NgxMarketScreenState extends State<NgxMarketScreen> {
  // Theme Constants
  String _selectedSector = 'All';
  String _sortBy = 'Symbol (A-Z)';
  bool _isGridView = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      final provider = Provider.of<StockProvider>(context, listen: false);
      if (!provider.isLoading) {
        provider.fetchNgxStocks(loadMore: true);
      }
    }
  }

  Future<void> _fetchNgxData() async {
    await Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
  }

  List<Map<String, dynamic>> _getFilteredAndSortedStocks(List<dynamic> allStocks) {
    List<Map<String, dynamic>> list = allStocks
        .cast<Map<String, dynamic>>()
        .where((s) => ((s['latest_price'] ?? 0) as num).toDouble() > 0)
        .toList();
    
    if (_selectedSector != 'All') {
      list = list.where((s) => s['sector'] == _selectedSector).toList();
    }
    
    if (_sortBy == 'Symbol (A-Z)') {
      list.sort((a, b) => (a['symbol'] ?? '').compareTo(b['symbol'] ?? ''));
    } else if (_sortBy == 'Symbol (Z-A)') {
      list.sort((a, b) => (b['symbol'] ?? '').compareTo(a['symbol'] ?? ''));
    } else if (_sortBy == 'Price (High-Low)') {
      list.sort((a, b) => ((b['latest_price'] ?? 0) as num).compareTo((a['latest_price'] ?? 0) as num));
    } else if (_sortBy == 'Price (Low-High)') {
      list.sort((a, b) => ((a['latest_price'] ?? 0) as num).compareTo((b['latest_price'] ?? 0) as num));
    }
    
    return list;
  }

  List<String> _getSectors(List<dynamic> allStocks) {
    final sectors = allStocks
        .map((s) => s['sector'] as String?)
        .where((s) => s != null && s.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList();
    sectors.sort();
    return ['All', ...sectors];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Live Stock Market', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: context.primary),
            onPressed: _fetchNgxData,
          ),
        ],
      ),
      body: Consumer<StockProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.ngxStocks.isEmpty) {
            return Center(child: CircularProgressIndicator(color: context.primary));
          }

          if (provider.ngxStocks.isEmpty) {
            return _buildEmptyState();
          }

          final filteredStocks = _getFilteredAndSortedStocks(provider.ngxStocks);
          final sectors = _getSectors(provider.ngxStocks);

          return Column(
            children: [
              _buildFilters(sectors),
              Expanded(
                child: RefreshIndicator(
                  color: context.primary,
                  onRefresh: _fetchNgxData,
                  child: filteredStocks.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Container(
                          height: MediaQuery.of(context).size.height * 0.6,
                          alignment: Alignment.center,
                          child: Text('No stocks match the selected filters.', style: TextStyle(color: context.textMuted)),
                        ),
                      )
                    : _isGridView
                        ? GridView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.all(16.0),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.85,
                            ),
                            itemCount: filteredStocks.length + (provider.isLoading ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index == filteredStocks.length) {
                                return Center(child: CircularProgressIndicator(color: context.primary));
                              }
                              return _buildGridCard(filteredStocks[index]);
                            },
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.all(16.0),
                            itemCount: filteredStocks.length + (provider.isLoading ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index == filteredStocks.length) {
                                return Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Center(child: CircularProgressIndicator(color: context.primary)),
                                );
                              }
                              return _buildStockCard(filteredStocks[index]);
                            },
                          ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilters(List<String> sectors) {
    return Container(
      color: context.bgAlt,
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sort & View Toggle
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _sortBy,
                    icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.textMuted, size: 20),
                    style: TextStyle(fontWeight: FontWeight.w700, color: context.textDark, fontSize: 14),
                    items: ['Symbol (A-Z)', 'Symbol (Z-A)', 'Price (High-Low)', 'Price (Low-High)']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _sortBy = v);
                    },
                  ),
                ),
                IconButton(
                  icon: Icon(_isGridView ? Icons.view_agenda_rounded : Icons.grid_view_rounded, color: context.textDark, size: 22),
                  onPressed: () => setState(() => _isGridView = !_isGridView),
                )
              ],
            ),
          ),
          // Sectors
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: sectors.map((s) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(s, style: TextStyle(color: _selectedSector == s ? Colors.white : context.textDark, fontWeight: FontWeight.w700, fontSize: 13)),
                  selected: _selectedSector == s,
                  selectedColor: context.textDark,
                  backgroundColor: context.bg,
                  showCheckmark: false,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: _selectedSector == s ? context.textDark : context.divider)),
                  onSelected: (selected) {
                    if (selected) setState(() => _selectedSector = s);
                  },
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.query_stats_rounded, size: 64, color: context.divider),
          const SizedBox(height: 16),
          Text(
            'No market data available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: context.textMuted),
          ),
          const SizedBox(height: 8),
          Text(
            'Check back after the next market scrape.',
            style: TextStyle(color: context.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildStockCard(Map<String, dynamic> stock) {
    final status = stock['status']?['status'] ?? 'doubtful';
    
    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'halal':
        statusColor = context.halal; // Green
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626); // Red
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = context.questionable; // Orange
        statusIcon = Icons.help_rounded;
    }

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/stock-detail', arguments: stock);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          border: Border(bottom: BorderSide(color: context.divider, width: 1)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Logo
            CompanyAvatar(
              logoUrl: stock['logo_url'],
              symbol: stock['symbol'] ?? 'S',
              size: 44,
              borderRadius: 22,
            ),
            const SizedBox(width: 14),
            // Ticker & Name
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stock['symbol'] ?? '',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: context.textDark, letterSpacing: -0.3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stock['name'] ?? '',
                    style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Sector
            Expanded(
              flex: 2,
              child: Align(
                alignment: Alignment.center,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    (stock['sector'] ?? 'Unknown').toUpperCase(),
                    style: TextStyle(
                      color: context.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
            // Price
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '₦${((stock['latest_price'] ?? 0) as num).toStringAsFixed(2)}',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: context.textDark),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGridCard(Map<String, dynamic> stock) {
    final status = stock['status']?['status'] ?? 'doubtful';
    
    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'halal':
        statusColor = context.halal;
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626);
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = context.questionable;
        statusIcon = Icons.help_rounded;
    }

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/stock-detail', arguments: stock);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CompanyAvatar(
                  logoUrl: stock['logo_url'],
                  symbol: stock['symbol'] ?? 'S',
                  size: 32,
                  borderRadius: 16,
                  fontSize: 14,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              stock['symbol'] ?? '',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark),
            ),
            const SizedBox(height: 4),
            Text(
              stock['name'] ?? '',
              style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500, fontSize: 12),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Text(
              '₦${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: context.textDark),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(100), // Pill shape
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(statusIcon, size: 12, color: statusColor),
                  const SizedBox(width: 4),
                  Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
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
}
