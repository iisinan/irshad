import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../../../../core/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/stock_provider.dart';

class EditBasketScreen extends StatefulWidget {
  final dynamic basket;

  const EditBasketScreen({super.key, required this.basket});

  @override
  State<EditBasketScreen> createState() => _EditBasketScreenState();
}

class _EditBasketScreenState extends State<EditBasketScreen> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _searchController = TextEditingController();
  
  List<dynamic> _allStocks = [];
  List<dynamic> _filteredStocks = [];
  List<String> _selectedSymbols = [];
  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.basket['name'] ?? '';
    _descController.text = widget.basket['description'] ?? '';
    
    // Parse symbols
    try {
      if (widget.basket['symbols'] is String) {
        final decoded = jsonDecode(widget.basket['symbols']);
        _selectedSymbols = List<String>.from(decoded);
      } else if (widget.basket['symbols'] is List) {
        _selectedSymbols = List<String>.from(widget.basket['symbols']);
      }
    } catch (e) {
      // ignore
    }

    _loadStocks();
    _searchController.addListener(_filterStocks);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _loadStocks() {
    final provider = Provider.of<StockProvider>(context, listen: false);
    setState(() {
      _allStocks = provider.ngxStocks.where((s) {
        final statusObj = s['status'];
        if (statusObj != null) {
          return statusObj['status']?.toString().toLowerCase() == 'halal';
        }
        return false;
      }).toList();
      _filteredStocks = _allStocks;
    });
  }

  void _filterStocks() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredStocks = _allStocks;
      } else {
        _filteredStocks = _allStocks.where((s) {
          final symbol = s['symbol'].toString().toLowerCase();
          final name = (s['name'] ?? '').toString().toLowerCase();
          return symbol.contains(query) || name.contains(query);
        }).toList();
      }
    });
  }

  Future<void> _updateBasket() async {
    if (_nameController.text.trim().isEmpty) {
      _showError('Please enter a basket name.');
      return;
    }
    if (_selectedSymbols.length < 2) {
      _showError('Please select at least 2 stocks.');
      return;
    }

    setState(() => _isSaving = true);
    
    try {
      final response = await ApiService().put('stocks/baskets/${widget.basket['id']}', {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'symbols': _selectedSymbols,
      });

      if (response.statusCode == 200) {
        if (mounted) {
          Navigator.pop(context, true); // Return true to indicate success
        }
      } else {
        _showError('Failed to update basket.');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: context.haram));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Edit Basket', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: context.textDark, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _buildForm()),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Select Stocks', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: context.textDark, letterSpacing: -0.5)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: context.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text('${_selectedSymbols.length} Selected', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search halal stocks...',
                        hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500),
                        prefixIcon: Icon(Icons.search_rounded, color: context.textMuted),
                        filled: true,
                        fillColor: context.bgAlt,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      ),
                    ),
                  ),
                ),
                if (_filteredStocks.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Text('No stocks found.', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500)),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final stock = _filteredStocks[index];
                          final symbol = stock['symbol'];
                          final isSelected = _selectedSymbols.contains(symbol);

                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? context.primary.withValues(alpha: 0.05) : context.bgAlt,
                              border: Border.all(color: isSelected ? context.primary.withValues(alpha: 0.5) : Colors.transparent, width: 1.5),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: () {
                                  setState(() {
                                    if (isSelected) {
                                      _selectedSymbols.remove(symbol);
                                    } else {
                                      _selectedSymbols.add(symbol);
                                    }
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(12.0),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 48, height: 48,
                                        decoration: BoxDecoration(
                                          color: isSelected ? context.primary : context.bg,
                                          borderRadius: BorderRadius.circular(12),
                                          boxShadow: [
                                            if (isSelected)
                                              BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))
                                          ]
                                        ),
                                        alignment: Alignment.center,
                                        child: isSelected 
                                            ? const Icon(Icons.check_rounded, color: Colors.white)
                                            : Text(symbol.substring(0, 1), style: TextStyle(fontWeight: FontWeight.w900, color: context.primary, fontSize: 18)),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(symbol, style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16)),
                                            const SizedBox(height: 4),
                                            Text(stock['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: context.halal.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text('HALAL', style: TextStyle(color: context.halal, fontSize: 10, fontWeight: FontWeight.w900)),
                                      )
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                        childCount: _filteredStocks.length,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: context.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Basket Details', style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 14, letterSpacing: 0.5)),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
              decoration: InputDecoration(
                hintText: 'E.g. Dividend Kings',
                hintStyle: TextStyle(color: context.divider, fontWeight: FontWeight.w700),
                filled: true,
                fillColor: context.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descController,
              maxLines: 2,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                hintText: 'What is the strategy for this basket?',
                hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500),
                filled: true,
                fillColor: context.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final isValid = _nameController.text.trim().isNotEmpty && _selectedSymbols.length >= 2;
    
    return Container(
      padding: EdgeInsets.only(left: 20, right: 20, top: 16, bottom: MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        color: context.bg,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), offset: const Offset(0, -4), blurRadius: 16),
        ],
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: _isSaving ? null : () {
            if (!isValid) {
              _showError('Enter a name and select at least 2 stocks.');
              return;
            }
            _updateBasket();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: isValid ? context.primary : context.divider,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: isValid ? 4 : 0,
            shadowColor: context.primary.withValues(alpha: 0.4),
          ),
          child: _isSaving 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
              : Text('Save Basket', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
        ),
      ),
    );
  }
}
