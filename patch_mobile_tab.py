content = open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart').read()

# 1. Add UpgradePaywallBottomSheet import if not present
if 'upgrade_paywall_bottom_sheet.dart' not in content:
    content = content.replace("import '../widgets/islamic_quote_widget.dart';", "import '../widgets/islamic_quote_widget.dart';\nimport '../../../core/widgets/upgrade_paywall_bottom_sheet.dart';")

# 2. Add _isTabLocked logic
if 'bool _isTabLocked' not in content:
    content = content.replace(
        "Widget _buildSubTabNavigation(BuildContext context, int unreadCount) {",
        "bool _isTabLocked(String tabId, BuildContext context) {\n    final userTier = Provider.of<AppStateProvider>(context, listen: false).userProfile?['tier']?['slug'] ?? 'free';\n    if (userTier == 'max') return false;\n    if (userTier == 'pro') return tabId == 'compliance';\n    return tabId != 'news';\n  }\n\n  Widget _buildSubTabNavigation(BuildContext context, int unreadCount) {"
    )

# 3. Apply lock logic to rendering
OLD_RENDER = """          return GestureDetector(
            onTap: () => setState(() => _activeTabId = tab['id']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isActive ? context.primary : context.bgAlt,
                border: Border.all(color: isActive ? context.primary : context.appColors.divider),
                borderRadius: BorderRadius.circular(30),
                boxShadow: isActive ? [BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 2))] : [],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(tab['icon'], size: 16, color: isActive ? Colors.white : context.textDark),
                      const SizedBox(width: 8),
                      Text(
                        tab['label'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: isActive ? Colors.white : context.textDark,
                        ),
                      ),
                    ],
                  ),
                  if (hasNew)"""

NEW_RENDER = """          final isLocked = _isTabLocked(tab['id'], context);
          
          return GestureDetector(
            onTap: () {
              if (isLocked) {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (ctx) => const UpgradePaywallBottomSheet(message: 'Upgrade to view this section and get full access to the market intelligence.'),
                );
                return;
              }
              setState(() => _activeTabId = tab['id']);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isActive ? context.primary : context.bgAlt,
                border: Border.all(color: isActive ? context.primary : context.appColors.divider),
                borderRadius: BorderRadius.circular(30),
                boxShadow: isActive ? [BoxShadow(color: context.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 2))] : [],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(tab['icon'], size: 16, color: isActive ? Colors.white : isLocked ? context.textMuted : context.textDark),
                      const SizedBox(width: 8),
                      Text(
                        tab['label'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: isActive ? Colors.white : isLocked ? context.textMuted : context.textDark,
                        ),
                      ),
                      if (isLocked) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.lock_outline_rounded, size: 14, color: context.textMuted),
                      ],
                    ],
                  ),
                  if (hasNew && !isLocked)"""

content = content.replace(OLD_RENDER, NEW_RENDER)

open('mobile/lib/features/portfolio/ui/tabs/update_tab.dart', 'w').write(content)
print("Patched update_tab.dart")
