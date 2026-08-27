import re

with open('mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart', 'r') as f:
    content = f.read()

# Change initial activeSection
content = content.replace("String _activeSection = 'compliance';", "String _activeSection = 'business';")

# Remove compliance from sections map
content = re.sub(r"\{'id': 'compliance'.*?\},", "", content)

# Remove _buildComplianceCard
content = re.sub(r'Widget _buildComplianceCard.*?Widget _buildBusinessCard', 'Widget _buildBusinessCard', content, flags=re.DOTALL)

# Fix build method logic
content = content.replace("if (_activeSection == 'compliance') {\n      items = _data?['compliance_changes'] ?? [];\n    } else ", "")
content = content.replace("if (_activeSection == 'compliance') return _buildComplianceCard(item);\n            ", "")

with open('mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart', 'w') as f:
    f.write(content)

