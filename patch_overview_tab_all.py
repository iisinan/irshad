import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD_SHEET = """  void _showAddHoldingSheet(BuildContext context) {
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

NEW_SHEET = """  void _showAddHoldingSheet(BuildContext context) {
    final appState = Provider.of<AppStateProvider>(context, listen: false);
    final portfolioProvider = Provider.of<PortfolioProvider>(context, listen: false);
    final tierSlug = appState.user?['tier']?['slug'];
    final currentHoldings = portfolioProvider.holdings.length;
    
    int limit = -1;
    String planName = 'Noor';
    if (tierSlug == 'free') {
      limit = 1;
      planName = 'Miftah';
    } else if (tierSlug == 'pro') {
      limit = 7;
      planName = 'Rawdah';
    }
    
    if (limit != -1 && currentHoldings >= limit) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => UpgradePaywallBottomSheet(
          message: 'You have reached your portfolio limit of $limit stocks on the $planName plan. Upgrade to track more stocks.',
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

OLD_BUTTON = """              if (Provider.of<AppStateProvider>(context, listen: false).user?['tier']?['slug'] != 'free')
              GestureDetector(
                onTap: _addNewHoldingForm,
                child: Container(
                  width: double.infinity,"""

NEW_BUTTON = """              Builder(builder: (context) {
                final tierSlug = Provider.of<AppStateProvider>(context, listen: false).user?['tier']?['slug'];
                final currentTotal = Provider.of<PortfolioProvider>(context, listen: false).holdings.length + _holdings.length;
                int limit = -1;
                if (tierSlug == 'free') limit = 1;
                else if (tierSlug == 'pro') limit = 7;
                
                if (limit != -1 && currentTotal >= limit) return const SizedBox.shrink();
                
                return GestureDetector(
                  onTap: _addNewHoldingForm,
                  child: Container(
                    width: double.infinity,"""

content = content.replace(OLD_SHEET, NEW_SHEET)
content = content.replace(OLD_BUTTON, NEW_BUTTON)

# Need to add one more closing brace for Builder widget
OLD_END = """                      Text('Add Another Holding', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ],
          ),"""

NEW_END = """                      Text('Add Another Holding', style: TextStyle(color: context.primary, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              );
              }),
            ],
          ),"""

content = content.replace(OLD_END, NEW_END)

open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched ALL UI limits")
