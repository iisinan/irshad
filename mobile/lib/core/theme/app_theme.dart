import 'package:flutter/material.dart';

class AppTheme {
  // Core Palette
  static const Color primary = Color(0xFF7B61FF); // Zoya Purple
  static const Color primaryHover = Color(0xFF6246E5);
  static const Color accent = Color(0xFF7B61FF); 
  static const Color accentSoft = Color(0xFFF3F0FF); // Light Purple bg
  
  // Backgrounds
  static const Color bg = Color(0xFFF8F9FA); // Off-white scaffold
  static const Color bgAlt = Color(0xFFFFFFFF); // Pure white cards
  static const Color bgSection = Color(0xFFF1F5F9); 
  static const Color divider = Color(0xFFF1F5F9);

  // Typography
  static const Color textDark = Color(0xFF111827); // Almost black
  static const Color textBody = Color(0xFF4B5563); 
  static const Color textMuted = Color(0xFF9CA3AF);
  static const Color textDisabled = Color(0xFFD1D5DB);

  // Status (Zoya Style)
  static const Color halal = Color(0xFF10B981); // Emerald Green
  static const Color questionable = Color(0xFFF59E0B); // Amber
  static const Color haram = Color(0xFFEF4444); // Red
  static const Color review = Color(0xFF3B82F6); // Blue

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
            borderRadius: BorderRadius.circular(100), // Aggressively rounded pill
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          elevation: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: bgAlt,
        elevation: 0,
        margin: EdgeInsets.zero,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: divider, width: 1),
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
