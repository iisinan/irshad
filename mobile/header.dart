  Widget _buildStatusHeader(Color color, Color bg, String label, {bool purificationRequired = false, double percent = 0.0, bool scholarVerified = false}) {
    final latestPrice = num.tryParse(_currentStock['latest_price']?.toString() ?? '0') ?? 0.0;
    final priceChange = _currentStock['price_change_pct'] != null ? double.tryParse(_currentStock['price_change_pct'].toString()) : null;
    final isUp = (priceChange ?? 0) >= 0;

    String mainLabel = label;
    String subLabel = '';
    
    if (purificationRequired) {
      mainLabel = 'SHARIAH COMPLIANT';
      subLabel = 'WITH PURIFICATION (${percent.toStringAsFixed(2)}%)';
    }

    return Container(
      width: double.infinity,
      color: context.bg,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Company name
          Text(
            _currentStock['name'] ?? '',
            style: TextStyle(color: context.textMuted, fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          // Price
          Text(
            '₦${latestPrice.toStringAsFixed(2)}',
            style: TextStyle(fontSize: 42, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1.5),
          ),
          if (priceChange != null) ...[
            const SizedBox(height: 8),
            // Change pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: (isUp ? context.halal : context.haram).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isUp ? Icons.arrow_drop_up_rounded : Icons.arrow_drop_down_rounded,
                    size: 20,
                    color: isUp ? context.halal : context.haram,
                  ),
                  Text(
                    '${isUp ? '+' : ''}${priceChange.toStringAsFixed(2)}%',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isUp ? context.halal : context.haram,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 18),
          // Verdict badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: color.withValues(alpha: 0.4), width: 2),
              boxShadow: [
                BoxShadow(color: color.withValues(alpha: 0.18), blurRadius: 20, offset: const Offset(0, 8)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      mainLabel.contains('COMPLIANT') && !mainLabel.contains('NON') ? Icons.check_circle_rounded :
                      mainLabel.contains('NON-COMPLIANT') ? Icons.cancel_rounded : Icons.help_rounded,
                      color: color,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        mainLabel,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.3),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
                if (purificationRequired) ...[
                  const SizedBox(height: 7),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      subLabel,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color, letterSpacing: 0.2),
                    ),
                  ),
                ],
                if (scholarVerified) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified_rounded, size: 13, color: color.withValues(alpha: 0.75)),
                      const SizedBox(width: 4),
                      Text(
                        'SCHOLAR VERIFIED',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: color.withValues(alpha: 0.75), letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

