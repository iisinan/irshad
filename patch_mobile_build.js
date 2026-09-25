const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

const regex = /Widget build\(BuildContext context\).*?\n  \}/s;

const newBuild = `Widget build(BuildContext context) {
    if (_isLoading) return Center(child: CircularProgressIndicator(color: context.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));
    
    final filteredNotifications = _notifications.where((n) {
      final cat = n['category'];
      return cat != 'market_news' && cat != 'business_activity';
    }).toList();

    return SingleChildScrollView(
      controller: _scrollController,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: _markAllAsRead,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.appColors.divider),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.done_all, size: 16, color: context.textMuted),
                        const SizedBox(width: 6),
                        Text('Mark All Read', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: context.textMuted)),
                      ],
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => Container(
                        decoration: BoxDecoration(
                          color: context.bg,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                        ),
                        padding: const EdgeInsets.only(top: 16),
                        child: const UpdatesDigestTab(),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.mail_outline_rounded, size: 16, color: context.primary),
                        const SizedBox(width: 6),
                        Text('Digest Settings', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: context.primary)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

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

          if (filteredNotifications.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.inbox, size: 48, color: context.textMuted.withValues(alpha: 0.5)),
                    const SizedBox(height: 16),
                    Text('No notifications yet', style: TextStyle(color: context.textMuted, fontSize: 16)),
                  ],
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              itemCount: filteredNotifications.length,
              itemBuilder: (context, index) {
                final item = filteredNotifications[index];
                final isUnread = item['read_at'] == null;
                final category = item['category'] ?? 'system';

                return Dismissible(
                  key: Key(item['id'].toString()),
                  background: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.centerLeft,
                    child: const Icon(Icons.archive, color: Colors.white),
                  ),
                  secondaryBackground: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.centerRight,
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (direction) {
                    if (direction == DismissDirection.startToEnd) {
                      _archiveNotification(item['id']);
                    } else {
                      _deleteNotification(item['id']);
                    }
                  },
                  child: InkWell(
                    onTap: () {
                      if (isUnread) _markAsRead(item['id']);
                      if ((category == 'digest' || item['title'] == 'Irshad Digest is Ready') && item['meta'] != null) {
                        _showDigestViewer(context, item['meta']);
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isUnread ? context.primary.withValues(alpha: 0.03) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isUnread ? context.primary.withValues(alpha: 0.3) : context.appColors.divider),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: _getBgColorForCategory(category),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: _getIconForCategory(category),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['title'] ?? '',
                                        style: TextStyle(
                                          fontWeight: isUnread ? FontWeight.w900 : FontWeight.w700,
                                          fontSize: 15,
                                          color: context.textDark,
                                        ),
                                      ),
                                    ),
                                    if (isUnread)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: context.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item['message'] ?? '',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: context.textMuted,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  item['created_at']?.toString().split('T')[0] ?? '',
                                  style: TextStyle(fontSize: 12, color: context.textMuted),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            
            if (_isLoadingMore)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Center(child: CircularProgressIndicator(color: context.primary)),
              ),
        ],
      ),
    );
  }`;

file = file.replace(regex, newBuild);
fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', file);
