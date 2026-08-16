import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/features/stocks/providers/stock_provider.dart';
import 'package:irshad_mobile/features/profile/data/user_activity_repository.dart';
import 'package:irshad_mobile/core/widgets/company_avatar.dart';

class AddAssetsBottomSheet extends StatefulWidget {
  final List<String> currentWatchlistSymbols;
  final VoidCallback onAdded;
  final String? preSelectedSymbol;

  const AddAssetsBottomSheet({
    super.key,
    required this.currentWatchlistSymbols,
    required this.onAdded,
    this.preSelectedSymbol,
  });

  @override
  State<AddAssetsBottomSheet> createState() => _AddAssetsBottomSheetState();
}

class _AddAssetsBottomSheetState extends State<AddAssetsBottomSheet> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  final List<String> _selectedSymbols = [];
  bool _isAdding = false;
  final _repository = UserActivityRepository();

  @override
  void initState() {
    super.initState();
    if (widget.preSelectedSymbol != null) {
      _selectedSymbols.add(widget.preSelectedSymbol!);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleSelection(String symbol) {
    setState(() {
      if (_selectedSymbols.contains(symbol)) {
        _selectedSymbols.remove(symbol);
      } else {
        _selectedSymbols.add(symbol);
      }
    });
  }

  Future<void> _handleSubmit() async {
    if (_selectedSymbols.isEmpty) return;
    setState(() => _isAdding = true);
    
    // Defaulting to alertInApp and alertEmail true, replicating the frontend behavior of opt-in by default
    final success = await _repository.addMultipleToWatchlist(
      _selectedSymbols,
      alertEmail: true,
      alertInApp: true,
    );
    
    if (success) {
      widget.onAdded();
      if (mounted) {
        Navigator.pop(context);
      }
    } else {
      if (mounted) {
        setState(() => _isAdding = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to add assets. Please try again.'),
            backgroundColor: context.haram,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final stocks = Provider.of<StockProvider>(context).ngxStocks;
    final availableStocks = stocks
        .where((s) => !widget.currentWatchlistSymbols.contains(s['symbol']))
        .toList();
    
    final filteredStocks = availableStocks.where((s) {
      final query = _searchQuery.toLowerCase();
      final symbol = (s['symbol'] as String?)?.toLowerCase() ?? '';
      final name = (s['name'] as String?)?.toLowerCase() ?? '';
      return symbol.contains(query) || name.contains(query);
    }).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.only(top: 24),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Add to Watchlist',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: context.textDark,
                              letterSpacing: -0.5)),
                      const SizedBox(height: 4),
                      Text('Select the assets you want to track.',
                          style: TextStyle(
                              color: context.textMuted, fontSize: 14)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: context.bgAlt,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.divider),
                    ),
                    child: Icon(Icons.close_rounded,
                        color: context.textMuted, size: 20),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search by symbol or name...',
                prefixIcon: Icon(Icons.search_rounded, color: context.textMuted),
                filled: true,
                fillColor: context.bgAlt,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Divider(height: 1, color: context.divider),
          Expanded(
            child: filteredStocks.isEmpty
                ? Center(
                    child: Text('No matching assets found.',
                        style: TextStyle(color: context.textMuted)))
                : ListView.builder(
                    itemCount: filteredStocks.length,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemBuilder: (context, index) {
                      final stock = filteredStocks[index];
                      final symbol = stock['symbol'] as String;
                      final name = stock['name'] as String? ?? '';
                      final isSelected = _selectedSymbols.contains(symbol);

                      return InkWell(
                        onTap: () => _toggleSelection(symbol),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? context.primary.withValues(alpha: 0.05)
                                : Colors.transparent,
                            border: Border(
                                bottom: BorderSide(
                                    color: context.divider.withValues(alpha: 0.5))),
                          ),
                          child: Row(
                            children: [
                              CompanyAvatar(
                                  symbol: symbol,
                                  logoUrl: stock['logo_url'],
                                  size: 40,
                                  borderRadius: 12),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(symbol,
                                        style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            color: context.textDark,
                                            fontSize: 15)),
                                    const SizedBox(height: 2),
                                    Text(name,
                                        style: TextStyle(
                                            color: context.textMuted,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: isSelected
                                          ? context.primary
                                          : context.divider,
                                      width: 2),
                                  color: isSelected
                                      ? context.primary
                                      : Colors.transparent,
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check_rounded,
                                        color: Colors.white, size: 16)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: ElevatedButton(
                onPressed:
                    _selectedSymbols.isEmpty || _isAdding ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  disabledBackgroundColor: context.primary.withValues(alpha: 0.5),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isAdding
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : Text(
                        'Add ${_selectedSymbols.isNotEmpty ? _selectedSymbols.length : ''} Assets',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
