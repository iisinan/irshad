import 'package:flutter/material.dart';
import 'dart:async';
import '../data/product_repository.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _productRepository = ProductRepository();
  List<Map<String, dynamic>> _searchResults = [];
  List<Map<String, dynamic>> _scanHistory = [];
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

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
    final history = await _productRepository.getScanHistory();
    setState(() => _scanHistory = history);
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
        final results = await _productRepository.searchProducts(query);
        if (mounted) {
          setState(() => _searchResults = results);
        }
      } catch (e) {
        // Handle error
      } finally {
        if (mounted) {
          setState(() => _isSearching = false);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Search Products', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
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
              : (_searchResults.isNotEmpty
                  ? _buildList('Search Results', _searchResults)
                  : _scanHistory.isNotEmpty
                      ? _buildList('Recent Scans', _scanHistory)
                      : _buildEmptyState()),
          ),
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
        style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: 'Brand name or product...',
          hintStyle: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
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
            padding: const EdgeInsets.only(bottom: 16, top: 4),
            child: Text(
              title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textDark),
            ),
          );
        }
        
        final product = items[index - 1];
        return _buildProductRow(product);
      },
    );
  }

  Widget _buildProductRow(Map<String, dynamic> product) {
    final status = product['status']?.toString().toLowerCase() ?? 'unknown';
    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? AppTheme.halal : (isNonHalal ? Colors.red : AppTheme.questionable);
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/product_details', arguments: product),
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
            // Status Icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isHalal ? Icons.check_circle_rounded : (isNonHalal ? Icons.cancel_rounded : Icons.help_rounded),
                color: statusColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product['name'],
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    product['brand'] ?? 'Unknown Brand',
                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.divider),
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
              child: const Icon(Icons.qr_code_scanner_rounded, size: 40, color: AppTheme.primary),
            ),
            const SizedBox(height: 24),
            const Text(
              'Verify Your Lifestyle',
              style: TextStyle(fontSize: 20, color: AppTheme.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            const Text(
              'Search for food, cosmetics, and household items\nto verify their Halal status instantly.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textMuted, height: 1.5, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
