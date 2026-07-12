import 'package:flutter/material.dart';

class AppTheme {
  // Core Palette
  static const Color primary = Color(0xFF0F5257); // Deep Teal
  static const Color primaryHover = Color(0xFF0B4347);
  static const Color accent = Color(0xFFC9B89C); // Warm Sand
  static const Color accentSoft = Color(0xFFEAF4F3); // Active Background
  
  // Backgrounds
  static const Color bg = Color(0xFFFAF8F5);
  static const Color bgAlt = Color(0xFFFFFFFF); // Cards
  static const Color bgSection = Color(0xFFF5F7FA); // Secondary Background
  static const Color divider = Color(0xFFECEFF3);

  // Typography
  static const Color textDark = Color(0xFF0D1B2A); // Primary Heading
  static const Color textBody = Color(0xFF334155); // Primary Text
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textDisabled = Color(0xFFCBD5E1);

  // Status
  static const Color halal = Color(0xFF22C55E);
  static const Color questionable = Color(0xFFF59E0B);
  static const Color haram = Color(0xFFEF4444);
  static const Color review = Color(0xFF3B82F6);

  // Theme Data
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'Manrope',
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
        selectedItemColor: primary, // Active navigation items are Deep Indigo
        unselectedItemColor: textMuted,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          elevation: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: bgAlt,
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.05),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: bgAlt,
        filled: true,
        hintStyle: const TextStyle(color: textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accent, width: 2), // Focus is Emerald Green
        ),
      ),
    );
  }
}
