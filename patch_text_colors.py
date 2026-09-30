import os

replacements = {
    "'#111827'": "'var(--text-dark)'",
    "'#374151'": "'var(--text-dark)'",
    "'#4B5563'": "'var(--text-muted)'",
    "'#6B7280'": "'var(--text-muted)'",
    "'#9CA3AF'": "'var(--text-muted)'",
    "'#000'": "'var(--text-dark)'",
    "'#000000'": "'var(--text-dark)'",
    "'black'": "'var(--text-dark)'",
}

skip_files = ['CompanyLogo.jsx', 'ZakatTab.jsx', 'LandingPage.jsx']

def process_file(filepath):
    if any(s in filepath for s in skip_files): return
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(f"color: {old}", f"color: {new}")

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched text colors in {filepath}")

for root, _, files in os.walk('web/src/components'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

