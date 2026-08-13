  Widget _buildAaoifiBreakdown(Color statusColor, Color bg, String label, String reason, bool isHalal, bool isNonHalal) {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;
    
    final debt = _parseDouble(latest?['total_debt']);
    final marketCap = _parseDouble(latest?['market_cap']);
    final safeMarketCap = marketCap > 0 ? marketCap : 1.0;
    
    final interest = _parseDouble(latest?['interest_income']);
    final rawRevenue = _parseDouble(latest?['total_revenue']);
    final revenue = rawRevenue > 0.0 ? rawRevenue : safeMarketCap;
    
    final cashAndEquivalents = _parseDouble(latest?['cash_and_equivalents']);
    final interestBearingSecurities = _parseDouble(latest?['interest_bearing_securities']);
    final cash = cashAndEquivalents + interestBearingSecurities;

    final debtRatio = marketCap > 0 ? (debt / marketCap) * 100 : 0.0;
    final interestRatio = revenue > 0 ? (interest / revenue) * 100 : 0.0;
    final cashRatio = marketCap > 0 ? (cash / marketCap) * 100 : 0.0;

    String formatAmt(double amt) {
      if (amt == 0) return '0';
      String s = amt.toStringAsFixed(0);
      return s.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }

    final rawDebtFail = debtRatio > 30.0;
    final rawInterestFail = interestRatio > 5.0;
    final rawCashFail = cashRatio > 30.0;

    final lowerReason = reason.toLowerCase();
    final isDebtFail = rawDebtFail || lowerReason.contains('rule 2') || lowerReason.contains('debt limit');
    final isInterestFail = rawInterestFail || lowerReason.contains('rule 4') || lowerReason.contains('interest income');
    final isCashFail = rawCashFail || lowerReason.contains('rule 3') || lowerReason.contains('cash & securities');

    final isBusinessFail = lowerReason.contains('rule 1') ||
        lowerReason.contains('business activity') ||
        lowerReason.contains('sector check') ||
        lowerReason.contains('prohibited') ||
        lowerReason.contains('banking') ||
        lowerReason.contains('financial business') ||
        lowerReason.contains('alcohol') ||
        (isNonHalal && !isDebtFail && !isInterestFail && !isCashFail);

    Widget buildCalculationCard(String numLabel, String denLabel, String numVal, String denVal) {
      return Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: context.bg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orangeAccent.withValues(alpha: 0.3)),
            ),
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            child: Column(
              children: [
                Text('CALCULATION', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                const SizedBox(height: 16),
                Text(numLabel, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Container(height: 1, width: 200, color: context.divider),
                const SizedBox(height: 8),
                Text(denLabel, style: TextStyle(color: context.textDark, fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(numLabel, style: TextStyle(color: context.textMuted, fontSize: 13)),
              Text('₦$numVal', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: context.divider, height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(denLabel, style: TextStyle(color: context.textMuted, fontSize: 13)),
              Text('₦$denVal', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        ],
      );
    }

    final nonCompliantRev = latest != null && latest['non_compliant_income_ratio'] != null 
        ? _parseDouble(latest['non_compliant_income_ratio']) 
        : (isNonHalal ? 100.0 : 0.0);
    final compliantRev = 100.0 - nonCompliantRev;

    Widget buildSegmentStat(String title, double val, Color color) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 4, height: 32, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text('${val.toStringAsFixed(2)}%', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900, fontSize: 14)),
            ],
          ),
        ],
      );
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(Icons.shield_rounded, color: Colors.orangeAccent, size: 22),
                      const SizedBox(width: 8),
