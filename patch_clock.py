import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: context.bgAlt,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(hh, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1)),
              Text(':', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.primary)),
              Text(mm, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -1)),
              Text(':', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.primary.withValues(alpha: 0.5))),
              Text(ss, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.textMuted, letterSpacing: -1)),
            ],
          ),
          const SizedBox(height: 4),
          Text(dateStr, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.textMuted)),
        ],
      ),
    );"""

new_block = """    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: context.bgAlt,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(hh, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
              Text(':', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: context.primary)),
              Text(mm, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
              Text(':', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: context.primary.withValues(alpha: 0.5))),
              Text(ss, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textMuted, letterSpacing: -0.5)),
            ],
          ),
          const SizedBox(height: 2),
          Text(dateStr, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.textMuted)),
        ],
      ),
    );"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
