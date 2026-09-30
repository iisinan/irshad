content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD = """                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: ColorScheme.light(
                            primary: context.primary,
                            onPrimary: Colors.white,
                            onSurface: context.textDark,
                          ),
                        ),
                        child: child!,
                      );
                    },"""

NEW = """                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: Theme.of(context).colorScheme.copyWith(
                            primary: context.primary,
                            onPrimary: Colors.white,
                            onSurface: context.textDark,
                          ),
                        ),
                        child: child!,
                      );
                    },"""

if OLD in content:
    content = content.replace(OLD, NEW)
    open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
    print("Patched mobile date picker")
else:
    print("Could not find OLD in mobile code")
