import os
import re

lib_dir = 'mobile/lib'

mappings = {
    'bgColor': 'AppTheme.bg',
    'primaryGold': 'AppTheme.primary',
    'compliantGreen': 'AppTheme.halal',
    'questionableAmber': 'AppTheme.questionable',
    'nonHalalRed': 'AppTheme.haram',
    'textDark': 'AppTheme.textDark',
    'textMuted': 'AppTheme.textMuted',
    'divider': 'AppTheme.divider',
    'bgSection': 'AppTheme.bgSection',
    'textLight': 'AppTheme.textDisabled',
    'Color(0xFFC9A84C)': 'AppTheme.primary',
    'Color(0xFFE8C96A)': 'AppTheme.primaryHover',
    'Color(0xFFF5F0E8)': 'AppTheme.bg',
    'Color(0xFF1A1208)': 'AppTheme.textDark',
    'Color(0xFF9A8C70)': 'AppTheme.textMuted',
    'Color(0xFFE8E2D9)': 'AppTheme.divider',
    'Color(0xFF2E7D32)': 'AppTheme.halal',
    'Color(0xFFD97706)': 'AppTheme.questionable',
    'Color(0xFFC62828)': 'AppTheme.haram',
    'Color(0xFFFAF7F2)': 'AppTheme.bgSection',
    'Color(0xFF1565C0)': 'AppTheme.review',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # 1. Remove static const Color definitions
    content = re.sub(r'^\s*static const Color [a-zA-Z]+ = Color\(0x[0-9A-F]+\);\s*\n?', '', content, flags=re.MULTILINE)

    # 2. Add import if it changed
    if content != original_content or any(k in content for k in mappings.keys()):
        import_stmt = "import 'package:irshad_mobile/core/theme/app_theme.dart';"
        if import_stmt not in content:
            # find last import
            match = re.search(r"^(import\s+['\"].*?['\"];\s*\n)+", content, flags=re.MULTILINE)
            if match:
                content = content[:match.end()] + import_stmt + "\n" + content[match.end():]
            else:
                content = import_stmt + "\n" + content

    # 3. Replace word usages
    for k, v in mappings.items():
        if k.startswith('Color'):
            content = content.replace(k, v)
        else:
            content = re.sub(r'\b' + k + r'\b', v, content)
            
    # Also replace any left over linear-gradients to use plain AppTheme colors or new neutral gradients
    # specifically the gold linear gradient:
    # LinearGradient(colors: [Color(0xFFE2C87C), Color(0xFFC9A84C)], ...) -> LinearGradient(colors: [AppTheme.primaryHover, AppTheme.primary], ...)
    content = content.replace('Color(0xFFE2C87C)', 'AppTheme.primaryHover')

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart') and file != 'app_theme.dart' and file != 'main.dart':
            process_file(os.path.join(root, file))
