import os

files = [
    '/Users/sinan/Herd/irshad/web/src/components/DashboardSidebar.jsx',
    '/Users/sinan/Herd/irshad/web/src/components/AdminSidebar.jsx'
]

replacements = {
    "background: '#4A3350'": "background: 'var(--bg-alt)'",
    "rgba(255, 255, 255, 0.08)": "var(--border)",
    "rgba(255, 255, 255, 0.05)": "var(--primary-50)",
    "rgba(255, 255, 255, 0.12)": "var(--primary-100)",
    "rgba(255, 255, 255, 0.1)": "var(--border-strong)",
    "color: '#9B8D9D'": "color: 'var(--text-muted)'",
    "color: '#FFFFFF'": "color: 'var(--text-dark)'",
    "color: '#7A6B7E'": "color: 'var(--text-muted)'",
    "background: 'rgba(0, 0, 0, 0.25)'": "background: 'transparent'",
    "rgba(190, 169, 193, 0.08)": "var(--primary-50)",
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
