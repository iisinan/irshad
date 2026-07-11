import os
import re

replacements = [
    (r'Color\(0xFFFAFAFA\)', 'Color(0xFFF5F0E8)'), # bgColor
    (r'Color\(0xFF111827\)', 'Color(0xFF1A1208)'), # textDark
    (r'Color\(0xFF6B7280\)', 'Color(0xFF9A8C70)'), # textMuted
    (r'Color\(0xFFE5E7EB\)', 'Color(0xFFE8E2D9)'), # divider/border
    (r'primaryGreen = Color\(0xFF16A34A\)', 'primaryGold = Color(0xFFC9A84C)'), # primaryGold
    (r'primaryGreen', 'primaryGold'), # primaryGold
    (r'Color\(0xFF16A34A\)', 'Color(0xFF2E7D32)'), # compliantGreen (Halal)
]

for root, dirs, files in os.walk('mobile/lib'):
    for file in files:
        if file.endswith('.dart'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

