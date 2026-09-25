import re

content = open('web/src/components/Pricing.jsx').read()

# Rawdah: Replace blues (#2563EB text, #3B82F6 background) with Irshad Green (#006B46 and #059669)
# Badges and prices used #2563EB
rawdah_block = content[content.find('{/* RAWDAH */}'):content.find('{/* NOOR */}')]
new_rawdah = rawdah_block.replace('#2563EB', '#006B46') # Text / Prices
new_rawdah = new_rawdah.replace('#3B82F6', '#006B46') # Buttons / Checkmarks
content = content.replace(rawdah_block, new_rawdah)

# Noor: Replace blues with Irshad Gold (#B8860B)
noor_block = content[content.find('{/* NOOR */}'):]
new_noor = noor_block.replace('#2563EB', '#B8860B') # Text / Prices
new_noor = new_noor.replace('#3B82F6', '#B8860B') # Buttons / Checkmarks
content = content.replace(noor_block, new_noor)

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
