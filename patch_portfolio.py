import os

filepath = 'mobile/lib/features/portfolio/ui/portfolio_screen.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Replace length
content = content.replace("length: 6,", "length: 5,")

# Remove Tab
old_tabs = """              Tab(text: 'Resources'),
              Tab(text: 'Guide'),
            ],"""
new_tabs = """              Tab(text: 'Resources'),
            ],"""
content = content.replace(old_tabs, new_tabs)

# Remove TabBarView child
old_views = """            ResourcesTab(),
            GuideTab(),
          ],"""
new_views = """            ResourcesTab(),
          ],"""
content = content.replace(old_views, new_views)

# Remove GuideTab import if it's unused (let's check first, but it's safe to just remove it)
# Actually, I'll just let the analyze complain if anything is wrong.

with open(filepath, 'w') as f:
    f.write(content)
