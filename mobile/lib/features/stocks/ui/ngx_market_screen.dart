import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/stock_provider.dart';

class NgxMarketScreen extends StatefulWidget {
  const NgxMarketScreen({super.key});

  @override
  State<NgxMarketScreen> createState() => _NgxMarketScreenState();
}

class _NgxMarketScreenState extends State<NgxMarketScreen> {
  // Theme Constants
  static const Color bgColor = Color(0xFFF5F0E8);
  static const Color primaryGold = Color(0xFFC9A84C);
  static const Color textDark = Color(0xFF1A1208);
  static const Color textMuted = Color(0xFF9A8C70);
  static const Color cardBg = Colors.white;
  static const Color divider = Color(0xFFE8E2D9);

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
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Live Stock Market', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: primaryGold),
            onPressed: _fetchNgxData,
          ),
        ],
      ),
      body: Consumer<StockProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.ngxStocks.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: primaryGold));
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
                  color: primaryGold,
                  onRefresh: _fetchNgxData,
                  child: filteredStocks.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Container(
                          height: MediaQuery.of(context).size.height * 0.6,
                          alignment: Alignment.center,
                          child: const Text('No stocks match the selected filters.', style: TextStyle(color: textMuted)),
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
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: textMuted, size: 20),
                    style: const TextStyle(fontWeight: FontWeight.w700, color: textDark, fontSize: 14),
                    items: ['Symbol (A-Z)', 'Symbol (Z-A)', 'Price (High-Low)', 'Price (Low-High)']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _sortBy = v);
                    },
                  ),
                ),
                IconButton(
                  icon: Icon(_isGridView ? Icons.view_agenda_rounded : Icons.grid_view_rounded, color: textDark, size: 22),
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
                  label: Text(s, style: TextStyle(color: _selectedSector == s ? Colors.white : textDark, fontWeight: FontWeight.w700, fontSize: 13)),
                  selected: _selectedSector == s,
                  selectedColor: textDark,
                  backgroundColor: bgColor,
                  showCheckmark: false,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: _selectedSector == s ? textDark : divider)),
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
          Icon(Icons.query_stats_rounded, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'No market data available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textMuted),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check back after the next market scrape.',
            style: TextStyle(color: Colors.grey),
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
        statusColor = const Color(0xFF2E7D32); // Green
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626); // Red
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = const Color(0xFFD97706); // Orange
        statusIcon = Icons.help_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                stock['symbol'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: textDark),
              ),
            ),
            Text(
              '₦ ${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: textDark),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              stock['name'] ?? '',
              style: const TextStyle(color: textMuted, fontWeight: FontWeight.w500, fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 6),
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                if (stock['sector'] != null) 
                  Text(stock['sector'], style: const TextStyle(color: textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
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
        statusColor = const Color(0xFF2E7D32);
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'non-halal':
        statusColor = const Color(0xFFDC2626);
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = const Color(0xFFD97706);
        statusIcon = Icons.help_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stock['symbol'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: textDark),
              ),
              Icon(statusIcon, size: 18, color: statusColor),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            stock['name'] ?? '',
            style: const TextStyle(color: textMuted, fontWeight: FontWeight.w500, fontSize: 12),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Text(
            '₦ ${(stock['latest_price'] ?? 0).toStringAsFixed(2)}',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: textDark),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}
