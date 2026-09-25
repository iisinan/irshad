import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/update_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """                    const Text(
                      'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri', height: 1.2),
                      maxLines: 2,
                    ),"""

new_block = """                    const Text(
                      'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF5B2971), fontFamily: 'Amiri', height: 1.2),
                      maxLines: 2,
                    ),"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
