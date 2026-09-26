import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD_FUNC = """  void _showAddHoldingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddHoldingBottomSheet(),
    );
  }"""

NEW_FUNC = """  void _showAddHoldingSheet(BuildContext context) {
    final appState = Provider.of<AppStateProvider>(context, listen: false);
    final portfolioProvider = Provider.of<PortfolioProvider>(context, listen: false);
    final isFreePlan = appState.user?['tier']?['slug'] == 'free';
    
    if (isFreePlan && portfolioProvider.holdings.length >= 1) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => const UpgradePaywallBottomSheet(
          message: 'You have reached your portfolio limit of 1 stock on the Miftah plan. Upgrade to track more stocks.',
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddHoldingBottomSheet(),
    );
  }"""

content = content.replace(OLD_FUNC, NEW_FUNC)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched _showAddHoldingSheet")
