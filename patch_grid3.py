import re

content = open('web/src/components/Pricing.jsx').read()
content = content.replace("gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'", "gridTemplateColumns: 'repeat(3, 1fr)'")

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
