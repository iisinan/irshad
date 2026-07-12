import 'package:flutter/material.dart';

class AppTheme {
  // Core Palette
  static const Color primary = Color(0xFF0F766E); // Deep Emerald Green
  static const Color primaryHover = Color(0xFF115E59);
  static const Color accent = Color(0xFFD4AF37); // Premium Gold, use sparingly
  
  // Backgrounds
  static const Color bg = Color(0xFFF8FAFC);
  static const Color bgAlt = Color(0xFFFFFFFF); // Cards
  static const Color bgSection = Color(0xFFF1F5F9); // Secondary Background
  static const Color divider = Color(0xFFE2E8F0);

  // Typography
  static const Color textDark = Color(0xFF1E293B);
  static const Color textBody = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textDisabled = Color(0xFFCBD5E1);

  // Status
  static const Color halal = Color(0xFF16A34A);
  static const Color questionable = Color(0xFFF59E0B);
  static const Color haram = Color(0xFFDC2626);
  static const Color review = Color(0xFF2563EB);

  // Theme Data
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'Inter',
      scaffoldBackgroundColor: bg,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: bgAlt,
        foregroundColor: textDark,
      ),
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: bgAlt,
        onSurface: textDark,
        background: bg,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bgAlt,
        selectedItemColor: primary,
        unselectedItemColor: textMuted,
        elevation: 16,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
    );
  }
}
