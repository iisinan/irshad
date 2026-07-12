import os
import re

lib_dir = 'mobile/lib'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Remove const before AppTheme.anything
    content = re.sub(r'const\s+AppTheme\.([a-zA-Z0-9_]+)', r'AppTheme.\1', content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed const in {filepath}")

for root, _, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))
