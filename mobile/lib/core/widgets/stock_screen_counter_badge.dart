import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/providers/app_state_provider.dart';
import 'package:irshad_mobile/core/widgets/upgrade_paywall_bottom_sheet.dart';

/// Displays the live AAOIFI stock screen quota counter (e.g. `Monthly Screens: 1 / 3`
/// or `Quarterly Screens: 4 / 30`) and opens the upgrade sheet when tapped.
class StockScreenCounterBadge extends StatelessWidget {
  final Map<String, dynamic>? fallbackUsage;
  final bool compact;

  const StockScreenCounterBadge({
    super.key,
    this.fallbackUsage,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final profile = appState.userProfile;
    final tier = profile?['tier'] as Map<String, dynamic>?;
    final tierSlug = (tier?['slug'] ?? 'free').toString();
    final features = tier?['features'] as Map<String, dynamic>?;
    final summaryUsage = profile?['usage_summary']?['stock_screens_per_month'];

    Map<String, dynamic>? usage;
    if (summaryUsage is Map) {
      usage = Map<String, dynamic>.from(summaryUsage);
    } else if (fallbackUsage != null) {
      usage = Map<String, dynamic>.from(fallbackUsage!);
    } else if (appState.isAuthenticated && tier != null) {
      final rawLimit = features?['stock_screens_per_month'];
      final int inferredLimit = rawLimit is num
          ? rawLimit.toInt()
          : (tierSlug == 'max' ? -1 : (tierSlug == 'pro' ? 30 : 3));
      if (inferredLimit > 0) {
        usage = {
          'used': 0,
          'limit': inferredLimit,
          'remaining': inferredLimit,
          'period': tierSlug == 'pro' ? 'quarter' : 'month',
        };
      }
    }

    if (usage == null) return const SizedBox.shrink();

    final int limit = (usage['limit'] as num?)?.toInt() ?? -1;
    if (limit == -1) return const SizedBox.shrink();

    final int used = (usage['used'] as num?)?.toInt() ?? 0;
    final int remaining = (usage['remaining'] as num?)?.toInt() ??
        (limit - used).clamp(0, limit);
    final bool isQuarterly =
        usage['period']?.toString() == 'quarter' ||
        tierSlug == 'pro' ||
        limit == 30;
    final bool isExhausted = remaining <= 0;

    final Color bgColor = isExhausted
        ? Colors.red.withValues(alpha: 0.10)
        : const Color(0xFFD9A05B).withValues(alpha: 0.14);
    final Color borderColor = isExhausted
        ? Colors.red.withValues(alpha: 0.30)
        : const Color(0xFFD9A05B).withValues(alpha: 0.38);
    final Color textColor =
        isExhausted ? Colors.red.shade700 : const Color(0xFFB45309);

    final String label = compact
        ? 'Screens: $used / $limit'
        : '${isQuarterly ? 'Quarterly' : 'Monthly'} Screens: $used / $limit';

    return InkWell(
      borderRadius: BorderRadius.circular(compact ? 100 : 10),
      onTap: () {
        final String requiredTier = tierSlug == 'pro' ? 'max' : 'pro';
        final String message = 'You have used $used of $limit stock screenings in the current ${isQuarterly ? 'quarter' : 'month'}.';
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => UpgradePaywallBottomSheet(
            message: message,
            requiredTier: requiredTier,
            featureKey: 'stock_screens_per_month',
            notifyThreshold: used >= limit,
          ),
        );
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 10 : 12,
          vertical: compact ? 5 : 6,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(compact ? 100 : 10),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isExhausted
                  ? Icons.lock_outline_rounded
                  : Icons.verified_user_outlined,
              size: compact ? 13 : 14,
              color: textColor,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: compact ? 11 : 12,
                fontWeight: FontWeight.w800,
                color: textColor,
                letterSpacing: -0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
