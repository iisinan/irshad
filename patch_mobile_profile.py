content = open('mobile/lib/features/auth/ui/profile_screen.dart').read()

OLD_BLOCK = """                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: context.primary.withOpacity(0.2)),
                  ),
                  child: Text(
                    'Free Plan',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.primary),
                  ),
                ),"""

NEW_BLOCK = """                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: user?['tier']?['slug'] == 'max' ? const Color(0xFFD9A05B).withOpacity(0.15) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46).withOpacity(0.1) : context.bgSection,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: user?['tier']?['slug'] == 'max' ? const Color(0xFFD9A05B).withOpacity(0.3) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46).withOpacity(0.2) : context.border),
                  ),
                  child: Text(
                    (user?['tier']?['name'] ?? 'Miftah').toUpperCase(),
                    style: TextStyle(
                      fontSize: 10, 
                      fontWeight: FontWeight.w900, 
                      letterSpacing: 0.5,
                      color: user?['tier']?['slug'] == 'max' ? const Color(0xFFB8860B) : user?['tier']?['slug'] == 'pro' ? const Color(0xFF006B46) : context.textMuted,
                    ),
                  ),
                ),"""

content = content.replace(OLD_BLOCK, NEW_BLOCK)
open('mobile/lib/features/auth/ui/profile_screen.dart', 'w').write(content)
print("Replaced in mobile profile screen")
