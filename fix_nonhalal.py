import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('nonHalalColor', 'Colors.red')

with open(filepath, 'w') as f:
    f.write(content)

