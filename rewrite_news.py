import re

with open('web/src/components/portfolio/UpdatesNews.jsx', 'r') as f:
    content = f.read()

# Remove ComplianceCard
content = re.sub(r'/\* ── Compliance Change Card ── \*/.*?/\* ── Business Update Card ── \*/', '/* ── Business Update Card ── */', content, flags=re.DOTALL)

# Default active section to 'business'
content = content.replace("const [activeSection, setActiveSection] = useState('compliance');", "const [activeSection, setActiveSection] = useState('business');")

# Remove compliance from sections array
content = re.sub(r"\{\s*id:\s*'compliance',\s*label:\s*'Compliance Changes',\s*icon:\s*Shield,\s*color:\s*'var\(--primary\)'\s*\},\n", "", content)

# Remove compliance count rendering from sections map
content = re.sub(r"\{s\.id === 'compliance'.*?</span>\s*\}\)", "", content, flags=re.DOTALL)

# Remove compliance content rendering
content = re.sub(r"\{activeSection === 'compliance'.*?\}\)\s*\}", "", content, flags=re.DOTALL)

with open('web/src/components/portfolio/UpdatesNews.jsx', 'w') as f:
    f.write(content)

