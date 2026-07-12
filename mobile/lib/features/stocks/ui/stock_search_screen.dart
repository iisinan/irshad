import 'package:flutter/material.dart';
import 'dart:async';
import '../data/stock_repository.dart';

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

  // Theme Constants
  static const Color cardBg = Colors.white;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Search Market', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          _buildSearchField(),
          Expanded(
            child: _isSearching 
              ? _buildLoading() 
              : (_searchController.text.isNotEmpty
                  ? (_searchResults.isNotEmpty
                      ? _buildList('Search Results', _searchResults)
                      : _buildNoResults())
                  : (_history.isNotEmpty
                      ? _buildList('Recent Checks', _history)
                      : _buildEmptyState())),
          ),
        ],
      ),
    );
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
                color: AppTheme.haram.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search_off_rounded, size: 40, color: AppTheme.haram),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Results Found',
              style: TextStyle(fontSize: 20, color: AppTheme.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'We couldn\'t find any stocks matching "${_searchController.text}".\nPlease check the spelling and try again.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearch,
        style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: 'Search stock name or symbol...',
          hintStyle: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w400),
          prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primary),
          suffixIcon: _searchController.text.isNotEmpty 
            ? IconButton(
                icon: const Icon(Icons.clear_rounded, color: AppTheme.textMuted),
                onPressed: () {
                  _searchController.clear();
                  _onSearch('');
                },
              )
            : null,
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.divider, width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.textDark, width: 1.5),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildList(String title, List<Map<String, dynamic>> items) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: items.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16, top: 8),
            child: Text(
              title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textDark),
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
    
    Color statusColor = isHalal ? AppTheme.halal : (isNonHalal ? AppTheme.haram : AppTheme.questionable);
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));

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
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Row(
          children: [
            // Icon or Logo
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: stock['logo_url'] != null
                    ? null
                    : const LinearGradient(
                        colors: [AppTheme.primaryHover, AppTheme.primary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                color: stock['logo_url'] != null ? Colors.white : null,
                border: stock['logo_url'] != null
                    ? Border.all(color: AppTheme.divider, width: 1)
                    : null,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))
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
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(stock['name'], maxLines: 1, overflow: TextOverflow.ellipsis, 
                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                ],
              ),
            ),
            // Tag
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.bg,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: AppTheme.divider),
              ),
              child: Text(
                stock['sector']?.toUpperCase() ?? 'MARKET', 
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
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
                color: AppTheme.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.show_chart_rounded, size: 40, color: AppTheme.primary),
            ),
            const SizedBox(height: 24),
            const Text(
              'Search Market Stocks',
              style: TextStyle(fontSize: 20, color: AppTheme.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            const Text(
              'Search for Nigerian companies to find\nethical investment opportunities.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
