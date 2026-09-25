import re

content = open('web/src/components/Pricing.jsx').read()

old = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', marginBottom: '64px' }}>"
new = "<div className=\"pricing-grid stagger-fade-in\" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginBottom: '64px', alignItems: 'stretch' }}>"

content = content.replace(old, new)

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
