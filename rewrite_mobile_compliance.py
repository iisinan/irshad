import re

with open('mobile/lib/features/portfolio/ui/tabs/updates/updates_compliance_tab.dart', 'r') as f:
    content = f.read()

# Rename class
content = content.replace('UpdatesNewsTab', 'UpdatesComplianceTab')
content = content.replace('_UpdatesNewsTabState', '_UpdatesComplianceTabState')

# Set active section
content = re.sub(r"String _activeSection = 'compliance';\n", "", content)

# Remove _buildBusinessCard and _buildMarketCard and _buildSectionPills
content = re.sub(r'Widget _buildSectionPills.*?Widget _buildComplianceCard', 'Widget _buildComplianceCard', content, flags=re.DOTALL)
content = re.sub(r'Widget _buildBusinessCard.*$', '', content, flags=re.DOTALL)

# Now rewrite build method
build_method = """  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));

    List<dynamic> items = _data?['compliance_changes'] ?? [];

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      children: [
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'No compliance updates available',
                style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
              ),
            ),
          )
        else
          ...items.map((item) => _buildComplianceCard(item)),
      ],
    );
  }
}
"""

content += build_method

with open('mobile/lib/features/portfolio/ui/tabs/updates/updates_compliance_tab.dart', 'w') as f:
    f.write(content)

