const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

file = file.replace(/List<dynamic> _notifications = \[\];/, 
  "List<dynamic> _notifications = [];\n  String _activeCategory = 'all';\n\n  final List<Map<String, dynamic>> _categories = [\n    {'id': 'all', 'label': 'All'},\n    {'id': 'portfolio', 'label': 'Portfolio'},\n    {'id': 'screening', 'label': 'Screening'},\n    {'id': 'price_alerts', 'label': 'Price Alerts'},\n    {'id': 'system', 'label': 'System'},\n    {'id': 'security', 'label': 'Security'},\n  ];");

file = file.replace(/final response = await ApiService\(\)\.get\('notifications\/inbox'\);/,
  "final response = await ApiService().get('notifications/inbox', queryParameters: _activeCategory != 'all' ? {'category': _activeCategory} : null);");

let categoriesWidget = `
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: _categories.map((cat) {
              final isActive = _activeCategory == cat['id'];
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _activeCategory = cat['id'];
                    _isLoading = true;
                  });
                  _fetchInbox();
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 8, bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isActive ? context.primary.withValues(alpha: 0.1) : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive ? context.primary : context.appColors.divider,
                    ),
                  ),
                  child: Text(
                    cat['label'],
                    style: TextStyle(
                      fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                      fontSize: 13,
                      color: isActive ? context.primary : context.textMuted,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
`;

// Find where to insert categoriesWidget
// We want to insert it after the Padding that contains "Irshad Digest Settings"
let splitPattern = "          ),";
let parts = file.split("        if (filteredNotifications.isEmpty)");
if (parts.length === 2) {
  let output = parts[0] + categoriesWidget + "\n        if (filteredNotifications.isEmpty)" + parts[1];
  fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', output);
  console.log("Success");
} else {
  console.log("Failed to find insertion point");
}
