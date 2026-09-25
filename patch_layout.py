import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Emoji Box
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: context.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                        style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Wrap("""

new_block = """          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: const Text(
                  'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Emoji Box
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: context.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
                    ),
                    child: Center(
                      child: Text(emoji, style: const TextStyle(fontSize: 24)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap("""

content = content.replace(old_block, new_block)

# Since we opened a Column, we need to close it at the end of the Stack's children.
old_end = """              const LiveClockWidget(),
            ],
          ),
        ],
      ),"""

new_end = """              const LiveClockWidget(),
                ],
              ),
            ],
          ),
        ],
      ),"""

content = content.replace(old_end, new_end)

with open(filepath, 'w') as f:
    f.write(content)
