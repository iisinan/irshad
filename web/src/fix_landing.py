import os
import re

file_path = '/Users/sinan/Herd/irshad/web/src/components/LandingPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace rgba(0,109,100, x) with rgba(118,88,122, x)
content = re.sub(r'rgba\(0,\s*109,\s*100,\s*([0-9.]+)\)', r'rgba(118,88,122,\1)', content)

# Replace #22c5b0 with the new gold #C9952A
content = content.replace('#22c5b0', '#C9952A')

# If there's #0F5257, #0A192F, etc...
content = content.replace('#0F5257', '#2A1A2E')
content = content.replace('#0A192F', '#1A1020')
content = content.replace('#0F3A40', '#2A1A2E')
content = content.replace('#0B4F55', '#3C2D3E')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("LandingPage.jsx updated.")
