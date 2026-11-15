import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api/api_service.dart';

class UpgradePaywallBottomSheet extends StatefulWidget {
  final String message;
  final String? requiredTier;
  final String? featureKey;
  final bool notifyThreshold;

  const UpgradePaywallBottomSheet({
    super.key,
    required this.message,
    this.requiredTier,
    this.featureKey,
    this.notifyThreshold = true,
  });

  @override
  State<UpgradePaywallBottomSheet> createState() => _UpgradePaywallBottomSheetState();
}

class _UpgradePaywallBottomSheetState extends State<UpgradePaywallBottomSheet> {
  static final RegExp _sensitiveTerms = RegExp(
    r'\b(upgrade|website|membership|memberships|subscribe|subscription|plan|plans|billing|rawdha|noor|miftah|exclusive|unlock)\b',
    caseSensitive: false,
  );

  @override
  void initState() {
    super.initState();
    if (widget.notifyThreshold) {
      unawaited(_notifyBackendThreshold());
    }
  }

  String _inferFeatureKey(String raw) {
    if (widget.featureKey != null && widget.featureKey!.isNotEmpty) {
      return widget.featureKey!;
    }
    final lower = raw.toLowerCase();
    if (lower.contains('screen')) return 'stock_screens_per_month';
    if (lower.contains('portfolio') || lower.contains('holding')) return 'portfolio_limit';
    if (lower.contains('watchlist') || lower.contains('price alert') || lower.contains('alerts')) return 'watchlist_limit';
    if (lower.contains('basket')) return 'baskets';
    if (lower.contains('purif')) return 'purifications_per_month';
    if (lower.contains('zakat')) return 'zakat_calc';
    if (lower.contains('dividend')) return 'dividend_alerts';
    if (lower.contains('drift')) return 'drift_tracking';
    if (lower.contains('spotlight') || lower.contains('digest')) return 'monthly_spotlight';
    return 'general';
  }

  Future<void> _notifyBackendThreshold() async {
    try {
      await ApiService().post('subscription/threshold-hit', {
        'feature': _inferFeatureKey(widget.message),
        if (widget.requiredTier != null) 'required_tier': widget.requiredTier,
      });
    } catch (_) {
      // Silent background telemetry; never surface errors in UI
    }
  }

  String _neutralizeMessage(String raw) {
    final lower = raw.toLowerCase();
    if (!_sensitiveTerms.hasMatch(raw)) {
      return raw;
    }
    if (lower.contains('screen')) {
      return 'You have reached the stock screening limit for this period on your current account.';
    }
    if (lower.contains('portfolio') || lower.contains('holding')) {
      return 'You have reached the portfolio holding limit for your current account.';
    }
    if (lower.contains('watchlist') || lower.contains('alert')) {
      return 'Watchlist alerts are not available or have reached the limit on your current account.';
    }
    if (lower.contains('basket')) {
      return 'This basket feature has reached its limit or is unavailable on your current account.';
    }
    if (lower.contains('purif')) {
      return 'Dividend purification has reached its limit or is unavailable on your current account.';
    }
    if (lower.contains('zakat')) {
      return 'Automated Zakat calculations are currently unavailable on your account.';
    }
    if (lower.contains('dividend')) {
      return 'Dividend alerts are currently unavailable on your account.';
    }
    if (lower.contains('drift')) {
      return '90-day drift tracking is currently unavailable on your account.';
    }
    if (lower.contains('spotlight') || lower.contains('digest') || lower.contains('monthly')) {
      return 'Monthly digest insights are currently unavailable on your account.';
    }
    return 'This feature has reached its limit or is currently unavailable on your account.';
  }

  @override
  Widget build(BuildContext context) {
    final displayMessage = _neutralizeMessage(widget.message);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
            margin: const EdgeInsets.only(bottom: 24),
          ),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF0F3A40).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.info_outline_rounded, color: Color(0xFF0A192F), size: 32),
          ),
          const SizedBox(height: 20),
          Text(
            'Account Limit Reached',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0A192F),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            displayMessage,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 15,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0A192F),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: Text(
                'Got it',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
