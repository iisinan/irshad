content = open('web/src/index.css').read()
OLD = '[data-theme="dark"] {'
NEW = '[data-theme="dark"] {\n  color-scheme: dark;'

if OLD in content:
    content = content.replace(OLD, NEW)
    open('web/src/index.css', 'w').write(content)
    print("Patched index.css with color-scheme: dark")
