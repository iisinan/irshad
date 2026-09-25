import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
import_str = "import 'updates_purification_tab.dart';"
new_import_str = "import 'updates_purification_tab.dart';\nimport '../guide_tab.dart';"
content = content.replace(import_str, new_import_str)

# Add section pill
old_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
    ];"""

new_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
      {'id': 'guide', 'label': 'Guide', 'icon': Icons.menu_book_outlined, 'color': const Color(0xFF10B981)},
    ];"""
content = content.replace(old_sections, new_sections)

# Add rendering logic
old_logic = """    if (_activeSection == 'purification') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSectionPills(),
          const UpdatesPurificationTab(),
        ],
      );
    }"""

new_logic = """    if (_activeSection == 'purification') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSectionPills(),
          const UpdatesPurificationTab(),
        ],
      );
    }

    if (_activeSection == 'guide') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSectionPills(),
          const GuideTab(),
        ],
      );
    }"""
content = content.replace(old_logic, new_logic)

with open(filepath, 'w') as f:
    f.write(content)
