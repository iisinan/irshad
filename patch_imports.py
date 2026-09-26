import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

IMPORTS_TO_ADD = """import '../../../../core/providers/app_state_provider.dart';
import '../../../../core/widgets/upgrade_paywall_bottom_sheet.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';"""

content = content.replace("import 'package:irshad_mobile/core/theme/app_theme.dart';", IMPORTS_TO_ADD)

open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Added imports")
