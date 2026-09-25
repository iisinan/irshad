import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/guide_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_nav = """    final navItems = [
      {'icon': Icons.business_center_rounded, 'title': 'Portfolio', 'desc': 'View your holdings and their Shariah compliance status, track portfolio performance and allocation.', 'color': context.primary},
      {'icon': Icons.bar_chart_rounded, 'title': 'Market Screener', 'desc': 'Check the Shariah compliance of all Nigerian stocks. View AAOIFI ratios and detailed screening reports.', 'color': Colors.deepPurple},
      {'icon': Icons.star_rounded, 'title': 'Alert (Watchlist)', 'desc': 'Monitor companies you are interested in. Set price alerts and receive notifications on status changes.', 'color': context.questionable},
      {'icon': Icons.insert_drive_file_rounded, 'title': 'Statement', 'desc': 'View a detailed financial statement of your portfolio activity and holdings over time.', 'color': Colors.lightBlue},
      {'icon': Icons.calculate_rounded, 'title': 'Zakat', 'desc': 'Automatically calculate your Zakat obligation based on your current portfolio holdings.', 'color': context.questionable},
      {'icon': Icons.verified_user_rounded, 'title': 'Purification', 'desc': 'Calculate and track income purification amounts for any Non-Compliant revenue earned.', 'color': context.halal},
      {'icon': Icons.menu_book_rounded, 'title': 'Resources', 'desc': 'Access Islamic finance educational content, lectures, and scholarship resources.', 'color': Colors.pink},
      {'icon': Icons.notifications_rounded, 'title': 'Updates', 'desc': 'Stay informed with compliance changes, business activity updates, and market intelligence.', 'color': context.review},
      {'icon': Icons.settings_rounded, 'title': 'Settings', 'desc': 'Manage notifications, account preferences, and personalise your Irshad experience.', 'color': Colors.grey},
    ];"""

new_nav = """    final navItems = [
      {'icon': Icons.business_center_rounded, 'title': 'Build your Portfolio', 'desc': 'View your holdings and their Shariah compliance status, track portfolio performance and allocation.', 'color': context.primary},
      {'icon': Icons.bar_chart_rounded, 'title': 'Screen a Stock', 'desc': 'Check the Shariah compliance of all Nigerian stocks. View AAOIFI ratios and detailed screening reports.', 'color': Colors.deepPurple},
      {'icon': Icons.star_rounded, 'title': 'Add to watchlist', 'desc': 'Monitor companies you are interested in. Set price alerts and receive notifications on status changes.', 'color': context.questionable},
      {'icon': Icons.insert_drive_file_rounded, 'title': 'Statement', 'desc': 'View a detailed financial statement of your portfolio activity and holdings over time.', 'color': Colors.lightBlue},
      {'icon': Icons.calculate_rounded, 'title': 'Calculate your Zakat', 'desc': 'Automatically calculate your Zakat obligation based on your current portfolio holdings.', 'color': context.questionable},
      {'icon': Icons.verified_user_rounded, 'title': 'Determine your Purification', 'desc': 'Calculate and track income purification amounts for any Non-Compliant revenue earned.', 'color': context.halal},
      {'icon': Icons.menu_book_rounded, 'title': 'Resources', 'desc': 'Access Islamic finance educational content, lectures, and scholarship resources.', 'color': Colors.pink},
      {'icon': Icons.notifications_rounded, 'title': 'Keep Updated', 'desc': 'Stay informed with compliance changes, business activity updates, and market intelligence.', 'color': context.review},
      {'icon': Icons.settings_rounded, 'title': 'Settings', 'desc': 'Manage notifications, account preferences, and personalise your Irshad experience.', 'color': Colors.grey},
    ];"""

content = content.replace(old_nav, new_nav)

with open(filepath, 'w') as f:
    f.write(content)
