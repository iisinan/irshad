import 'package:flutter/material.dart';
import '../../../../core/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import 'stock_detail_screen.dart';

class StockScreenerScreen extends StatefulWidget {
  const StockScreenerScreen({super.key});

  @override
  State<StockScreenerScreen> createState() => _StockScreenerScreenState();
}

class _StockScreenerScreenState extends State<StockScreenerScreen> {
  bool _isLoading = false;
  List<dynamic> _results = [];
  String _errorMessage = '';

  // Filter state
  List<String> _selectedStatuses = [];
  List<String> _selectedSectors = [];
  double? _minMarketCap;
  double? _maxPe;

  @override
  void initState() {
    super.initState();
    _applyFilters();
  }

  Future<void> _applyFilters() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final Map<String, dynamic> queryParams = {};
      if (_selectedStatuses.isNotEmpty) queryParams['status'] = _selectedStatuses.join(',');
      if (_selectedSectors.isNotEmpty) queryParams['sector'] = _selectedSectors.join(',');
      if (_minMarketCap != null) queryParams['min_market_cap'] = _minMarketCap;
      if (_maxPe != null) queryParams['pe_max'] = _maxPe;

      final response = await ApiService().get('stocks/ngx', queryParameters: queryParams);
      if (response.statusCode == 200 && response.data['status'] == 'success') {
        if (mounted) {
          setState(() {
            _results = response.data['data'];
          });
        }
      } else {
        if (mounted) setState(() => _errorMessage = 'Failed to load screener data.');
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = 'Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showFilterBottomSheet() {
    // Temporary variables for the bottom sheet state
    List<String> tempStatuses = List.from(_selectedStatuses);
    List<String> tempSectors = List.from(_selectedSectors);
    double? tempMinCap = _minMarketCap;
    double? tempMaxPe = _maxPe;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.bgAlt,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return StatefulBuilder(builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: Container(
              padding: const EdgeInsets.all(24),
              height: MediaQuery.of(context).size.height * 0.7,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: context.textDark)),
                      IconButton(
                        icon: Icon(Icons.close, color: context.textMuted),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  Divider(color: context.divider),
                  Expanded(
                    child: ListView(
                      children: [
                        const SizedBox(height: 16),
                        Text('Compliance Status', style: TextStyle(fontWeight: FontWeight.w600, color: context.textDark)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: ['halal', 'doubtful', 'non-halal'].map((status) {
                            final isSelected = tempStatuses.contains(status);
                            return FilterChip(
                              label: Text(status.toUpperCase(), style: TextStyle(color: isSelected ? Colors.black : context.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                              selected: isSelected,
                              selectedColor: context.primary,
                              backgroundColor: context.bg,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? context.primary : context.divider)),
                              onSelected: (bool selected) {
                                setModalState(() {
                                  if (selected) {
                                    tempStatuses.add(status);
                                  } else {
                                    tempStatuses.remove(status);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                        Text('Sector', style: TextStyle(fontWeight: FontWeight.w600, color: context.textDark)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: ['Financial Services', 'Technology', 'Healthcare', 'Consumer Goods', 'Industrial Goods', 'Oil and Gas'].map((sector) {
                            final isSelected = tempSectors.contains(sector);
                            return FilterChip(
                              label: Text(sector, style: TextStyle(color: isSelected ? Colors.black : context.textMuted, fontSize: 12)),
                              selected: isSelected,
                              selectedColor: context.primary,
                              backgroundColor: context.bg,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? context.primary : context.divider)),
                              onSelected: (bool selected) {
                                setModalState(() {
                                  if (selected) {
                                    tempSectors.add(sector);
                                  } else {
                                    tempSectors.remove(sector);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                        Text('Max P/E Ratio', style: TextStyle(fontWeight: FontWeight.w600, color: context.textDark)),
                        Slider(
                          value: tempMaxPe ?? 50.0,
                          min: 0,
                          max: 100,
                          divisions: 20,
                          activeColor: context.primary,
                          inactiveColor: context.divider,
                          label: tempMaxPe != null ? tempMaxPe!.toStringAsFixed(1) : 'Any',
                          onChanged: (value) {
                            setModalState(() {
                              tempMaxPe = value == 100 ? null : value;
                            });
                          },
                        ),
                        Center(
                          child: Text(
                            tempMaxPe != null ? '< ${tempMaxPe!.toStringAsFixed(1)}' : 'Any',
                            style: TextStyle(color: context.textMuted),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                      ),
                      onPressed: () {
                        setState(() {
                          _selectedStatuses = List.from(tempStatuses);
                          _selectedSectors = List.from(tempSectors);
                          _minMarketCap = tempMinCap;
                          _maxPe = tempMaxPe;
                        });
                        Navigator.pop(context);
                        _applyFilters();
                      },
                      child: const Text('Apply Filters', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () {
                        setModalState(() {
                          tempStatuses.clear();
                          tempSectors.clear();
                          tempMinCap = null;
                          tempMaxPe = null;
                        });
                      },
                      child: Text('Clear All', style: TextStyle(color: context.textMuted)),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFilterBar(),
        Divider(height: 1, thickness: 1, color: context.divider),
        Expanded(
          child: _isLoading
              ? Center(child: CircularProgressIndicator(color: context.primary))
              : _errorMessage.isNotEmpty
                  ? Center(child: Text(_errorMessage, style: TextStyle(color: context.haram)))
                  : _results.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _applyFilters,
                          color: context.primary,
                          backgroundColor: context.bgAlt,
                          child: ListView.builder(
                            itemCount: _results.length,
                            padding: const EdgeInsets.only(bottom: 100, top: 12),
                            itemBuilder: (context, index) {
                              return _buildStockItem(_results[index]);
                            },
                          ),
                        ),
        ),
      ],
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
                color: context.primary.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.search_off_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text(
              'No Matches Found',
              style: TextStyle(fontSize: 20, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'Try adjusting your filters or expanding your search criteria.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _selectedStatuses.clear();
                  _selectedSectors.clear();
                  _minMarketCap = null;
                  _maxPe = null;
                });
                _applyFilters();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: context.textDark,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
                minimumSize: const Size(200, 50),
              ),
              child: const Text('Clear Filters', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    int activeFiltersCount = _selectedStatuses.length + _selectedSectors.length + (_minMarketCap != null ? 1 : 0) + (_maxPe != null ? 1 : 0);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            GestureDetector(
              onTap: _showFilterBottomSheet,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: activeFiltersCount > 0 ? context.primary.withValues(alpha: 0.2) : Colors.transparent,
                  border: Border.all(color: activeFiltersCount > 0 ? context.primary : context.divider),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.tune_rounded, color: activeFiltersCount > 0 ? context.primary : context.textMuted, size: 16),
                    if (activeFiltersCount > 0) ...[
                      const SizedBox(width: 4),
                      Text('$activeFiltersCount', style: TextStyle(color: context.primary, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: context.divider),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Text('🇳🇬', style: TextStyle(fontSize: 14)), // Flag for NGX
                  SizedBox(width: 6),
                  Text('NGX listed', style: TextStyle(color: context.textDark, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (_selectedStatuses.isNotEmpty) ...[
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: context.divider),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Text(_selectedStatuses.join(', ').toUpperCase(), style: TextStyle(color: context.textDark, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
             if (_selectedSectors.isNotEmpty) ...[
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: context.divider),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Text('${_selectedSectors.length} Sectors', style: TextStyle(color: context.textDark, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStockItem(dynamic stock) {
    final statusObj = stock['status'];
    final statusString = statusObj != null ? statusObj['status'].toString().toLowerCase() : 'review';
    
    Color statusColor = context.review;
    Color statusBg = context.review.withValues(alpha: 0.1);
    
    if (statusString == 'halal') {
      statusColor = context.halal;
      statusBg = context.halalBg;
    } else if (statusString == 'non-halal') {
      statusColor = context.haram;
      statusBg = context.haramBg;
    } else if (statusString == 'doubtful') {
      statusColor = context.questionable;
      statusBg = context.questionableBg;
    }

    String displayStatus = statusString.toUpperCase();
    if (statusString == 'halal') displayStatus = 'COMPLIANT';
    if (statusString == 'non-halal') displayStatus = 'NON-COMPLIANT';

    final priceChange = double.tryParse(stock['price_change']?.toString() ?? '0') ?? 0.0;
    final priceChangePct = double.tryParse(stock['price_change_pct']?.toString() ?? '0') ?? 0.0;
    final isPositive = priceChange >= 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: context.divider.withValues(alpha: 0.5), width: 1),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => StockDetailScreen(stock: stock)),
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            stock['symbol'],
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: context.textDark, letterSpacing: -0.5),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(20)),
                            child: Text(
                              displayStatus,
                              style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                            ),
                          ),
                      const SizedBox(width: 6),
                      Icon(Icons.flag_outlined, color: context.textMuted.withValues(alpha: 0.5), size: 14),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    stock['name'] ?? stock['sector'] ?? 'Unknown',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, color: context.textMuted),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₦${stock['latest_price']}',
                  style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16, color: context.textDark),
                ),
                const SizedBox(height: 4),
                Text(
                  '${isPositive ? '+' : ''}${priceChangePct.toStringAsFixed(2)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.w400,
                    fontSize: 14,
                    color: isPositive ? context.halal : context.haram,
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
}

