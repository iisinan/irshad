import re

with open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import 'updates/updates_compliance_tab.dart';"
if import_stmt not in content:
    content = content.replace("import 'updates/updates_purification_tab.dart';", "import 'updates/updates_purification_tab.dart';\nimport 'updates/updates_compliance_tab.dart';")

# Add compliance to tabs array
tabs_old = """    {'id': 'digest', 'label': 'Irshad Digest', 'icon': Icons.mail_outline_rounded},
    {'id': 'purification', 'label': 'Purification', 'icon': Icons.water_drop_outlined},"""

tabs_new = """    {'id': 'digest', 'label': 'Irshad Digest', 'icon': Icons.mail_outline_rounded},
    {'id': 'compliance', 'label': 'Compliance Changes', 'icon': Icons.shield_outlined},
    {'id': 'purification', 'label': 'Purification', 'icon': Icons.water_drop_outlined},"""

content = content.replace(tabs_old, tabs_new)

# Add rendering logic
render_old = "if (_activeTabId == 'news') const UpdatesNewsTab(),"
render_new = "if (_activeTabId == 'news') const UpdatesNewsTab(),\n                if (_activeTabId == 'compliance') const UpdatesComplianceTab(),"

content = content.replace(render_old, render_new)

with open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart', 'w') as f:
    f.write(content)

