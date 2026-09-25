import re

content = open('web/src/components/Pricing.jsx').read()
content = content.replace("fontSize: '3rem'", "fontSize: '2.4rem'")

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
