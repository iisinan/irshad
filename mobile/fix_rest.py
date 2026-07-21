import os

files_to_process = [
    'lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart',
    'lib/features/stocks/ui/stock_search_screen.dart',
]

replacements = [
    # Replace white backgrounds in containers, bottom sheets, etc.
    ('color: Colors.white,', 'color: AppTheme.bgAlt,'),
    ('backgroundColor: Colors.white,', 'backgroundColor: AppTheme.bgAlt,'),
    
    # But restore white for foregrounds/text that got accidentally matched (if any)
    ('foregroundColor: AppTheme.bgAlt,', 'foregroundColor: Colors.white,'),
    ('color: AppTheme.bgAlt, fontSize: 32', 'color: Colors.white, fontSize: 32'), # Portfolio balance text
    ('Icon(Icons.add, color: AppTheme.bgAlt)', 'Icon(Icons.add, color: Colors.white)'), # Portfolio FAB icon
    ('color: AppTheme.bgAlt, size: 24', 'color: Colors.white, size: 24'), # Stock search icon fallback
    
    # Fix border colors
    ('Color(0xFFE2E8F0)', 'AppTheme.divider'),
    ('Color(0xFFF1F5F9)', 'AppTheme.divider'),
    ('Color(0xFFE5E7EB)', 'AppTheme.divider'),
    ('Colors.grey[100]', 'AppTheme.bg'),
    ('Colors.grey[200]', 'AppTheme.divider'),
    
    # Fix shadows for dark mode
    ('Colors.black.withOpacity(0.05)', 'Colors.black.withOpacity(0.3)'),
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
        
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

print("Applied replacements for portfolio and search screens.")
