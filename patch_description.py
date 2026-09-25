import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/resources_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_desc = "'This is an educational video provided by our Islamic Finance partners. Please note that the content is for educational purposes and should not be taken as direct financial advice.'"
new_desc = "'This is an Educational Video'"

content = content.replace(old_desc, new_desc)

with open(filepath, 'w') as f:
    f.write(content)
