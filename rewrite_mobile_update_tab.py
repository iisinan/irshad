import re

with open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart', 'r') as f:
    content = f.read()

# Add states for unread counts
state_code = """  String _activeTabId = 'news';
  int _unreadInbox = 0;
  int _unreadNews = 1; // Default to 1 to show the red dot

  @override
  void initState() {
    super.initState();
    _fetchUnreadCounts();
  }

  Future<void> _fetchUnreadCounts() async {
    try {
      final response = await ApiService().get('notifications/unread-count');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _unreadInbox = response.data['data']?['count'] ?? response.data['count'] ?? 0;
          });
        }
      }
    } catch (_) {}
  }

"""
content = re.sub(r"  String _activeTabId = 'news';\n", state_code, content)

# Remove the hardcoded unreadCount in build
content = content.replace("final unreadCount = 0; // Ideally fetch from a provider later", "")

# Add logic for hasNew inside the map
map_code = """        children: _tabs.map((tab) {
          final isActive = _activeTabId == tab['id'];
          final hasNew = (tab['id'] == 'inbox' && _unreadInbox > 0) || (tab['id'] == 'news' && _unreadNews > 0);
          
          return GestureDetector(
            onTap: () => setState(() => _activeTabId = tab['id']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isActive ? context.primary : context.bgAlt,
                border: Border.all(color: isActive ? context.primary : context.appColors.divider),
                borderRadius: BorderRadius.circular(30),
                boxShadow: isActive ? [BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 2))] : [],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(tab['icon'], size: 16, color: isActive ? Colors.white : context.textDark),
                      const SizedBox(width: 8),
                      Text(
                        tab['label'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: isActive ? Colors.white : context.textDark,
                        ),
                      ),
                    ],
                  ),
                  if (hasNew)
                    Positioned(
                      top: -2,
                      right: -8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: context.haram,
                          shape: BoxShape.circle,
                          border: Border.all(color: isActive ? context.primary : context.bgAlt, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        }).toList(),"""

content = re.sub(r"        children: _tabs\.map\(\(tab\) \{.*?\}\)\.toList\(\),", map_code, content, flags=re.DOTALL)

with open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart', 'w') as f:
    f.write(content)

