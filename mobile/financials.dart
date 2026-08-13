  Widget _buildFinancialHighlights() {
    final financials = _currentStock['financials'];
    final latest = (financials != null && financials is List && financials.isNotEmpty) ? financials[0] : null;

    final assets = _parseDouble(latest?['total_assets']);
    final debt = _parseDouble(latest?['total_debt']);
    final revenue = _parseDouble(latest?['total_revenue']);
    final interest = _parseDouble(latest?['interest_income']);

    String formatAmt(double amt) {
      if (amt == 0) return 'N/A';
      if (amt >= 1e12) return '₦${(amt / 1e12).toStringAsFixed(2)}T';
      if (amt >= 1e9) return '₦${(amt / 1e9).toStringAsFixed(2)}B';
      if (amt >= 1e6) return '₦${(amt / 1e6).toStringAsFixed(2)}M';
      return '₦${amt.toStringAsFixed(0)}';
    }

    // Debt is a warning if high
    final marketCap = _parseDouble(latest?['market_cap']);
    final debtRatio = marketCap > 0 ? (debt / marketCap) * 100 : 0.0;
    final interestRatio = revenue > 0 ? (interest / revenue) * 100 : 0.0;
    final debtColor = debtRatio > 30 ? context.haram : (debtRatio > 20 ? context.questionable : null);
    final interestColor = interestRatio > 5 ? context.haram : (interestRatio > 3 ? context.questionable : null);

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('TOTAL ASSETS', assets > 0 ? formatAmt(assets) : 'N/A', icon: Icons.account_balance_outlined)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('TOTAL DEBT', debt > 0 ? formatAmt(debt) : '₦0', icon: Icons.credit_card_outlined, valueColor: debtColor)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMetricCard('TOTAL REVENUE', revenue > 0 ? formatAmt(revenue) : 'N/A', icon: Icons.trending_up_rounded)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('INTEREST INCOME', interest > 0 ? formatAmt(interest) : '₦0', icon: Icons.percent_rounded, valueColor: interestColor)),
          ],
        ),
      ],
    );
  }
