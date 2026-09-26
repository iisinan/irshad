import re

content = open('mobile/lib/features/home/home_screen.dart').read()

OLD_ICON = """                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/settings'),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.bgAlt,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.settings_outlined, color: context.textDark, size: 20),
                      ),
                    ),"""

NEW_ICON = """                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/profile'),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.bgAlt,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.person_outline_rounded, color: context.textDark, size: 22),
                      ),
                    ),"""

content = content.replace(OLD_ICON, NEW_ICON)

open('mobile/lib/features/home/home_screen.dart', 'w').write(content)
print("Patched home_screen.dart")
