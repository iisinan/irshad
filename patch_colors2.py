import re

content = open('web/src/components/Pricing.jsx').read()

# Make Noor use the brighter gold for the button and accents
noor_block = content[content.find('{/* NOOR */}'):]
new_noor = noor_block.replace('#B8860B', '#D9A05B')
content = content.replace(noor_block, new_noor)

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
