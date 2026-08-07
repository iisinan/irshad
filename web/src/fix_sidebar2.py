import os

files = [
    '/Users/sinan/Herd/irshad/web/src/components/DashboardSidebar.jsx',
    '/Users/sinan/Herd/irshad/web/src/components/AdminSidebar.jsx'
]

replacements = {
    "'#9B8D9D'": "'var(--text-body)'",
    "'var(--text-muted)'": "'var(--text-body)'"
}

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
