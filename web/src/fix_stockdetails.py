import os

file_path = '/Users/sinan/Herd/irshad/web/src/components/StockDetails.jsx'

replacements = {
    # Hero background
    "'linear-gradient(135deg, #0A192F 0%, #0F3A40 50%, #0B4F55 100%)'": "'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #3C2D3E 100%)'",
    
    # Status card background
    "'linear-gradient(135deg, rgba(10, 25, 47, 0.8) 0%, rgba(15, 58, 64, 0.7) 100%)'": "'linear-gradient(135deg, rgba(26,16,32,0.8) 0%, rgba(42,26,46,0.7) 100%)'",
    
    # Purification card background
    "'linear-gradient(160deg, #071F24 0%, #0B3038 60%, #071A20 100%)'": "'linear-gradient(160deg, #1A1020 0%, #2A1A2E 60%, #1A1020 100%)'",
    
    # Old neon green -> softer emerald green
    "'#00d68f'": "'#10B981'",
    "rgba(0,214,143,": "rgba(16,185,129,",
    "rgba(0, 214, 143,": "rgba(16, 185, 129,",
    
    # Soften inner dark card borders/backgrounds slightly
    "border: '1px solid rgba(255,255,255,0.2)'": "border: '1px solid rgba(255,255,255,0.08)'",
    "background: 'rgba(255, 255, 255, 0.08)'": "background: 'rgba(255, 255, 255, 0.03)'",
    "background: 'rgba(255,255,255,0.12)'": "background: 'rgba(255, 255, 255, 0.06)'",
    
    # Dark card text tweaks
    "color: '#A0AEC0'": "color: '#BEA9C1'", # Old grey to mauve muted
    "color: '#8BA3A6'": "color: '#BEA9C1'",
}

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content
for old, new in replacements.items():
    new_content = new_content.replace(old, new)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("StockDetails.jsx updated.")
else:
    print("No changes made.")
