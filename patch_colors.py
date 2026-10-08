with open('web/src/index.css', 'r') as f:
    content = f.read()

content = content.replace("--body-bg:      #FFFFFF;", "--body-bg:      #F6F5F8;")
content = content.replace("--bg-alt:       #FFFFFF;", "--bg-alt:       #FCFBFC;")

with open('web/src/index.css', 'w') as f:
    f.write(content)
