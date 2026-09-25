import re

content = open('web/src/App.jsx').read()

old_logic = "// Hide if the user already has a paid subscription (or is grandfathered in)\n  if (user?.active_subscription) return null;"
new_logic = "// Hide if the user already has a paid subscription (or is grandfathered in)\n  if (user?.has_paid_subscription) return null;"

content = content.replace(old_logic, new_logic)

with open('web/src/App.jsx', 'w') as f:
    f.write(content)
print("done")
