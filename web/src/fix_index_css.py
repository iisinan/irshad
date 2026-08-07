import os
import re

file_path = '/Users/sinan/Herd/irshad/web/src/index.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "var(--primary, #0F5257)": "var(--primary, #76587A)",
    "linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)": "linear-gradient(135deg, #1A1020 0%, #2A1A2E 65%, #3C2D3E 100%)",
    "linear-gradient(90deg, #0F5257 0%, #C9B89C 100%)": "linear-gradient(90deg, #76587A 0%, #C9952A 100%)",
    "linear-gradient(135deg, #0F5257 0%, #1A7A81 100%)": "linear-gradient(135deg, #76587A 0%, #C9952A 100%)",
    "/* Deep brand-dark derived from primary #0F5257 */": "/* Deep brand-dark derived from primary #76587A */",
    "div[style*=\"background: 'linear-gradient(135deg, #0F5257\"]": "div[style*=\"background: 'linear-gradient\"]"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.css updated.")
