import 'package:flutter/material.dart';

class AppColors extends ThemeExtension<AppColors> {
  final Color halal;
  final Color halalBg;
  final Color questionable;
  final Color questionableBg;
  final Color haram;
  final Color haramBg;
  final Color review;
  final Color accentSoft;
  final Color bgSection;
  final Color divider;
  final Color textBody;
  final Color textDisabled;

  const AppColors({
    required this.halal,
    required this.halalBg,
    required this.questionable,
    required this.questionableBg,
    required this.haram,
    required this.haramBg,
    required this.review,
    required this.accentSoft,
    required this.bgSection,
    required this.divider,
    required this.textBody,
    required this.textDisabled,
  });

  @override
  AppColors copyWith({
    Color? halal,
    Color? halalBg,
    Color? questionable,
    Color? questionableBg,
    Color? haram,
    Color? haramBg,
    Color? review,
    Color? accentSoft,
    Color? bgSection,
    Color? divider,
    Color? textBody,
    Color? textDisabled,
  }) {
    return AppColors(
      halal: halal ?? this.halal,
      halalBg: halalBg ?? this.halalBg,
      questionable: questionable ?? this.questionable,
      questionableBg: questionableBg ?? this.questionableBg,
      haram: haram ?? this.haram,
      haramBg: haramBg ?? this.haramBg,
      review: review ?? this.review,
      accentSoft: accentSoft ?? this.accentSoft,
      bgSection: bgSection ?? this.bgSection,
      divider: divider ?? this.divider,
      textBody: textBody ?? this.textBody,
      textDisabled: textDisabled ?? this.textDisabled,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      halal: Color.lerp(halal, other.halal, t)!,
      halalBg: Color.lerp(halalBg, other.halalBg, t)!,
      questionable: Color.lerp(questionable, other.questionable, t)!,
      questionableBg: Color.lerp(questionableBg, other.questionableBg, t)!,
      haram: Color.lerp(haram, other.haram, t)!,
      haramBg: Color.lerp(haramBg, other.haramBg, t)!,
      review: Color.lerp(review, other.review, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      bgSection: Color.lerp(bgSection, other.bgSection, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      textBody: Color.lerp(textBody, other.textBody, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
    );
  }
}

class AppTheme {
  // Core Palette
  static const Color primary = Color(0xFF10B981); // Emerald Green
  static const Color primaryHover = Color(0xFF059669);
  static const Color accent = Color(0xFF10B981); 

  // Dark Colors
  static const Color darkBg = Color(0xFF111111);
  static const Color darkBgAlt = Color(0xFF1A1A1A);
  static const Color darkBgSection = Color(0xFF1F1F1F);
  static const Color darkDivider = Color(0xFF2A2A2A);
  static const Color darkText = Color(0xFFFFFFFF);
  static const Color darkTextBody = Color(0xFFE5E7EB);
  static const Color darkTextMuted = Color(0xFF9CA3AF);
  static const Color darkTextDisabled = Color(0xFF4B5563);
  static const Color darkAccentSoft = Color(0xFF062C1B); 

  // Light Colors
  static const Color lightBg = Color(0xFFFFFFFF);
  static const Color lightBgAlt = Color(0xFFF9FAFB);
  static const Color lightBgSection = Color(0xFFF3F4F6);
  static const Color lightDivider = Color(0xFFE5E7EB);
  static const Color lightText = Color(0xFF111827);
  static const Color lightTextBody = Color(0xFF374151);
  static const Color lightTextMuted = Color(0xFF6B7280);
  static const Color lightTextDisabled = Color(0xFF9CA3AF);
  static const Color lightAccentSoft = Color(0xFFD1FAE5); 

  // Shared Status Colors
  static const Color halal = Color(0xFF10B981);
  static const Color questionable = Color(0xFFF59E0B);
  static const Color haram = Color(0xFFEF4444);
  static const Color review = Color(0xFF3B82F6);

  static const _darkColors = AppColors(
    halal: halal,
    halalBg: Color(0xFF062C1B),
    questionable: questionable,
    questionableBg: Color(0xFF3D2B15),
    haram: haram,
    haramBg: Color(0xFF451A1A),
    review: review,
    accentSoft: darkAccentSoft,
    bgSection: darkBgSection,
    divider: darkDivider,
    textBody: darkTextBody,
    textDisabled: darkTextDisabled,
  );

  static const _lightColors = AppColors(
    halal: halal,
    halalBg: Color(0xFFD1FAE5),
    questionable: questionable,
    questionableBg: Color(0xFFFEF3C7),
    haram: haram,
    haramBg: Color(0xFFFEE2E2),
    review: review,
    accentSoft: lightAccentSoft,
    bgSection: lightBgSection,
    divider: lightDivider,
    textBody: lightTextBody,
    textDisabled: lightTextDisabled,
  );

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: 'Manrope',
      scaffoldBackgroundColor: darkBg,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: darkBg,
        foregroundColor: darkText,
      ),
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: darkBgAlt,
        onSurface: darkText,
        background: darkBg,
      ),
      textTheme: const TextTheme(
        bodyMedium: TextStyle(color: darkTextMuted),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkBgAlt,
        selectedItemColor: primary,
        unselectedItemColor: darkTextMuted,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          elevation: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkBgAlt,
        elevation: 0,
        margin: EdgeInsets.zero,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkDivider, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: darkBgAlt,
        filled: true,
        hintStyle: const TextStyle(color: darkTextMuted),
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
          borderSide: const BorderSide(color: accent, width: 2),
        ),
      ),
      extensions: const [_darkColors],
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'Manrope',
      scaffoldBackgroundColor: lightBg,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: lightBg,
        foregroundColor: lightText,
      ),
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: lightBgAlt,
        onSurface: lightText,
        background: lightBg,
      ),
      textTheme: const TextTheme(
        bodyMedium: TextStyle(color: lightTextMuted),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: lightBgAlt,
        selectedItemColor: primary,
        unselectedItemColor: lightTextMuted,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          elevation: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightBgAlt,
        elevation: 0,
        margin: EdgeInsets.zero,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightDivider, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: lightBgAlt,
        filled: true,
        hintStyle: const TextStyle(color: lightTextMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightDivider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightDivider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accent, width: 2),
        ),
      ),
      extensions: const [_lightColors],
    );
  }
}

// Convenient BuildContext extensions for colors
extension ThemeContext on BuildContext {
  ThemeData get theme => Theme.of(this);
  AppColors get appColors => theme.extension<AppColors>()!;
  
  Color get bg => theme.scaffoldBackgroundColor;
  Color get bgAlt => theme.colorScheme.surface;
  Color get textDark => theme.colorScheme.onSurface;
  Color get primary => theme.colorScheme.primary;
  Color get textMuted => theme.textTheme.bodyMedium?.color ?? AppTheme.darkTextMuted;
  
  Color get halal => appColors.halal;
  Color get halalBg => appColors.halalBg;
  Color get questionable => appColors.questionable;
  Color get questionableBg => appColors.questionableBg;
  Color get haram => appColors.haram;
  Color get haramBg => appColors.haramBg;
  Color get review => appColors.review;
  Color get accentSoft => appColors.accentSoft;
  Color get bgSection => appColors.bgSection;
  Color get divider => appColors.divider;
  Color get textBody => appColors.textBody;
  Color get textDisabled => appColors.textDisabled;
}
