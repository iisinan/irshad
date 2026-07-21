import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements
    replacements = {
        'AppTheme.primary': 'context.primary',
        'AppTheme.primaryHover': 'AppTheme.primaryHover',
        'AppTheme.accent': 'context.theme.colorScheme.secondary',
        'AppTheme.accentSoft': 'context.accentSoft',
        'AppTheme.bg': 'context.bg',
        'AppTheme.bgAlt': 'context.bgAlt',
        'AppTheme.bgSection': 'context.bgSection',
        'AppTheme.divider': 'context.divider',
        'AppTheme.textDark': 'context.textDark',
        'AppTheme.textBody': 'context.textBody',
        'AppTheme.textMuted': 'context.textMuted',
        'AppTheme.textDisabled': 'context.textDisabled',
        'AppTheme.halal': 'context.halal',
        'AppTheme.halalBg': 'context.halalBg',
        'AppTheme.questionable': 'context.questionable',
        'AppTheme.questionableBg': 'context.questionableBg',
        'AppTheme.haram': 'context.haram',
        'AppTheme.haramBg': 'context.haramBg',
        'AppTheme.review': 'context.review',
    }

    original_content = content
    for old, new in replacements.items():
        # Match 'AppTheme.foo' but avoid matching things like 'AppTheme.fooBar' if it's not exact
        content = re.sub(r'\b' + old.replace('.', r'\.') + r'\b', new, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart') and file != 'app_theme.dart':
            process_file(os.path.join(root, file))
