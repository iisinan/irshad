import 'package:flutter/material.dart';
import '../../profile/data/user_activity_repository.dart';

class ProductDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  final _activityRepository = UserActivityRepository();
  bool _isFavoriting = false;

  // Theme Constants
  static const Color bgColor = Color(0xFFF5F0E8);
  static const Color primaryGold = Color(0xFFC9A84C);
  static const Color textDark = Color(0xFF1A1208);
  static const Color textMuted = Color(0xFF9A8C70);
  static const Color divider = Color(0xFFE8E2D9);

  void _onFavorite() async {
    setState(() => _isFavoriting = true);
    final success = await _activityRepository.addToFavorites('product', widget.product['id']);
    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Added to favorites'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: textDark,
          ),
        );
      }
    }
    setState(() => _isFavoriting = false);
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.product['status']?.toString().toLowerCase() ?? 'unknown';
    
    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? const Color(0xFF2E7D32) : (isNonHalal ? Colors.red : const Color(0xFFD97706));
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));
    String statusLabel = isHalal ? 'CERTIFIED HALAL' : (isNonHalal ? 'NOT HALAL' : 'QUESTIONABLE');

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Product Status', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
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
                  // Product Info Card
                  _buildSectionHeader('Product Information'),
                  const SizedBox(height: 12),
                  _buildProductInfoCard(),
                  const SizedBox(height: 32),
                  
                  // Reasoning
                  _buildSectionHeader('Validation Basis'),
                  const SizedBox(height: 12),
                  _buildReasoningCard(statusColor),
                  const SizedBox(height: 32),
                  
                  // Ingredients Section
                  _buildSectionHeader('Ingredients Breakdown'),
                  const SizedBox(height: 12),
                  _buildIngredientsSection(),
                  const SizedBox(height: 48),

                  // Submission CTA
                  _buildContributionCard(),
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
              label == 'CERTIFIED HALAL' ? Icons.verified_user_rounded : 
              label == 'NOT HALAL' ? Icons.gpp_bad_rounded : Icons.help_outline_rounded,
              color: color, 
              size: 56
            ),
          ),
          const SizedBox(height: 24),
          Text(label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(widget.product['name'] ?? 'N/A', 
            style: const TextStyle(color: textDark, fontSize: 16, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
          const SizedBox(height: 4),
          Text(widget.product['brand'] ?? 'Unknown Brand', 
            style: const TextStyle(color: textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildProductInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: Column(
        children: [
          _buildInfoRow('Barcode', widget.product['barcode'] ?? 'N/A'),
          const Divider(color: divider, height: 24),
          _buildInfoRow('NAFDAC Reg.', widget.product['nafdac_number'] ?? 'Pending'),
          const Divider(color: divider, height: 24),
          _buildInfoRow('Region', 'Nigeria'),
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

  Widget _buildReasoningCard(Color statusColor) {
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
          Text(
            widget.product['status_reason'] ?? 'Classification based on automated ingredient analysis and/or scholar verification.',
            style: const TextStyle(color: textMuted, height: 1.6, fontSize: 14, fontWeight: FontWeight.w400),
          ),
          if (widget.product['verified_by_scholar'] == true) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_rounded, size: 14, color: Colors.blue),
                  SizedBox(width: 8),
                  Text('SCHOLAR VERIFIED', style: TextStyle(color: Colors.blue, fontSize: 10, fontWeight: FontWeight.w900)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIngredientsSection() {
    final ingredients = widget.product['ingredients'] as List?;
    
    if (ingredients == null || ingredients.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        width: double.infinity,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: divider)),
        child: const Text('Ingredient data not available.', textAlign: TextAlign.center, style: TextStyle(color: textMuted)),
      );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: ingredients.map((i) {
        final iStatus = i['status']?.toString().toLowerCase() ?? 'doubtful';
        bool iHalal = iStatus == 'halal';
        bool iNonHalal = iStatus == 'non-halal';
        Color iColor = iHalal ? primaryGold : (iNonHalal ? Colors.red : const Color(0xFFD97706));
        
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: divider),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 4, height: 4, decoration: BoxDecoration(color: iColor, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(
                i['name'],
                style: const TextStyle(color: textDark, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildContributionCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: primaryGold, 
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Inaccurate data?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 8),
          Text(
            'Help the community by submitting corrections or missing labels for this product.',
            style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/submit_product', arguments: widget.product['barcode']),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: primaryGold,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text('Submit Correction', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}
