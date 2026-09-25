import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/resources_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_return = """    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 20.0, bottom: 100.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,"""

new_return = """    return Padding(
      padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 20.0, bottom: 100.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,"""

content = content.replace(old_return, new_return)

with open(filepath, 'w') as f:
    f.write(content)
