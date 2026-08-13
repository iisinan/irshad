import os
import re

app_dir = '/Users/sinan/Herd/irshad/mobile/lib'

replacements = [
    (r"'QUESTIONABLE'", r"'DOUBTFUL'"),
    (r"questionable, and haram", r"doubtful, and haram")
]

modified_count = 0

for root, _, files in os.walk(app_dir):
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
                modified_count += 1

print(f"Total files updated: {modified_count}")
