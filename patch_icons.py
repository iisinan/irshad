import os

# 1. Update updates_news_tab.dart (Top tab)
file1 = 'mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart'
with open(file1, 'r') as f:
    content1 = f.read()

old1 = "{'id': 'guide', 'label': 'Navigation Guide', 'icon': Icons.menu_book_outlined, 'color': const Color(0xFF10B981)}"
new1 = "{'id': 'guide', 'label': 'Navigation Guide', 'icon': Icons.explore_outlined, 'color': const Color(0xFF10B981)}"
content1 = content1.replace(old1, new1)

with open(file1, 'w') as f:
    f.write(content1)

# 2. Update guide_tab.dart (Inner tab)
file2 = 'mobile/lib/features/portfolio/ui/tabs/guide_tab.dart'
with open(file2, 'r') as f:
    content2 = f.read()

old2 = "{'id': 'navigation', 'label': 'How to:', 'icon': Icons.explore_rounded}"
new2 = "{'id': 'navigation', 'label': 'How to:', 'icon': Icons.menu_book_rounded}"
content2 = content2.replace(old2, new2)

old2_hdr = "_buildSectionHeader(Icons.explore_rounded, 'How to:')"
new2_hdr = "_buildSectionHeader(Icons.menu_book_rounded, 'How to:')"
content2 = content2.replace(old2_hdr, new2_hdr)

with open(file2, 'w') as f:
    f.write(content2)

