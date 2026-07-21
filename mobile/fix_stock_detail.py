import os
import re

file_path = '/Users/sinan/Herd/irshad/mobile/lib/features/stocks/ui/stock_detail_screen.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Replace hardcoded Colors.white in container backgrounds with context.bgAlt
# We'll look for `color: Colors.white,` and replace it with `color: context.bgAlt,`
content = re.sub(r'color:\s*Colors\.white,\s*', 'color: context.bgAlt,\n', content)

# Fix Purification Card to use standard colors instead of inverted logic which breaks
content = content.replace('color: context.textDark, ', 'color: context.bgAlt, ')
content = content.replace('color: Colors.white, fontWeight: FontWeight.w800', 'color: context.textDark, fontWeight: FontWeight.w800')
content = content.replace('color: Colors.white70', 'color: context.textMuted')
content = content.replace('const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)', 'TextStyle(color: context.textDark, fontWeight: FontWeight.w700)')
content = content.replace('const TextStyle(color: Colors.white24, fontWeight: FontWeight.w400)', 'TextStyle(color: context.textDisabled, fontWeight: FontWeight.w400)')
content = content.replace('Colors.white.withOpacity(0.05)', 'context.bgSection')
content = content.replace('color: Colors.white54', 'color: context.textMuted')
content = content.replace('color: Colors.white30', 'color: context.textDisabled')

# Fix a specific case in line 1060 and others which might have been caught by the regex
# It should be context.bgAlt.
# foregroundColor: Colors.white is fine for buttons that have primary color backgrounds.

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed stock detail screen colors.")
