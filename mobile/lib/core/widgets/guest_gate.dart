import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_state_provider.dart';
import '../theme/app_theme.dart';

/// Enforces guest-mode limits (1 free stock screening + prompt to register/sign in
/// on account-based actions like adding holdings, watchlists, alerts, or AI).
class GuestGate {
  static const String _screenedSymbolKey = 'guest_screened_symbol';

  static bool isGuest(BuildContext context) {
    return !Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
  }

  /// Returns true if the guest has not yet screened a stock, or is revisiting
  /// the same single stock they already screened.
  static Future<bool> canScreenStock(String symbol) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_screenedSymbolKey);
    if (existing == null || existing.isEmpty) return true;
    return existing == symbol.toUpperCase();
  }

  static Future<void> recordGuestScreen(String symbol) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_screenedSymbolKey);
    if (existing == null || existing.isEmpty) {
      await prefs.setString(_screenedSymbolKey, symbol.toUpperCase());
    }
  }

  static Future<void> clearGuestScreen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_screenedSymbolKey);
  }

  static Future<void> showAuthPrompt(
    BuildContext context, {
    String title = 'Create a Free Account',
    String message = 'Create a free account or sign in to continue.',
  }) async {
    if (!context.mounted) return;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(
          24,
          24,
          24,
          24 + MediaQuery.of(ctx).padding.bottom,
        ),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                Icons.person_add_alt_1_rounded,
                size: 30,
                color: context.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: context.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: context.textMuted,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pushNamed(context, '/register');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Create Free Account',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pushNamed(context, '/login');
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: context.textDark,
                  side: BorderSide(color: context.divider, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                child: const Text(
                  'Sign In',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                'Continue Browsing',
                style: TextStyle(
                  color: context.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
