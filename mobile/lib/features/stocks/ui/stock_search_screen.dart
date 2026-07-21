import 'package:flutter/material.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import '../data/stock_repository.dart';
import '../providers/stock_provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class StockSearchScreen extends StatefulWidget {
  const StockSearchScreen({super.key});

  @override
  State<StockSearchScreen> createState() => _StockSearchScreenState();
}

class _StockSearchScreenState extends State<StockSearchScreen> {
  final _stockRepository = StockRepository();
  List<Map<String, dynamic>> _searchResults = [];
  List<Map<String, dynamic>> _history = [];
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  // Filter State
  bool _halalOnly = false;
  String _selectedSector = 'All';
  final List<String> _sectors = ['All', 'Financial Services', 'ICT', 'Consumer Goods', 'Oil and Gas', 'Healthcare', 'Agriculture', 'Industrial Goods'];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }
  
  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _fetchHistory() async {
    final history = await _stockRepository.getStockHistory();
    setState(() => _history = history);
  }

  void _onSearch(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final results = await _stockRepository.searchStocks(query);
        if (mounted) setState(() => _searchResults = results);
      } catch (e) {
        // Handle error
      } finally {
        if (mounted) setState(() => _isSearching = false);
      }
    });
  }

  void _toggleHalalOnly(bool value) {
    setState(() => _halalOnly = value);
  }

  void _selectSector(String sector) {
    setState(() => _selectedSector = sector);
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> list) {
    return list.where((stock) {
      final status = stock['status']?['status']?.toString().toLowerCase() ?? 'doubtful';
      final isHalal = status == 'halal';
      
      // Filter by halal
      if (_halalOnly && !isHalal) return false;
      
      // Filter by sector
      if (_selectedSector != 'All') {
        final stockSector = stock['sector']?.toString().toLowerCase() ?? '';
        if (stockSector != _selectedSector.toLowerCase()) return false;
      }
      
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    // If we have a query, use filtered search results
    // If no query but filters are active, use filtered cached stocks to browse
    // If no query and no filters, use history
    
    final bool isBrowsing = _searchController.text.isEmpty && (_selectedSector != 'All' || _halalOnly);
    
    List<Map<String, dynamic>> displayList = [];
    String listTitle = '';

    if (_searchController.text.isNotEmpty) {
      displayList = _applyFilters(_searchResults);
      listTitle = 'Search Results';
    } else if (isBrowsing) {
      final provider = Provider.of<StockProvider>(context, listen: false);
      displayList = _applyFilters(provider.ngxStocks);
      listTitle = 'Browsing: $_selectedSector';
    } else {
      displayList = _applyFilters(_history);
      listTitle = 'Recent Checks';
    }

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Search Market', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchField(),
          _buildFilterOptions(),
          const SizedBox(height: 8),
          Expanded(
            child: _isSearching 
              ? _buildLoading() 
              : ((_searchController.text.isNotEmpty || isBrowsing)
                  ? (displayList.isNotEmpty
                      ? _buildList(listTitle, displayList)
                      : _buildNoResults())
                  : (displayList.isNotEmpty
                      ? _buildList(listTitle, displayList)
                      : _buildEmptyState())),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterOptions() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Halal Only Toggle
          FilterChip(
            selected: _halalOnly,
            label: Row(
              children: [
                Icon(Icons.shield_rounded, size: 16, color: _halalOnly ? context.halal : context.textMuted),
                const SizedBox(width: 4),
                Text('Halal Only', style: TextStyle(color: _halalOnly ? context.textDark : context.textMuted, fontWeight: FontWeight.w700, fontSize: 13)),
              ],
            ),
            selectedColor: context.halal.withOpacity(0.15),
            backgroundColor: context.bgAlt,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: _halalOnly ? context.halal : context.divider, width: 1.5),
            ),
            onSelected: _toggleHalalOnly,
            showCheckmark: false,
          ),
          const SizedBox(width: 8),
          Container(height: 24, width: 1.5, color: context.divider, margin: const EdgeInsets.symmetric(horizontal: 4)),
          const SizedBox(width: 8),
          // Sectors
          ..._sectors.map((sector) {
            final isSelected = _selectedSector == sector;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(sector, style: TextStyle(color: isSelected ? Colors.white : context.textDark, fontWeight: FontWeight.w700, fontSize: 13)),
                selected: isSelected,
                selectedColor: context.primary,
                backgroundColor: context.bgAlt,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: isSelected ? context.primary : context.divider, width: 1.5),
                ),
                onSelected: (selected) {
                  if (selected) _selectSector(sector);
                },
                showCheckmark: false,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearch,
        style: TextStyle(color: context.textDark, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: 'Search stock name or symbol...',
          hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w400),
          prefixIcon: Icon(Icons.search_rounded, color: context.primary),
          suffixIcon: _searchController.text.isNotEmpty 
            ? IconButton(
                icon: Icon(Icons.clear_rounded, color: context.textMuted),
                onPressed: () {
                  _searchController.clear();
                  _onSearch('');
                },
              )
            : null,
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: context.divider, width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: context.primary, width: 1.5),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildList(String title, List<Map<String, dynamic>> items) {
    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
      itemCount: items.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16, top: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark),
                ),
                Text(
                  '${items.length} stocks',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted),
                ),
              ],
            ),
          );
        }
        
        final stock = items[index - 1];
        return _buildStockRow(stock);
      },
    );
  }

  Widget _buildStockRow(Map<String, dynamic> stock) {
    final status = stock['status']?['status']?.toString().toLowerCase() ?? 'doubtful';
    final isHalal = status == 'halal';
    final isNonHalal = status == 'non-halal';
    
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);

    return GestureDetector(
      onTap: () {
        // Fetch details in background to cache in history
        _stockRepository.getStockDetails(stock['symbol']);
        Navigator.pushNamed(context, '/stock_details', arguments: stock);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Row(
          children: [
            // Icon or Logo
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: stock['logo_url'] != null ? Colors.white : context.primary,
                border: stock['logo_url'] != null
                    ? Border.all(color: context.divider, width: 1)
                    : null,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: stock['logo_url'] != null
                    ? Image.network(
                        stock['logo_url'],
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(child: Icon(Icons.show_chart, color: Colors.white, size: 24)),
                      )
                    : const Center(
                        child: Icon(Icons.show_chart_rounded, color: Colors.white, size: 24),
                      ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stock['symbol'],
                    style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(stock['name'], maxLines: 1, overflow: TextOverflow.ellipsis, 
                    style: TextStyle(color: context.textMuted, fontSize: 13)),
                ],
              ),
            ),
            // Tag
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: context.bg,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: context.divider),
              ),
              child: Text(
                stock['sector']?.toUpperCase() ?? 'MARKET', 
                style: TextStyle(color: context.textMuted, fontSize: 9, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Center(child: CircularProgressIndicator(color: context.primary));
  }

  Widget _buildNoResults() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.haram.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.search_off_rounded, size: 40, color: context.haram),
            ),
            const SizedBox(height: 24),
            Text(
              'No Results Found',
              style: TextStyle(fontSize: 20, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'We couldn\'t find any stocks matching your criteria.\nPlease try a different search or filter.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.travel_explore_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text(
              'Discover Stocks',
              style: TextStyle(fontSize: 20, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'Search for specific stocks or use the filters above to browse sectors.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
