import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
      {'id': 'guide', 'label': 'Navigation Guide', 'icon': Icons.menu_book_outlined, 'color': const Color(0xFF10B981)},
    ];"""

new_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'guide', 'label': 'Navigation Guide', 'icon': Icons.menu_book_outlined, 'color': const Color(0xFF10B981)},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
    ];"""

content = content.replace(old_sections, new_sections)

with open(filepath, 'w') as f:
    f.write(content)
