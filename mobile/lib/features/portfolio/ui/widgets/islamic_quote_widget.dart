import 'dart:math';
import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class IslamicQuoteWidget extends StatefulWidget {
  final bool compact;
  const IslamicQuoteWidget({super.key, this.compact = true});

  @override
  State<IslamicQuoteWidget> createState() => _IslamicQuoteWidgetState();
}

class _IslamicQuoteWidgetState extends State<IslamicQuoteWidget> {
  bool _isVisible = true;
  late Map<String, String> _quote;

  final List<Map<String, String>> _quotes = [
    {
      "arabic": "",
      "transliteration": "",
      "translation": "And I said, 'Seek your Lord's forgiveness, for He is truly Most Forgiving. He will shower you with abundant rain, and He will supply you with wealth and children, and give you gardens as well as rivers.'",
      "source": "Surah Nuh (71:10–12)"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "And when the prayer has been concluded, disperse within the land and seek from the bounty of Allah, and remember Allah often that you may succeed.",
      "source": "Surah Al-Jumu'ah (62:10)"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "It is He who made the earth tame for you - so walk among its slopes and eat of His provision [rizq], and to Him is the resurrection.",
      "source": "Surah Al-Mulk (67:15)"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "If you are grateful, I will surely increase you [in favor]",
      "source": "Surah Ibrahim (14:7)"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "And whoever relies on Allah, He will make a way out for them, and provide for them from sources they could never imagine. And whoever puts their trust in Allah, then He alone is sufficient for them.",
      "source": "Surah At-Talaq (65:2-3)"
    }
  ];

  @override
  void initState() {
    super.initState();
    _quote = _quotes[Random().nextInt(_quotes.length)];
  }

  @override
  Widget build(BuildContext context) {
    if (!_isVisible) return const SizedBox.shrink();

    if (widget.compact) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: context.bg,
          border: Border.all(color: context.appColors.divider),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(Icons.menu_book_rounded, size: 20, color: context.primary.withValues(alpha: 0.8)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '"${_quote["translation"]!}"',
                    style: TextStyle(
                      fontSize: 12,
                      color: context.textDark,
                      fontWeight: FontWeight.w600,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "— ${_quote["source"]!}",
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: context.primary.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => setState(() => _isVisible = false),
              child: Icon(Icons.close_rounded, size: 16, color: context.textMuted.withValues(alpha: 0.5)),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.appColors.divider),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(Icons.menu_book_rounded, size: 20, color: context.primary),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_quote["arabic"]!.isNotEmpty) ...[
                  Text(
                    _quote["arabic"]!,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: 20,
                      fontFamily: 'Amiri',
                      color: context.textDark,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                Text(
                  '"${_quote["translation"]!}"',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.textDark,
                    fontWeight: FontWeight.w600,
                    fontStyle: FontStyle.italic,
                    height: 1.6,
                  ),
                ),
                if (_quote["transliteration"]!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    _quote["transliteration"]!,
                    style: TextStyle(
                      fontSize: 12,
                      color: context.textMuted,
                      height: 1.5,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  _quote["source"]!,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: context.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => setState(() => _isVisible = false),
            child: Icon(Icons.close_rounded, size: 18, color: context.textMuted.withValues(alpha: 0.5)),
          ),
        ],
      ),
    );
  }
}
