import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/stock_provider.dart';

class CreateBasketScreen extends StatefulWidget {
  const CreateBasketScreen({super.key});

  @override
  State<CreateBasketScreen> createState() => _CreateBasketScreenState();
}

class _CreateBasketScreenState extends State<CreateBasketScreen> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  
  List<dynamic> _allStocks = [];
  List<String> _selectedSymbols = [];
  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadStocks();
  }

  void _loadStocks() {
    final provider = Provider.of<StockProvider>(context, listen: false);
    setState(() {
      _allStocks = provider.ngxStocks.where((s) {
        // Only allow halal or compliant stocks in baskets for safety
        final statusObj = s['status'];
        if (statusObj != null) {
          return statusObj['status']?.toString().toLowerCase() == 'halal';
        }
        return false;
      }).toList();
    });
  }

  Future<void> _createBasket() async {
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
      final response = await ApiService().post('stocks/baskets', {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'symbols': _selectedSymbols,
      });

      if (response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context, true); // Return true to indicate success
        }
      } else {
        _showError('Failed to create basket.');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppTheme.haram));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Create Basket', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _createBasket,
            child: _isSaving 
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Create', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primary)),
          )
        ],
      ),
      body: Column(
        children: [
          _buildForm(),
          const Divider(height: 1, color: AppTheme.divider),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Select Stocks (Halal Only)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.textDark)),
                Text('${_selectedSymbols.length} Selected', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          Expanded(
            child: _allStocks.isEmpty
                ? const Center(child: Text('No Halal stocks available to add.'))
                : ListView.builder(
                    itemCount: _allStocks.length,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemBuilder: (context, index) {
                      final stock = _allStocks[index];
                      final symbol = stock['symbol'];
                      final isSelected = _selectedSymbols.contains(symbol);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primary.withOpacity(0.05) : Colors.white,
                          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.divider),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: ListTile(
                          onTap: () {
                            setState(() {
                              if (isSelected) {
                                _selectedSymbols.remove(symbol);
                              } else {
                                _selectedSymbols.add(symbol);
                              }
                            });
                          },
                          leading: Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(10)),
                            alignment: Alignment.center,
                            child: Text(symbol.substring(0, 1), style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primary)),
                          ),
                          title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textDark)),
                          subtitle: Text(stock['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          trailing: isSelected 
                              ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary)
                              : const Icon(Icons.circle_outlined, color: AppTheme.divider),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        children: [
          TextField(
            controller: _nameController,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
            decoration: InputDecoration(
              hintText: 'Basket Name (e.g. Dividend Kings)',
              hintStyle: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w500),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descController,
            maxLines: 2,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Short description about this basket...',
              hintStyle: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w500),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }
}
