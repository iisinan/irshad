with open('web/src/index.css', 'r') as f:
    content = f.read()

import re

# We will replace the entire :root block and [data-theme="dark"] block to match the new Mint/Teal theme.

# Find the :root block
root_match = re.search(r':root\s*\{([^}]*)\}', content, re.DOTALL)
if root_match:
    old_root = root_match.group(1)
    
    # Let's replace individual variables
    new_root = old_root
    
    # Backgrounds
    new_root = re.sub(r'--bg:\s*#[0-9A-Fa-f]+;', '--bg:           #FFFFFF;', new_root)
    new_root = re.sub(r'--bg-alt:\s*#[0-9A-Fa-f]+;', '--bg-alt:       #F2F7F4;', new_root)
    new_root = re.sub(r'--body-bg:\s*#[0-9A-Fa-f]+;', '--body-bg:      #E4F0E8;', new_root)
    new_root = re.sub(r'--bg-section:\s*#[0-9A-Fa-f]+;', '--bg-section:   #FFFFFF;', new_root)
    
    # Primary
    new_root = re.sub(r'--primary:\s*#[0-9A-Fa-f]+;', '--primary:      #45A58A;', new_root)
    new_root = re.sub(r'--primary-hover:\s*#[0-9A-Fa-f]+;', '--primary-hover:#358770;', new_root)
    new_root = re.sub(r'--primary-50:\s*[^;]+;', '--primary-50:   rgba(69, 165, 138, 0.08);', new_root)
    new_root = re.sub(r'--primary-100:\s*[^;]+;', '--primary-100:  rgba(69, 165, 138, 0.15);', new_root)
    
    # Text
    new_root = re.sub(r'--text-dark:\s*#[0-9A-Fa-f]+;', '--text-dark:    #111827;', new_root)
    new_root = re.sub(r'--text-body:\s*#[0-9A-Fa-f]+;', '--text-body:    #374151;', new_root)
    new_root = re.sub(r'--text-muted:\s*#[0-9A-Fa-f]+;', '--text-muted:   #6B7280;', new_root)
    
    # Shadows (tint shadows with the teal/mint color)
    new_root = re.sub(r'--shadow-purple:[^;]+;', '--shadow-purple: 0 12px 40px rgba(69, 165, 138, 0.15);', new_root)
    
    content = content.replace(old_root, new_root)

# Dark Mode adjustments
dark_match = re.search(r'\[data-theme="dark"\]\s*\{([^}]*)\}', content, re.DOTALL)
if dark_match:
    old_dark = dark_match.group(1)
    new_dark = old_dark
    
    # Keep dark mode body very dark, but maybe a hint of teal
    new_dark = re.sub(r'--bg:\s*#[0-9A-Fa-f]+;', '--bg:           #141A18;', new_dark)
    new_dark = re.sub(r'--bg-alt:\s*[^;]+;', '--bg-alt:       rgba(24, 33, 29, 0.88);', new_dark)
    new_dark = re.sub(r'--body-bg:\s*[^;]+;', '--body-bg:      radial-gradient(at 0% 0%, rgba(69, 165, 138, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(209, 165, 98, 0.08) 0px, transparent 50%), #0F1412;', new_dark)
    new_dark = re.sub(r'--bg-section:\s*[^;]+;', '--bg-section:   rgba(24, 33, 29, 0.90);', new_dark)
    
    # Primary in dark mode
    new_dark = re.sub(r'--primary:\s*[^;]+;', '--primary:      #66C2A6;', new_dark)
    new_dark = re.sub(r'--primary-hover:\s*[^;]+;', '--primary-hover:#4DB395;', new_dark)
    new_dark = re.sub(r'--primary-50:\s*[^;]+;', '--primary-50:   rgba(102, 194, 166, 0.12);', new_dark)
    new_dark = re.sub(r'--primary-100:\s*[^;]+;', '--primary-100:  rgba(102, 194, 166, 0.22);', new_dark)
    
    content = content.replace(old_dark, new_dark)

with open('web/src/index.css', 'w') as f:
    f.write(content)

