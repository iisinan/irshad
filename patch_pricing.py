content = open('web/src/components/Pricing.jsx').read()

# Add isModal to props
content = content.replace("const Pricing = () => {", "const Pricing = ({ isModal }) => {")

# Hide Footer if isModal
content = content.replace("<Footer />", "{!isModal && <Footer />}")

open('web/src/components/Pricing.jsx', 'w').write(content)
