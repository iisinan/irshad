import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
import_str = "import 'updates/updates_dividends_tab.dart';"
new_import_str = "import 'updates/updates_dividends_tab.dart';\nimport 'resources_tab.dart';"
content = content.replace(import_str, new_import_str)

# Add tab
old_tabs = """  final List<Map<String, dynamic>> _tabs = [
    {'id': 'news', 'label': 'News & Insights', 'icon': Icons.newspaper_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'ipo', 'label': 'IPO', 'icon': Icons.rocket_launch_outlined},
    {'id': 'dividends', 'label': 'Dividends', 'icon': Icons.star_outline},
  ];"""

new_tabs = """  final List<Map<String, dynamic>> _tabs = [
    {'id': 'news', 'label': 'News & Insights', 'icon': Icons.newspaper_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'ipo', 'label': 'IPO', 'icon': Icons.rocket_launch_outlined},
    {'id': 'dividends', 'label': 'Dividends', 'icon': Icons.star_outline},
    {'id': 'resources', 'label': 'Resources', 'icon': Icons.menu_book_rounded},
  ];"""
content = content.replace(old_tabs, new_tabs)

# Add switch case
old_switch = """      case 'dividends':
        return const UpdatesDividendsTab();
      default:
        return const SizedBox.shrink();"""

new_switch = """      case 'dividends':
        return const UpdatesDividendsTab();
      case 'resources':
        return const ResourcesTab();
      default:
        return const SizedBox.shrink();"""
content = content.replace(old_switch, new_switch)

with open(filepath, 'w') as f:
    f.write(content)
