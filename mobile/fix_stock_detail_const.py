import os
import re

file_path = '/Users/sinan/Herd/irshad/mobile/lib/features/stocks/ui/stock_detail_screen.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Fix const issues
content = content.replace('const TextStyle(color: context.bgAlt,', 'TextStyle(color: context.bgAlt,')
content = content.replace("const Text('Purification (Zakat al-Mustaghalat)',", "Text('Purification (Zakat al-Mustaghalat)',")
content = content.replace("const Text('Received non-halal dividends from this stock? Calculate your purification due.',", "Text('Received non-halal dividends from this stock? Calculate your purification due.',")
content = content.replace("const Text('PURIFICATION AMOUNT',", "Text('PURIFICATION AMOUNT',")
content = content.replace('style: const TextStyle(color: context.textDisabled', 'style: TextStyle(color: context.textDisabled')

# I notice that context.bgAlt was incorrectly placed here:
# style: const TextStyle(color: context.bgAlt, fontWeight: FontWeight.w700),
# it should be context.textDark.
content = content.replace('color: context.bgAlt,\nfontWeight: FontWeight.w800', 'color: context.textDark, fontWeight: FontWeight.w800')
content = content.replace('color: context.bgAlt,\nfontWeight: FontWeight.w700', 'color: context.textDark, fontWeight: FontWeight.w700')

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed consts in stock detail screen.")
