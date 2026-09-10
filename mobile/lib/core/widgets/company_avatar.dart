import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';

/// CompanyAvatar — 3-level logo fallback:
///   1. logoUrl  (API-supplied network URL, cached)
///   2. GCS bucket https://storage.googleapis.com/irshad-images/logos/<symbol>.png
///   3. Local bundled asset  assets/logos/<SYMBOL>.png
///   4. Coloured initials (final fallback)
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

  static const String _gcsBucket =
      'https://storage.googleapis.com/irshad-images/logos/';

  String get _gcsUrl => '$_gcsBucket${symbol.toLowerCase()}.png';

  Widget _buildInitials(BuildContext context) {
    const colors = [
      Color(0xFF5B2971), // Brand purple
      Color(0xFF14B8A6), // Teal
      Color(0xFFF59E0B), // Amber
      Color(0xFF8B5CF6), // Violet
      Color(0xFFEC4899), // Pink
      Color(0xFF3B82F6), // Blue
      Color(0xFF10B981), // Emerald
      Color(0xFFEF4444), // Red
    ];

    int hash = 0;
    for (int i = 0; i < symbol.length; i++) {
      hash = symbol.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final bgColor = colors[hash.abs() % colors.length];
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

  Widget _container({required Widget child, required BuildContext context}) =>
      Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: context.divider, width: 1),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius - 1),
          child: Padding(padding: const EdgeInsets.all(2.0), child: child),
        ),
      );

  /// Level 3: local asset → initials
  Widget _localAssetWithFallback(BuildContext context) =>
      _container(
        context: context,
        child: Image.asset(
          'assets/logos/${symbol.toUpperCase()}.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
          errorBuilder: (_, __, _unused) => _buildInitials(context),
        ),
      );

  /// Level 2: GCS URL → local asset → initials
  Widget _gcsWithFallback(BuildContext context) => CachedNetworkImage(
        imageUrl: _gcsUrl,
        imageBuilder: (ctx, imageProvider) => _container(
          context: context,
          child: Image(
            image: imageProvider,
            width: size,
            height: size,
            fit: BoxFit.contain,
          ),
        ),
        errorWidget: (_, __, _unused) => _localAssetWithFallback(context),
        placeholder: (_, __) => _container(
          context: context,
          child: const SizedBox.shrink(),
        ),
        fadeInDuration: Duration.zero,
        fadeOutDuration: Duration.zero,
      );

  @override
  Widget build(BuildContext context) {
    // Level 1: use supplied network logoUrl if available
    final url = logoUrl?.trim();
    if (url != null && url.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: url,
        imageBuilder: (ctx, imageProvider) => _container(
          context: context,
          child: Image(
            image: imageProvider,
            width: size,
            height: size,
            fit: BoxFit.contain,
          ),
        ),
        errorWidget: (_, __, _unused) => _gcsWithFallback(context),
        placeholder: (_, __) => _container(
          context: context,
          child: const SizedBox.shrink(),
        ),
        fadeInDuration: Duration.zero,
        fadeOutDuration: Duration.zero,
      );
    }

    // Level 2+: no logoUrl supplied, try GCS then local
    return _gcsWithFallback(context);
  }
}
