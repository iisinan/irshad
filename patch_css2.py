import re

content = open('web/src/index.css').read()
content = content.replace("@keyframes slideUpFade {\n  0% { opacity: 0; transform: translateY(40px); }\n  100% { opacity: 1; transform: translateY(0); }\n}", "@keyframes slideUpFade {\n  0% { opacity: 0; top: 40px; }\n  100% { opacity: 1; top: 0px; }\n}")

# Make sure cards are position relative
content = content.replace(".pricing-grid.stagger-fade-in > div {\n  opacity: 0;", ".pricing-grid.stagger-fade-in > div {\n  opacity: 0;\n  position: relative;")

with open('web/src/index.css', 'w') as f:
    f.write(content)
print("done")
