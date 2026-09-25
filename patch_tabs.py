import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/updates/updates_news_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Replace sections
old_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
      {'id': 'analysis', 'label': 'Analysis', 'icon': Icons.trending_up_outlined, 'color': const Color(0xFF8B5CF6)},
    ];"""

new_sections = """    final sections = [
      {'id': 'market', 'label': 'Market Intelligence', 'icon': Icons.bar_chart_outlined, 'color': context.primary},
      {'id': 'purification', 'label': 'Why Purification', 'icon': Icons.water_drop_outlined, 'color': const Color(0xFF0EA5E9)},
    ];"""
content = content.replace(old_sections, new_sections)

# Replace active section logic
old_logic = """    if (_activeSection == 'market') {
      final business = (_data?['business_updates'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)..['_cardType'] = 'business').toList() ?? [];
      final market = (_data?['market_intelligence'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)..['_cardType'] = 'market').toList() ?? [];
      items = [...business, ...market];
      items.sort((a, b) {
        final dateA = DateTime.tryParse(a['published_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        final dateB = DateTime.tryParse(b['published_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        return dateB.compareTo(dateA);
      });
    } else if (_activeSection == 'analysis') {
      items = (_data?['analysis'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [];
    }"""

new_logic = """    if (_activeSection == 'market') {
      final business = (_data?['business_updates'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)..['_cardType'] = 'business').toList() ?? [];
      final market = (_data?['market_intelligence'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)..['_cardType'] = 'market').toList() ?? [];
      final analysis = (_data?['analysis'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)..['_cardType'] = 'analysis').toList() ?? [];
      items = [...business, ...market, ...analysis];
      items.sort((a, b) {
        final dateA = DateTime.tryParse(a['published_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        final dateB = DateTime.tryParse(b['published_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        return dateB.compareTo(dateA);
      });
    }"""
content = content.replace(old_logic, new_logic)

with open(filepath, 'w') as f:
    f.write(content)
