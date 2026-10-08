with open('web/src/index.css', 'r') as f:
    content = f.read()

content = content.replace("--body-bg:      #F6F5F8;", "--body-bg:      #F3F4F6;")
content = content.replace("--bg-alt:       #FCFBFC;", "--bg-alt:       #F9FAFB;")

with open('web/src/index.css', 'w') as f:
    f.write(content)
