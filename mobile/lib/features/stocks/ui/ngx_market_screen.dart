import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/stock_provider.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class NgxMarketScreen extends StatefulWidget {
  const NgxMarketScreen({super.key});

  @override
  State<NgxMarketScreen> createState() => _NgxMarketScreenState();
}

class _NgxMarketScreenState extends State<NgxMarketScreen> {
  // Theme Constants
  static const Color cardBg = Colors.white;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
    });
  }

  String _selectedSector = 'All';
  String _sortBy = 'Symbol (A-Z)';
  bool _isGridView = false;

  Future<void> _fetchNgxData() async {
    await Provider.of<StockProvider>(context, listen: false).fetchNgxStocks();
  }

  List<Map<String, dynamic>> _getFilteredAndSortedStocks(List<dynamic> allStocks) {
    List<Map<String, dynamic>> list = List<Map<String, dynamic>>.from(allStocks);
    
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
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Live Stock Market', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.primary),
            onPressed: _fetchNgxData,
          ),
        ],
      ),
      body: Consumer<StockProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.ngxStocks.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
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
                  color: AppTheme.primary,
                  onRefresh: _fetchNgxData,
                  child: filteredStocks.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Container(
                          height: MediaQuery.of(context).size.height * 0.6,
                          alignment: Alignment.center,
                          child: const Text('No stocks match the selected filters.', style: TextStyle(color: AppTheme.textMuted)),
                        ),
                      )
                    : _isGridView
                        ? GridView.builder(
                            padding: const EdgeInsets.all(16.0),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.85,
                            ),
                            itemCount: filteredStocks.length,
                            itemBuilder: (context, index) => _buildGridCard(filteredStocks[index]),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16.0),
                            itemCount: filteredStocks.length,
                            itemBuilder: (context, index) => _buildStockCard(filteredStocks[index]),
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
      color: Colors.white,
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
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textMuted, size: 20),
                    style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textDark, fontSize: 14),
                    items: ['Symbol (A-Z)', 'Symbol (Z-A)', 'Price (High-Low)', 'Price (Low-High)']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _sortBy = v);
                    },
                  ),
                ),
                IconButton(
                  icon: Icon(_isGridView ? Icons.view_agenda_rounded : Icons.grid_view_rounded, color: AppTheme.textDark, size: 22),
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
                  label: Text(s, style: TextStyle(color: _selectedSector == s ? Colors.white : AppTheme.textDark, fontWeight: FontWeight.w700, fontSize: 13)),
                  selected: _selectedSector == s,
                  selectedColor: AppTheme.textDark,
                  backgroundColor: AppTheme.bg,
                  showCheckmark: false,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: _selectedSector == s ? AppTheme.textDark : AppTheme.divider)),
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
          Icon(Icons.query_stats_rounded, size: 64, color: AppTheme.divider),
          const SizedBox(height: 16),
          const Text(
            'No market data available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check back after the next market scrape.',
            style: TextStyle(color: AppTheme.textMuted),
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
        statusColor = AppTheme.halal; // Green
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626); // Red
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = AppTheme.questionable; // Orange
        statusIcon = Icons.help_rounded;
    }

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/stock-detail', arguments: stock);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: AppTheme.divider, width: 1)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Logo
            stock['logo_url'] != null ? 
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  image: DecorationImage(image: NetworkImage(stock['logo_url']), fit: BoxFit.contain)
                ),
              ) :
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primary.withOpacity(0.1),
                ),
                alignment: Alignment.center,
                child: Text((stock['symbol'] ?? 'S')[0], style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 18)),
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
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.textDark, letterSpacing: -0.3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stock['name'] ?? '',
                    style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w500, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Compliance Pill
            Expanded(
              flex: 2,
              child: Align(
                alignment: Alignment.center,
                child: Container(
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
              ),
            ),
            // Price & Sector
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₦${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 2),
                  if (stock['sector'] != null)
                    Text(
                      stock['sector'].length > 10 ? '${stock['sector'].substring(0, 10)}...' : stock['sector'], 
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
        statusColor = AppTheme.halal;
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626);
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = AppTheme.questionable;
        statusIcon = Icons.help_rounded;
    }

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/stock-detail', arguments: stock);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                stock['logo_url'] != null ? 
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        image: DecorationImage(image: NetworkImage(stock['logo_url']), fit: BoxFit.contain)
                      ),
                    ) :
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primary.withOpacity(0.1),
                      ),
                      alignment: Alignment.center,
                      child: Text((stock['symbol'] ?? 'S')[0], style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              stock['symbol'] ?? '',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.textDark),
            ),
            const SizedBox(height: 4),
            Text(
              stock['name'] ?? '',
              style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w500, fontSize: 12),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Text(
              '₦${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.textDark),
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
