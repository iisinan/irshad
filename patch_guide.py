import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/guide_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """        // Content Area
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: _buildActiveSection(),
          ),
        ),"""

new_block = """        // Content Area
        Padding(
          padding: const EdgeInsets.all(20),
          child: _buildActiveSection(),
        ),"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
