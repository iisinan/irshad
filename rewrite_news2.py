import re

with open('web/src/components/portfolio/UpdatesNews.jsx', 'r') as f:
    content = f.read()

# Fix activeSection === 'compliance'
content = re.sub(r'\{activeSection === \'compliance\'.*?</>\s*\)}', '', content, flags=re.DOTALL)

with open('web/src/components/portfolio/UpdatesNews.jsx', 'w') as f:
    f.write(content)

