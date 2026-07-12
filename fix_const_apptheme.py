import os
import re

lib_dir = 'mobile/lib'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Remove bad theme constant declarations
    content = re.sub(r'^\s*(static )?const Color AppTheme\.[a-zA-Z]+ = AppTheme\.[a-zA-Z]+;\s*\n?', '', content, flags=re.MULTILINE)
    
    # Also in news_tab.dart and shariah_tab.dart we have: border: Border.all(color: const AppTheme.divider)
    # This also needs removing const
    content = content.replace('const AppTheme.divider', 'AppTheme.divider')
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))
