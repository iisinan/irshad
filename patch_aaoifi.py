import re

with open('web/src/components/AaoifiScreening.jsx', 'r') as f:
    content = f.read()

# Replace hardcoded white gradients and solid white with CSS variables
replacements = [
    (r"linear-gradient\(135deg,\s*#fff\s*0%,\s*rgba\(255,255,255,0\.\d+\)\s*100%\)", "var(--bg-section)"),
    (r"rgba\(255,255,255,0\.85\)", "var(--bg-section)"),
    (r"border:\s*['\"]1px solid #fff['\"]", "border: '1px solid var(--border)'"),
    (r"inset 0 2px 4px #fff", "inset 0 2px 4px rgba(255,255,255,0.05)"),
    (r"inset 0 2px 0 #fff", "inset 0 2px 0 rgba(255,255,255,0.05)"),
    (r"inset 0 2px 4px rgba\(255,255,255,1\)", "inset 0 2px 4px rgba(255,255,255,0.05)"),
    (r"border:\s*`1px solid \$\{sc\.color\}20`", "border: `1px solid var(--border)`"),
    (r"boxShadow:\s*`0 8px 24px \$\{sc\.color\}30, inset 0 2px 0 #fff`", "boxShadow: `0 8px 24px ${sc.color}15, inset 0 2px 0 rgba(255,255,255,0.05)`")
]

original = content
for old, new in replacements:
    content = re.sub(old, new, content)

with open('web/src/components/AaoifiScreening.jsx', 'w') as f:
    f.write(content)

print("Replaced instances:", len(content) != len(original) or content != original)
