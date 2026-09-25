import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_tabs = """  final List<Map<String, dynamic>> _tabs = [
    {'id': 'news', 'label': 'News & Insights', 'icon': Icons.newspaper_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'ipo', 'label': 'IPO', 'icon': Icons.rocket_launch_outlined},
    {'id': 'dividends', 'label': 'Dividends', 'icon': Icons.star_outline},
    {'id': 'resources', 'label': 'Resources', 'icon': Icons.menu_book_rounded},
  ];"""

new_tabs = """  final List<Map<String, dynamic>> _tabs = [
    {'id': 'news', 'label': 'News & Insights', 'icon': Icons.newspaper_rounded},
    {'id': 'resources', 'label': 'Resources', 'icon': Icons.menu_book_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'ipo', 'label': 'IPO', 'icon': Icons.rocket_launch_outlined},
    {'id': 'dividends', 'label': 'Dividends', 'icon': Icons.star_outline},
  ];"""

content = content.replace(old_tabs, new_tabs)

with open(filepath, 'w') as f:
    f.write(content)
