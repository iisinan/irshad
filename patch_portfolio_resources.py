import os

filepath = 'mobile/lib/features/portfolio/ui/portfolio_screen.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Replace length
content = content.replace("length: 5,", "length: 4,")

# Remove Tab
old_tabs = """              Tab(text: 'Zakat'),
              Tab(text: 'Resources'),
            ],"""
new_tabs = """              Tab(text: 'Zakat'),
            ],"""
content = content.replace(old_tabs, new_tabs)

# Remove TabBarView child
old_views = """            ZakatCalculatorScreen(isTab: true),
            ResourcesTab(),
          ],"""
new_views = """            ZakatCalculatorScreen(isTab: true),
          ],"""
content = content.replace(old_views, new_views)

with open(filepath, 'w') as f:
    f.write(content)
