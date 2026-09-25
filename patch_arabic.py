import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                      ),
                    ),"""

new_block = """                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri'),
                      ),
                    ),"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
