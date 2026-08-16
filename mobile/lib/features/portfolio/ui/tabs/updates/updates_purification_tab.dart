import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class UpdatesPurificationTab extends StatelessWidget {
  const UpdatesPurificationTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHero(context),
          const SizedBox(height: 32),
          _buildSectionHeading(context, 'Why Do We Need Purification?'),
          _buildWhyWeNeedPurification(context),
          const SizedBox(height: 32),
          _buildQuote(context),
          const SizedBox(height: 32),
          _buildRulesAndMisconceptions(context),
          const SizedBox(height: 32),
          _buildSectionHeading(context, 'How Irshad Does It Automatically'),
          _buildHowItWorks(context),
          const SizedBox(height: 32),
          _buildSectionHeading(context, 'Where Should Purified Funds Go?'),
          _buildWhereToDonate(context),
          const SizedBox(height: 32),
          _buildSectionHeading(context, 'Frequently Asked Questions'),
          _buildFAQ(context),
        ],
      ),
    );
  }

  Widget _buildSectionHeading(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 24,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.primary, const Color(0xFFD1A562)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF5B2971), Color(0xFF3b0764), Color(0xFF1e003d)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFF3b0764).withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 12)),
        ],
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(Icons.water_drop, size: 160, color: Colors.white.withValues(alpha: 0.05)),
          ),
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified_user, size: 12, color: Color(0xFFE0B040)),
                      const SizedBox(width: 6),
                      Text(
                        'AAOIFI STANDARD NO. 21',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withValues(alpha: 0.9), letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'The Essence of',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, height: 1.1, letterSpacing: -1),
                ),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Color(0xFFE6C893), Color(0xFFD1A562)],
                  ).createShader(bounds),
                  child: const Text(
                    'Wealth Purification',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, height: 1.1, letterSpacing: -1),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Purification (Tathir / تطهير) is the spiritual and financial obligation of cleansing your investment returns from trace amounts of impermissible income. It is not optional — it is a religious duty every Muslim investor must fulfil.',
                  style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.8), height: 1.6),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildPill(Icons.verified_user, 'Religious Obligation'),
                    _buildPill(Icons.monetization_on, 'Dividends Only'),
                    _buildPill(Icons.balance, 'AAOIFI Standard'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white.withValues(alpha: 0.85)),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.85))),
        ],
      ),
    );
  }

  Widget _buildWhyWeNeedPurification(BuildContext context) {
    return Column(
      children: [
        _buildInfoCard(context, Icons.monetization_on, const Color(0xFF8A4C9E), context.primary.withValues(alpha: 0.1), 'No Company is Perfectly Pure', 'In the modern economy, virtually every listed company keeps cash in conventional bank accounts that generate interest. This is unavoidable — even the most halal-intentioned business does it. The impure income is a by-product of participation in the global financial system.'),
        const SizedBox(height: 16),
        _buildInfoCard(context, Icons.account_balance, const Color(0xFFD1A562), const Color(0xFFD1A562).withValues(alpha: 0.1), 'Dividends Carry Trace Impurity', 'When you receive dividends, you receive a proportional slice of all of the company\'s earnings — including the tiny amount from interest. Even if the proportion is 0.3%, that fraction is not yours to keep. You must give it away without expectation of reward.'),
        const SizedBox(height: 16),
        _buildInfoCard(context, Icons.favorite, const Color(0xFF22C55E), const Color(0xFF22C55E).withValues(alpha: 0.1), 'Fulfils Your Religious Obligation', 'Allah (SWT) says: "O you who believe! Give of the good things which you have earned" (Al-Baqarah: 267). Scholars explain this includes ensuring wealth is free from impermissible sources. Purification is how you honour that command as an investor.'),
        const SizedBox(height: 16),
        _buildInfoCard(context, Icons.bar_chart, const Color(0xFF6366F1), const Color(0xFF6366F1).withValues(alpha: 0.1), 'Preserves Barakah in Your Wealth', 'Leaving impure income in your portfolio can remove barakah (divine blessing) from all your earnings. Scholars consistently advise that prompt purification is a direct cause of Allah\'s barakah in your finances, health, and family\'s provision.'),
      ],
    );
  }

  Widget _buildInfoCard(BuildContext context, IconData icon, Color iconColor, Color iconBg, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark, height: 1.2)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(desc, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6)),
        ],
      ),
    );
  }

  Widget _buildQuote(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.menu_book, size: 12, color: context.primary),
                const SizedBox(width: 6),
                Text('HADITH', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: context.primary, letterSpacing: 0.5)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '"Allah does not accept charity from wealth acquired through wrongdoing."',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, color: context.textDark, height: 1.4),
          ),
          const SizedBox(height: 12),
          Text('— Sahih Muslim, Book of Zakat', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted)),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          Text(
            'This is precisely why purification funds cannot be given with the intention of charity (Sadaqah). They are not charity — they are the return of what is not rightfully yours. The two are fundamentally different in both ruling and intention.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: context.textMuted, height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _buildRulesAndMisconceptions(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.divider),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Icon(Icons.balance, size: 18, color: context.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('The AAOIFI 5% Rule', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Islamic scholars recognise that in the modern economy, almost no public company is 100% free from conventional banking. AAOIFI Standard No. 21 permits investment if impermissible income is less than 5% of total revenue — but that portion must be purified from dividends.',
                style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFF22C55E).withValues(alpha: 0.07), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.2))),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, size: 16, color: Color(0xFF22C55E)),
                    const SizedBox(width: 10),
                    Expanded(child: Text.rich(TextSpan(children: [
                      TextSpan(text: '≤ 5% impure revenue', style: TextStyle(fontWeight: FontWeight.w700, color: context.textDark, fontSize: 12)),
                      TextSpan(text: ' — Permissible to invest, must purify dividends', style: TextStyle(color: context.textMuted, fontSize: 12)),
                    ]))),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.07), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2))),
                child: Row(
                  children: [
                    const Icon(Icons.close, size: 16, color: Color(0xFFEF4444)),
                    const SizedBox(width: 10),
                    Expanded(child: Text.rich(TextSpan(children: [
                      TextSpan(text: '> 5% impure revenue', style: TextStyle(fontWeight: FontWeight.w700, color: context.textDark, fontSize: 12)),
                      TextSpan(text: ' — Non-compliant; haram to invest', style: TextStyle(color: context.textMuted, fontSize: 12)),
                    ]))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.divider),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFD1A562).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.warning_amber_rounded, size: 18, color: Color(0xFFD1A562)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('Common Misconceptions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildMyth('I must sell the stock if it earns any interest.', 'False. Below 5% impure income, you keep the stock and only purify dividends received.', context),
              const SizedBox(height: 12),
              _buildMyth('I must purify capital gains from selling shares.', 'False. Capital gains do not require purification per the majority of scholars.', context),
              const SizedBox(height: 12),
              _buildMyth('Purification is optional if the amount is tiny.', 'False. Even a fraction of ₦1 that is impure must be removed. There is no minimum.', context),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMyth(String myth, String fact, BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 2),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.1), shape: BoxShape.circle),
          child: const Icon(Icons.close, size: 10, color: Color(0xFFEF4444)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(myth, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
              const SizedBox(height: 2),
              Text(fact, style: TextStyle(fontSize: 12, color: context.textMuted, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHowItWorks(BuildContext context) {
    final steps = [
      {'step': 1, 'title': 'Dividend Declared', 'desc': 'A company in your portfolio announces a cash payout.', 'icon': Icons.auto_awesome, 'color': context.primary, 'bg': context.primary.withValues(alpha: 0.1)},
      {'step': 2, 'title': 'Financials Scanned', 'desc': "Irshad reads the company's annual reports for impure revenue figures.", 'icon': Icons.menu_book, 'color': const Color(0xFF6366F1), 'bg': const Color(0xFF6366F1).withValues(alpha: 0.1)},
      {'step': 3, 'title': 'Ratio Calculated', 'desc': 'We compute the exact AAOIFI impure income ratio for that year.', 'icon': Icons.calculate, 'color': const Color(0xFFD1A562), 'bg': const Color(0xFFD1A562).withValues(alpha: 0.1)},
      {'step': 4, 'title': 'Amount Due', 'desc': 'Dividend × impure ratio = exact naira amount you must donate.', 'icon': Icons.monetization_on, 'color': const Color(0xFFEF4444), 'bg': const Color(0xFFEF4444).withValues(alpha: 0.1)},
      {'step': 5, 'title': 'You Purify', 'desc': 'Tap "Purify" in the app and donate. Your wealth is cleansed.', 'icon': Icons.volunteer_activism, 'color': const Color(0xFF22C55E), 'bg': const Color(0xFF22C55E).withValues(alpha: 0.1)},
    ];

    return Column(
      children: steps.map((s) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: s['bg'] as Color, borderRadius: BorderRadius.circular(12)),
                child: Icon(s['icon'] as IconData, size: 20, color: s['color'] as Color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s['title'] as String, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                    const SizedBox(height: 2),
                    Text(s['desc'] as String, style: TextStyle(fontSize: 12, color: context.textMuted, height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildWhereToDonate(BuildContext context) {
    final uses = ['The poor & needy', 'Disaster relief', 'Supporting orphans', 'Public utilities', 'Free medical care', 'Clean water projects'];
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(Icons.volunteer_activism, size: 100, color: const Color(0xFF22C55E).withValues(alpha: 0.1)),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'The purification amount must be given away to charitable causes. It cannot benefit you or your family in any way. The following are accepted channels approved by Shariah scholars:',
                  style: TextStyle(fontSize: 13, color: Color(0xFF166534), height: 1.5),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: uses.map((u) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check_circle, size: 14, color: Color(0xFF22C55E)),
                        const SizedBox(width: 6),
                        Text(u, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.textDark)),
                      ],
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10)],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.error_outline, size: 20, color: Color(0xFF22C55E)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Critical Shariah Ruling: Intention (Niyyah) Must Be Correct', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark)),
                            const SizedBox(height: 6),
                            Text.rich(
                              TextSpan(
                                children: [
                                  const TextSpan(text: 'You '),
                                  TextSpan(text: 'must not', style: TextStyle(fontWeight: FontWeight.w700, color: context.textDark)),
                                  const TextSpan(text: ' intend this as Sadaqah (voluntary charity) or expect any spiritual reward (thawab). Allah is pure and only accepts what is pure. Your sole intention must be to '),
                                  TextSpan(text: 'rid yourself of impermissible wealth', style: TextStyle(fontWeight: FontWeight.w700, color: context.textDark)),
                                  const TextSpan(text: '. This is what separates Tathir from charity.'),
                                ],
                              ),
                              style: TextStyle(fontSize: 12, color: context.textMuted, height: 1.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAQ(BuildContext context) {
    final faqs = [
      {'q': 'Do I need to purify capital gains when I sell a stock?', 'a': 'No. According to the majority of contemporary scholars, capital gains — profit earned from selling shares at a higher price — do not require purification. Only dividends need to be cleansed, since they are a direct distribution of the company\'s earnings which may include trace impure income.'},
      {'q': 'Do I have to sell a stock because it earns some interest?', 'a': 'No. As long as the core business is halal and the impermissible income (e.g., interest on bank deposits) is below 5% of total revenue, you may continue to hold the stock. Your obligation is simply to purify the corresponding portion of any dividends you receive.'},
      {'q': 'What if I forgot to purify for a previous year?', 'a': 'You should purify retroactively as soon as you become aware. The obligation does not expire. Calculate the impure portion of all dividends received during that period and donate that amount at your earliest convenience without delay.'},
      {'q': 'Can I donate purified funds to my local masjid?', 'a': 'Most scholars permit giving to mosques for operational costs (utilities, maintenance), but not for construction. The safest scholarly opinion is to direct purification funds to the poor and needy, or general public welfare causes, and not to personal or family benefit.'},
      {'q': 'Is purification the same as Zakat?', 'a': 'No. Zakat is a mandatory pillar of Islam with its own nisab threshold and immense spiritual reward. Purification (Tathir) is a separate obligation specifically to remove impermissible wealth from your hands — it carries no spiritual reward (thawab) and should not be confused with Sadaqah either.'},
    ];

    return Column(
      children: faqs.map((f) => _FAQItem(q: f['q']!, a: f['a']!)).toList(),
    );
  }
}

class _FAQItem extends StatefulWidget {
  final String q;
  final String a;
  const _FAQItem({required this.q, required this.a});
  @override
  State<_FAQItem> createState() => _FAQItemState();
}

class _FAQItemState extends State<_FAQItem> {
  bool _expanded = false;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _expanded ? context.primary.withValues(alpha: 0.05) : context.bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _expanded ? context.primary.withValues(alpha: 0.2) : context.divider),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(widget.q, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textDark)),
          iconColor: context.primary,
          collapsedIconColor: context.textMuted,
          onExpansionChanged: (v) => setState(() => _expanded = v),
          childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
          children: [
            Text(widget.a, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
          ],
        ),
      ),
    );
  }
}
