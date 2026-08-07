import os

file_path = '/Users/sinan/Herd/irshad/web/src/components/StockDetails.jsx'

replacements = {
    "'0 0 8px #00d68f'": "'0 0 8px #10B981'",
}

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content
for old, new in replacements.items():
    new_content = new_content.replace(old, new)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("StockDetails.jsx shadow updated.")
else:
    print("No changes made.")
