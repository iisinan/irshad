import os

files_to_process = [
    'lib/features/auth/ui/login_screen.dart',
    'lib/features/auth/ui/register_screen.dart',
    'lib/features/auth/ui/forgot_password_screen.dart',
    'lib/features/auth/ui/profile_screen.dart',
    'lib/features/auth/ui/edit_profile_screen.dart',
    'lib/features/auth/ui/welcome_screen.dart',
    'lib/features/auth/ui/upgrade_screen.dart',
    'lib/features/onboarding/ui/onboarding_screen.dart',
    'lib/features/portfolio/ui/zakat_calculator_screen.dart',
    'lib/features/brokerage/ui/brokerage_link_screen.dart',
    'lib/features/stocks/ui/ai_analysis_sheet.dart',
    'lib/features/stocks/ui/trade_bottom_sheet.dart',
    'lib/features/stocks/ui/create_basket_screen.dart',
    'lib/features/stocks/ui/basket_detail_screen.dart',
    'lib/features/stocks/ui/ngx_market_screen.dart',
]

replacements = [
    # Replace white backgrounds
    ('backgroundColor: Colors.white,', 'backgroundColor: AppTheme.bg,'),
    ('color: Colors.white,', 'color: AppTheme.bgAlt,'),
    ('cardBg = Colors.white;', 'cardBg = AppTheme.bgAlt;'),
    ('fillColor: Colors.white,', 'fillColor: AppTheme.bgAlt,'),
    ('dropdownColor: Colors.white,', 'dropdownColor: AppTheme.bgAlt,'),
    
    # Exceptions that should stay white (usually text/icons on colored buttons)
    ('foregroundColor: AppTheme.bgAlt,', 'foregroundColor: Colors.white,'),
    ('color: AppTheme.bgAlt, fontSize: 32', 'color: Colors.white, fontSize: 32'),
    ('Icon(Icons.add, color: AppTheme.bgAlt)', 'Icon(Icons.add, color: Colors.white)'),
    ('color: AppTheme.bgAlt, size: 24', 'color: Colors.white, size: 24'),
    ('color: AppTheme.bgAlt, strokeWidth: 2', 'color: Colors.white, strokeWidth: 2'),
    ('strokeWidth: 2, color: AppTheme.bgAlt', 'strokeWidth: 2, color: Colors.white'),
    ('Icons.camera_alt_rounded, size: 16, color: AppTheme.bgAlt', 'Icons.camera_alt_rounded, size: 16, color: Colors.white'),
    
    # Border fixes
    ('Border.all(color: AppTheme.bgAlt', 'Border.all(color: AppTheme.divider'),
    ('Color(0xFFE2E8F0)', 'AppTheme.divider'),
    ('Color(0xFFF1F5F9)', 'AppTheme.divider'),
    ('Color(0xFFE5E7EB)', 'AppTheme.divider'),
    ('Colors.grey[100]', 'AppTheme.bg'),
    ('Colors.grey[200]', 'AppTheme.divider'),
    
    # Shadows
    ('Colors.black.withOpacity(0.05)', 'Colors.black.withOpacity(0.3)'),
    ('Colors.black.withOpacity(0.1)', 'Colors.black.withOpacity(0.4)'),
    ('Colors.black12', 'Colors.black38'),
    
    # Text colors
    ('color: Color(0xFF1E293B)', 'color: AppTheme.textDark'),
    ('color: Color(0xFF64748B)', 'color: AppTheme.textMuted'),
    ('color: Color(0xFF374151)', 'color: AppTheme.textMuted'),
    
    # AI Analysis Specifics
    ('color: Colors.blue.withOpacity(0.1)', 'color: Colors.amber.withOpacity(0.15)'),
    ('color: Colors.blue,', 'color: Colors.amber,'),
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist.")
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
        
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)
        
print("Phase 3 UI Overhaul applied.")
