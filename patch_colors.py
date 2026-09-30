import os

replacements = {
    "'#FFFFFF'": "'var(--bg)'",
    "'#ffffff'": "'var(--bg)'",
    "'#fff'": "'var(--bg)'",
    "'white'": "'var(--bg)'",
    "'#F9FAFB'": "'var(--bg-alt)'",
    "'#F3F4F6'": "'var(--bg-section)'",
}

skip_files = ['CompanyLogo.jsx', 'ZakatTab.jsx', 'LandingPage.jsx', 'UpdatesDigest.jsx', 'WatchlistAlertModal.jsx']

def process_file(filepath):
    if any(s in filepath for s in skip_files): return
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        # specifically look for background: 'old'
        content = content.replace(f"background: {old}", f"background: {new}")
        content = content.replace(f"backgroundColor: {old}", f"backgroundColor: {new}")

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('web/src/components'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

