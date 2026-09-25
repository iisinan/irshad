import re

content = open('web/src/components/Pricing.jsx').read()

# Change the grid to a flex column centered layout
old_grid = "<div className=\"pricing-grid stagger-fade-in\" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginBottom: '64px', alignItems: 'stretch' }}>"
new_grid = "<div className=\"pricing-grid stagger-fade-in\" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginBottom: '64px', width: '100%', maxWidth: '440px', margin: '0 auto 64px auto' }}>"
content = content.replace(old_grid, new_grid)

# Ensure cards take 100% width of the new max-width container
content = content.replace("display: 'flex', flexDirection: 'column', boxShadow:", "width: '100%', display: 'flex', flexDirection: 'column', boxShadow:")

# Reduce Header padding from 36px/32px to 20px/16px
content = content.replace("padding: '36px 20px 32px'", "padding: '24px 20px 20px'")

# Reduce Feature Row padding in FeatureRow component
feature_old = "padding: '14px 0'"
feature_new = "padding: '10px 0'"
content = content.replace(feature_old, feature_new)

# Reduce the bottom padding of the feature list ul from 40px to 24px
content = content.replace("margin: '0 0 40px'", "margin: '0 0 24px'")

# Reduce padding of the card body
content = content.replace("padding: '30px 24px'", "padding: '24px 24px'")

# Reduce button padding from 16px to 14px
content = content.replace("padding: '16px', borderRadius:", "padding: '14px', borderRadius:")

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
