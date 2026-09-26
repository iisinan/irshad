import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD_BUTTON = """              const SizedBox(height: 16),
              GestureDetector(
                onTap: _addNewHoldingForm,
                child: Container(
                  width: double.infinity,"""

NEW_BUTTON = """              const SizedBox(height: 16),
              if (Provider.of<AppStateProvider>(context, listen: false).user?['tier']?['slug'] != 'free')
              GestureDetector(
                onTap: _addNewHoldingForm,
                child: Container(
                  width: double.infinity,"""

content = content.replace(OLD_BUTTON, NEW_BUTTON)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched Add Another Holding button")
