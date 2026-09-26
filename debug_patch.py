import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD = """    if (limit != -1 && currentHoldings >= limit) {
      showModalBottomSheet("""

NEW = """    print("DEBUG _showAddHoldingSheet: tierSlug=$tierSlug, currentHoldings=$currentHoldings, limit=$limit");
    if (limit != -1 && currentHoldings >= limit) {
      showModalBottomSheet("""

content = content.replace(OLD, NEW)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
