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
      "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
      "transliteration": "Allaahumma 'innee 'as'aluka 'ilman naafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
      "translation": "O Allaah, I ask You for beneficial knowledge, good provision, and accepted deeds.",
      "source": "Ibn Majah: 5:925"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "When the verses of Surat Al-Baqara about the usury (Riba) were revealed, the Prophet went to the mosque and recited them in front of the people and then banned the trade of alcohol.",
      "source": "Sahih al-Bukhari 459 (Narrated `Aisha)"
    },
    {
      "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
      "transliteration": "Allaahumma 'innee 'as'aluka min fadhlika.",
      "translation": "O Allah, I ask You for Your bounty and generosity.",
      "source": "Abu Dawud 2:465"
    },
    {
      "arabic": "",
      "transliteration": "",
      "translation": "I said, 'O Messenger of Allah, tell me something about Islam which I can ask of no one but you.' He said, 'Say I believe in Allah — and then be steadfast.'",
      "source": "[Muslim] Hadith 21, 40 Hadith an-Nawawi"
    },
    {
      "arabic": "اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَاجْبُرْنِي، وَعَافِنِي، وَارْزُقْنِي، وَارْفَعْنِي",
      "transliteration": "Allaahum-maghfir lee, warhamnee, wahdinee, wajburnee, wa 'aafinee, warzuqnee, warfa'nee.",
      "translation": "O Allaah, forgive me, have mercy on me, guide me, strengthen me, grant me well-being, provide for me, and elevate me.",
      "source": "Ibn Majah 34:3845, At-Tirmidhi 2:284"
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
