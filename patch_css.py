import re

content = open('web/src/index.css').read()
content = content.replace("@keyframes slideUpFade {\n  0% { opacity: 0; transform: translateY(40px) scale(0.98); }\n  100% { opacity: 1; transform: translateY(0) scale(1); }\n}", "@keyframes slideUpFade {\n  0% { opacity: 0; transform: translateY(40px); }\n  100% { opacity: 1; transform: translateY(0); }\n}")

with open('web/src/index.css', 'w') as f:
    f.write(content)
print("done")
