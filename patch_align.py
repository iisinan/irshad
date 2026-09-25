import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """                    const Text(
                      'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri', height: 1.2),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(
                          '$greetingEn,\\n$firstName',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5, height: 1.1),
                        ),
                        if (unreadCount > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.primary,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: [BoxShadow(color: context.primary.withValues(alpha: 0.5), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Text(
                              '$unreadCount unread',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                          ),
                      ],
                    ),"""

new_block = """                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(
                          '$greetingEn, $firstName',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
                        ),
                        if (unreadCount > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.primary,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: [BoxShadow(color: context.primary.withValues(alpha: 0.5), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Text(
                              '$unreadCount unread',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                          ),
                      ],
                    ),"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
