import os
import re

dir_path = '/Users/sinan/Herd/irshad/web/src'

replacements = {
    'rgba(243, 198, 81, ': 'rgba(201, 149, 42, ',
    '#F3C651': '#C9952A',
    '#1E293B': 'var(--text-dark)',
    '#64748B': 'var(--text-muted)',
    '#334155': 'var(--text-body)',
    '#06090E': '#1A1020',
    '#0B101B': '#2A1A2E',
    '#151D2A': '#3C2D3E',
}

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_path}")
