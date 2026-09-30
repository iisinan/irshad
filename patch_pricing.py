import re

content = open('web/src/components/Pricing.jsx').read()

replacements = {
    "'#FFFFFF'": "'var(--bg)'",
    "'#111827'": "'var(--text-dark)'",
    "'#6B7280'": "'var(--text-muted)'",
    "'#374151'": "'var(--text-dark)'",
    "'#E5E7EB'": "'var(--border)'",
    "'#D1D5DB'": "'var(--border)'",
    "'#F3F4F6'": "'var(--bg-alt)'",
    "'#F9FAFB'": "'var(--bg-alt)'",
    '"#F9FAFB"': '"var(--bg-alt)"',
    '"#FFFFFF"': '"var(--bg)"',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# One specific fix for card backgrounds
content = content.replace("background: 'var(--bg)', borderRadius: '24px', border: '1px solid var(--border)'", "background: 'var(--bg-section)', borderRadius: '24px', border: '1px solid var(--border)'")

open('web/src/components/Pricing.jsx', 'w').write(content)
print("Patched Pricing.jsx")
