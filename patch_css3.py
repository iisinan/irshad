import re

content = open('web/src/index.css').read()
content = content.replace("transform: scale(1.05);", "/* transform: scale(1.05); removed for vertical layout */")

with open('web/src/index.css', 'w') as f:
    f.write(content)
print("done")
