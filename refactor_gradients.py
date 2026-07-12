import os
import re

lib_dir = 'mobile/lib'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Replace the gold linear gradient with AppTheme primary
    content = content.replace('Color(0xFFFFD700), Color(0xFFD4AF37)', 'AppTheme.primaryHover, AppTheme.primary')
    content = content.replace('const LinearGradient(colors: [AppTheme.primaryHover, AppTheme.primary])', 'LinearGradient(colors: [AppTheme.primaryHover, AppTheme.primary])')

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))
