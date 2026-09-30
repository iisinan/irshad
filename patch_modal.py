content = open('web/src/components/portfolio/AddHoldingModal.jsx').read()
content = content.replace("#FFFFFF", "var(--bg)")
open('web/src/components/portfolio/AddHoldingModal.jsx', 'w').write(content)
print("Replaced all #FFFFFF with var(--bg)")
