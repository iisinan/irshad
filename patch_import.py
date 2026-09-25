import re

content = open('web/src/components/portfolio/UpdatesNews.jsx').read()

if "ArrowLeft" not in content:
    content = content.replace("Star, X", "Star, X, ArrowLeft")

with open('web/src/components/portfolio/UpdatesNews.jsx', 'w') as f:
    f.write(content)
print("done")
