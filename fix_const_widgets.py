import os
import re

files = [
    'mobile/lib/features/portfolio/ui/tabs/news_tab.dart',
    'mobile/lib/features/portfolio/ui/tabs/shariah_tab.dart',
    'mobile/lib/features/portfolio/ui/tabs/purification_tab.dart'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Remove const from Text, Icon, TextStyle that contain AppTheme
        content = re.sub(r'const\s+Text\(', 'Text(', content)
        content = re.sub(r'const\s+Icon\(', 'Icon(', content)
        content = re.sub(r'const\s+TextStyle\(', 'TextStyle(', content)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed const widgets in {filepath}")
