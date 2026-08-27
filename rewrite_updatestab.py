import re

with open('web/src/components/portfolio/UpdatesTab.jsx', 'r') as f:
    content = f.read()

# Add import
if 'import UpdatesCompliance' not in content:
    content = content.replace("import UpdatesPurification from './UpdatesPurification';", "import UpdatesPurification from './UpdatesPurification';\nimport UpdatesCompliance  from './UpdatesCompliance';")

# Add compliance to tabs array
tabs_old = """    {
      id: 'digest',
      label: 'Irshad Digest',
      icon: Mail,
      description: 'Portfolio compliance status summary',
    },"""

tabs_new = tabs_old + """
    {
      id: 'compliance',
      label: 'Compliance Changes',
      icon: Shield,
      description: 'Recent status changes for screened companies',
    },"""

content = content.replace(tabs_old, tabs_new)

# Add rendering logic
render_old = "{activeTab === 'news'         && <UpdatesNews />}"
render_new = "{activeTab === 'news'         && <UpdatesNews />}\n        {activeTab === 'compliance'   && <UpdatesCompliance />}"

content = content.replace(render_old, render_new)

with open('web/src/components/portfolio/UpdatesTab.jsx', 'w') as f:
    f.write(content)

