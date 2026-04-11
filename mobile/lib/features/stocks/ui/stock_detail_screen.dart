import 'package:flutter/material.dart';
import '../data/stock_repository.dart';
import '../../profile/data/user_activity_repository.dart';

class StockDetailScreen extends StatefulWidget {
  final Map<String, dynamic> stock;

  const StockDetailScreen({super.key, required this.stock});

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  final _stockRepository = StockRepository();
  final _activityRepository = UserActivityRepository();
  late Map<String, dynamic> _currentStock;
  bool _isLoading = false;
  bool _isFavoriting = false;
  final TextEditingController _purificationController = TextEditingController();
  double _purificationResult = 0;

  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  @override
  void initState() {
    super.initState();
    _currentStock = widget.stock;
  }

  void _onFavorite() async {
    setState(() => _isFavoriting = true);
    final success = await _activityRepository.addToFavorites('stock', _currentStock['id']);
    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Added to watchlist'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: textDark,
          ),
        );
      }
    }
    setState(() => _isFavoriting = false);
  }

  void _runScreening() async {
    setState(() => _isLoading = true);
    try {
      final updatedStock = await _stockRepository.checkStock(_currentStock['symbol']);
      if (updatedStock != null) {
        setState(() => _currentStock = updatedStock);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _calculatePurification(String value, double nonCompliantRevenuePercent) {
    if (value.isEmpty) {
      setState(() => _purificationResult = 0);
      return;
    }
    final amount = double.tryParse(value) ?? 0;
    setState(() {
      _purificationResult = amount * (nonCompliantRevenuePercent / 100);
    });
  }

  @override
  Widget build(BuildContext context) {
    final rawStatus = _currentStock['status'];
    String status = 'doubtful';
    String reason = 'Manual screening recommended.';

    if (rawStatus is Map) {
      status = rawStatus['status']?.toString().toLowerCase() ?? 'doubtful';
      reason = rawStatus['reason'] ?? 'Manual screening recommended.';
    } else if (rawStatus is String) {
      status = rawStatus.toLowerCase() == 'compliant' ? 'halal' : (rawStatus.toLowerCase() == 'non-halal' ? 'non-halal' : 'doubtful');
      reason = 'Classification based on NGX market report.';
    }
    
    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? const Color(0xFF16A34A) : (isNonHalal ? Colors.red : const Color(0xFFD97706));
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));
    String statusLabel = isHalal ? 'SHARIAH COMPLIANT' : (isNonHalal ? 'NOT COMPLIANT' : 'QUESTIONABLE');

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(_currentStock['symbol'], style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_isFavoriting ? Icons.favorite_rounded : Icons.favorite_outline_rounded, color: textDark, size: 22),
            onPressed: _isFavoriting ? null : _onFavorite,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   const Text('PRICE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textMuted)),
                   const SizedBox(height: 4),
                   Text(_currentStock['price'] ?? '₦ 0.00', 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textDark)),
                ],
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/brokerage/link'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Buy Now', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status Header
            _buildStatusHeader(statusColor, badgeBg, statusLabel),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   const SizedBox(height: 24),
                  // Company Metadata
                  _buildSectionHeader('Overview'),
                  const SizedBox(height: 12),
                  _buildCompanyInfo(),
                  const SizedBox(height: 32),
                  
                  // Financial Ratios
                  _buildSectionHeader('Financial Ratios (AAOIFI)'),
                  const SizedBox(height: 12),
                  _buildFinancialRatios(statusColor),
                  const SizedBox(height: 32),
                  
                  // Business Screening
                  _buildSectionHeader('Business Screening'),
                  const SizedBox(height: 12),
                  _buildBusinessScreening(statusColor, badgeBg, statusLabel, reason),
                  const SizedBox(height: 32),

                  // Purification
                  _buildPurificationCard(),
                  const SizedBox(height: 48),
                  
                  // Action Button
                  _buildScreeningButton(statusColor),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 1),
    );
  }

  Widget _buildStatusHeader(Color color, Color bg, String label) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: bg,
              shape: BoxShape.circle,
            ),
            child: Icon(
              label == 'SHARIAH COMPLIANT' ? Icons.check_circle_rounded : 
              label == 'NOT COMPLIANT' ? Icons.cancel_rounded : Icons.help_rounded,
              color: color, 
              size: 56
            ),
          ),
          const SizedBox(height: 24),
          Text(label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(_currentStock['name'] ?? 'N/A', 
            style: const TextStyle(color: textMuted, fontSize: 15, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildCompanyInfo() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(
        children: [
          _buildInfoRow('Sector', _currentStock['sector'] ?? 'Unknown'),
          const Divider(color: divider, height: 24),
          _buildInfoRow('Exchange', 'NGX (Lagos)'),
          const Divider(color: divider, height: 24),
          _buildInfoRow('Standard', 'AAOIFI v2024'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(color: textDark, fontWeight: FontWeight.w800, fontSize: 14)),
      ],
    );
  }

  Widget _buildFinancialRatios(Color statusColor) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    
    final debt = latest?['total_debt']?.toDouble() ?? 0.0;
    final assets = latest?['total_assets']?.toDouble() ?? 1.0;
    final interest = latest?['interest_income']?.toDouble() ?? 0.0;
    // Normalize revenue for ratio if not present
    final revenue = (latest?['total_revenue']?.toDouble() ?? assets);
    
    final debtRatio = (debt / assets) * 100;
    final interestRatio = (interest / revenue) * 100;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(
        children: [
          _buildRatioBar('Debt to Asset Ratio', debtRatio, 33.0),
          const SizedBox(height: 24),
          _buildRatioBar('Cash & Interest Ratio', interestRatio, 5.0),
        ],
      ),
    );
  }

  Widget _buildRatioBar(String title, double value, double limit) {
    final isFail = value > limit;
    final progress = (value / (limit * 1.5)).clamp(0.0, 1.0);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(color: textDark, fontWeight: FontWeight.w700, fontSize: 14)),
            Text('${value.toStringAsFixed(2)}% / ${limit.toInt()}%', 
              style: TextStyle(color: isFail ? Colors.red : primaryGreen, fontWeight: FontWeight.w800, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 12),
        Stack(
          children: [
            Container(
              height: 8,
              width: double.infinity,
              decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(4)),
            ),
            Container(
              height: 8,
              width: (MediaQuery.of(context).size.width - 80) * progress,
              decoration: BoxDecoration(
                color: isFail ? Colors.red : primaryGreen, 
                borderRadius: BorderRadius.circular(4)
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBusinessScreening(Color statusColor, Color bg, String label, String reason) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(label == 'NOT COMPLIANT' ? Icons.error_outline : Icons.check_circle_outline, 
                color: statusColor, size: 20),
              const SizedBox(width: 10),
              Text(label == 'NOT COMPLIANT' ? 'Non-Halal Activities detected' : 'Business activities are Halal', 
                style: TextStyle(color: statusColor, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            reason,
            style: const TextStyle(color: textMuted, height: 1.5, fontSize: 14, fontWeight: FontWeight.w400),
          ),
        ],
      ),
    );
  }

  Widget _buildPurificationCard() {
    final nonCompliantRev = 1.25; 

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: textDark, 
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.volunteer_activism_rounded, color: primaryGreen, size: 20),
              const SizedBox(width: 10),
              const Text('Purification (Zakat al-Mustaghalat)', 
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Received non-halal dividends from this stock? Calculate your purification due.', 
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
          const SizedBox(height: 24),
          TextField(
            controller: _purificationController,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              hintText: 'Dividend amount...',
              hintStyle: const TextStyle(color: Colors.white24, fontWeight: FontWeight.w400),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              prefixText: '₦ ',
              prefixStyle: const TextStyle(color: primaryGreen, fontWeight: FontWeight.w800),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: primaryGreen)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            onChanged: (v) => _calculatePurification(v, nonCompliantRev),
          ),
          if (_purificationResult > 0) ...[
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  const Text('PURIFICATION AMOUNT', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('₦ ${_purificationResult.toStringAsFixed(2)}', 
                    style: const TextStyle(color: primaryGreen, fontSize: 32, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text('Purification rate: $nonCompliantRev%', 
                    style: const TextStyle(color: Colors.white30, fontSize: 11)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScreeningButton(Color color) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _runScreening,
        style: ElevatedButton.styleFrom(
          backgroundColor: textDark,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        child: _isLoading 
          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('REFRESH SCREENING', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      ),
    );
  }

  @override
  void dispose() {
    _purificationController.dispose();
    super.dispose();
  }
}
