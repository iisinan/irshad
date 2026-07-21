import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CompanyAvatar extends StatelessWidget {
  final String? logoUrl;
  final String symbol;
  final double size;
  final double fontSize;
  final double borderRadius;

  const CompanyAvatar({
    super.key,
    required this.logoUrl,
    required this.symbol,
    this.size = 40.0,
    this.fontSize = 16.0,
    this.borderRadius = 12.0,
  });

  @override
  Widget build(BuildContext context) {
    if (logoUrl != null && logoUrl!.isNotEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: context.divider, width: 1),
          image: DecorationImage(
            image: NetworkImage(logoUrl!),
            fit: BoxFit.contain,
          ),
        ),
      );
    }

    // Deterministic color based on symbol
    final colors = [
      const Color(0xFF6366F1), // Indigo
      const Color(0xFF14B8A6), // Teal
      const Color(0xFFF59E0B), // Amber
      const Color(0xFF8B5CF6), // Violet
      const Color(0xFFEC4899), // Pink
      const Color(0xFF3B82F6), // Blue
      const Color(0xFF10B981), // Emerald
      const Color(0xFFEF4444), // Red
    ];
    
    int hash = 0;
    for (int i = 0; i < symbol.length; i++) {
      hash = symbol.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final colorIndex = hash.abs() % colors.length;
    final bgColor = colors[colorIndex];
    final initials = symbol.length >= 2 ? symbol.substring(0, 2) : symbol;

    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Text(
        initials.toUpperCase(),
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: fontSize,
        ),
      ),
    );
  }
}
