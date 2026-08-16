import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class GuideTab extends StatefulWidget {
  const GuideTab({super.key});

  @override
  State<GuideTab> createState() => _GuideTabState();
}

class _GuideTabState extends State<GuideTab> {
  String _activeSection = 'getting-started';

  final List<Map<String, dynamic>> _sections = [
    {'id': 'getting-started', 'label': 'Getting Started', 'icon': Icons.menu_book_rounded},
    {'id': 'methodology', 'label': 'AAOIFI Standards', 'icon': Icons.verified_user_rounded},
    {'id': 'navigation', 'label': 'Navigation Guide', 'icon': Icons.explore_rounded},
    {'id': 'faq', 'label': 'FAQs', 'icon': Icons.help_outline_rounded},
    {'id': 'tutorials', 'label': 'Tutorials & Guides', 'icon': Icons.play_circle_outline_rounded},
    {'id': 'support', 'label': 'Support', 'icon': Icons.support_agent_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Horizontal Scroll Nav
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Row(
            children: _sections.map((s) {
              final isActive = _activeSection == s['id'];
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: InkWell(
                  onTap: () => setState(() => _activeSection = s['id']),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isActive ? context.primary : context.bg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isActive ? context.primary : context.divider),
                    ),
                    child: Row(
                      children: [
                        Icon(s['icon'], size: 16, color: isActive ? Colors.white : context.textMuted),
                        const SizedBox(width: 8),
                        Text(
                          s['label'],
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isActive ? Colors.white : context.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        // Content Area
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: _buildActiveSection(),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveSection() {
    switch (_activeSection) {
      case 'getting-started':
        return _buildGettingStarted();
      case 'methodology':
        return _buildMethodology();
      case 'navigation':
        return _buildNavigation();
      case 'faq':
        return _buildFaq();
      case 'tutorials':
        return _buildTutorials();
      case 'support':
        return _buildSupport();
      default:
        return const SizedBox();
    }
  }

  // ---------------------------------------------------------
  // 1. GETTING STARTED
  // ---------------------------------------------------------
  Widget _buildGettingStarted() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionHeader(Icons.menu_book_rounded, 'Getting Started with Irshad'),
        
        // What is Irshad
        Container(
          padding: const EdgeInsets.all(24),
          margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [context.primary.withValues(alpha: 0.1), context.primary.withValues(alpha: 0.02)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: context.primary.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: context.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.verified_user_rounded, color: context.primary, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Text('What is Irshad?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Irshad is Nigeria\'s first automated Shariah compliance screening platform for the stock market. It helps Muslim investors determine whether NSE-listed companies meet the requirements for halal investing under the globally recognised AAOIFI standard.',
                style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.6),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: [
                  _buildFeatureBadge('Screen any NGX stock'),
                  _buildFeatureBadge('Track portfolio compliance'),
                  _buildFeatureBadge('Calculate Zakat automatically'),
                  _buildFeatureBadge('Monitor compliance changes'),
                ],
              ),
            ],
          ),
        ),

        // What is AAOIFI
        Container(
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border.all(color: context.divider),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lightbulb_rounded, size: 18, color: context.questionable),
                  const SizedBox(width: 8),
                  Text('What is AAOIFI Screening?', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) is the leading international standard-setter for Islamic finance. Their Shariah Standard No. 21 defines two tests every stock must pass: a business activity purity test and a financial ratio test. Irshad applies these automatically to all NGX-listed companies.',
                style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6),
              ),
            ],
          ),
        ),

        // Steps
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border.all(color: context.divider),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('How Screening Works', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark)),
              const SizedBox(height: 24),
              _buildStep('1', 'Direct Regulatory Ingestion', 'Irshad pulls official quarterly and audited annual financial statements directly from NGX Pulse, company disclosures, and verified exchange filings.'),
              _buildStep('2', 'Business Activity Screen (Rule 3/4/1)', 'Algorithmic review of revenue by business segments to verify exclusion from conventional banking, alcohol, gambling, adult entertainment, tobacco, and arms.'),
              _buildStep('3', 'Quantitative Ratio Computation', 'Rigorous calculation of the 3 AAOIFI Standard 21 thresholds: Interest Debt ≤ 30% Market Cap, Cash & Securities ≤ 30% Market Cap, and Impure Revenue ≤ 5% Total Revenue.'),
              _buildStep('4', 'Purification Rate Extraction', 'Calculates the exact purification percentage (Impure Income ÷ Total Income) required to cleanse dividend distributions.'),
              _buildStep('5', 'Live Verdict & Audit Trail', 'Assignments of Halal, Non-Compliant, or Doubtful with full line-item math and linkable source filing evidence.'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeatureBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.divider),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_rounded, size: 14, color: context.halal),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.textDark)),
        ],
      ),
    );
  }

  Widget _buildStep(String number, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: context.primary,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: context.primary.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Center(child: Text(number, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                const SizedBox(height: 4),
                Text(desc, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // 2. METHODOLOGY (AAOIFI)
  // ---------------------------------------------------------
  Widget _buildMethodology() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.verified_user_rounded, 'AAOIFI Shariah Standard No. 21 Methodology'),
        
        Container(
          padding: const EdgeInsets.all(24),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border.all(color: context.divider),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.balance_rounded, size: 20, color: context.primary),
                  const SizedBox(width: 8),
                  Text('The 4 Juristic Pillars (Appendix B)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: context.textDark)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Islamic scholars established the permissibility of investing in modern corporations with incidental interest contact based on four foundational classical legal maxims:',
                style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6),
              ),
              const SizedBox(height: 20),
              _buildPillarBox('1. Removal of Hardship (Al-Mashaqqah Tajlib At-Taysir)', 'Requiring 0.00% contact with conventional interest would lock the Muslim Ummah out of global capital markets.'),
              _buildPillarBox('2. Majority-Halal Wealth (Ghalabat al-Halal)', 'When 95%+ of revenue is generated through lawful trade, the company\'s wealth is predominantly halal.'),
              _buildPillarBox('3. Separation of Bargains (Tafriq al-Safqah)', 'The permissible operating equity remains valid, while the subordinate non-compliant income stream is isolated and purified.'),
              _buildPillarBox('4. Subordinate Follows Primary (At-Tabi\' Tabi\')', 'Incidental cash deposits and operating receivables are subordinate to the primary lawful commercial activity.'),
            ],
          ),
        ),

        // Thresholds
        Container(
          padding: const EdgeInsets.all(24),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border.all(color: context.divider),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Two-Stage Screening Architecture', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: context.textDark)),
              const SizedBox(height: 16),
              _buildThresholdBox('Stage 1: Business Activity (Rule 3/4/1)', '0% Tolerance for Core Prohibited Activities', 'Core revenue must NOT be derived from Conventional Banking/Insurance, Alcohol, Pork, Gambling, Adult Media, Tobacco, or Arms.', 'Strict Qualitative Filter', context.haram),
              _buildThresholdBox('Stage 2A: Debt Ratio (Rule 3/4/2)', '≤ 30.00%', 'Total Interest-Bearing Debt ÷ Market Capitalization', 'Financial Ratio', context.primary),
              _buildThresholdBox('Stage 2B: Cash & Securities (Rule 3/4/3)', '≤ 30.00%', '(Cash & Equivalents + Interest-Bearing Securities) ÷ Market Capitalization', 'Financial Ratio', context.primary),
              _buildThresholdBox('Stage 2C: Impermissible Income (Rule 3/4/4)', '≤ 5.00%', '(Interest Income + Minor Prohibited Revenue) ÷ Total Revenue', 'Purification Trigger', context.questionable),
            ],
          ),
        ),

        // Prohibited
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [context.haram.withValues(alpha: 0.1), Colors.transparent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: context.haram.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.warning_rounded, size: 18, color: context.haram),
                  const SizedBox(width: 8),
                  Text('Prohibited Trading Practices', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                ],
              ),
              const SizedBox(height: 12),
              RichText(
                text: TextSpan(
                  style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6),
                  children: const [
                    TextSpan(text: 'Under AAOIFI Standard 21, Shariah compliance extends to how equities are traded. '),
                    TextSpan(text: 'Conventional Short Selling', style: TextStyle(fontWeight: FontWeight.bold)),
                    TextSpan(text: ' (selling shares you do not own), '),
                    TextSpan(text: 'Options / Financial Derivatives', style: TextStyle(fontWeight: FontWeight.bold)),
                    TextSpan(text: ' (due to Gharar / speculation), and '),
                    TextSpan(text: 'Margin Trading', style: TextStyle(fontWeight: FontWeight.bold)),
                    TextSpan(text: ' (borrowing on interest) are strictly impermissible. Irshad only evaluates spot cash equity ownership.'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPillarBox(String title, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark)),
          const SizedBox(height: 6),
          Text(desc, style: TextStyle(fontSize: 12, color: context.textMuted, height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildThresholdBox(String rule, String threshold, String formula, String badge, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(rule, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.textDark)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: context.bg,
                  border: Border.all(color: context.divider),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(threshold, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: context.bg,
              border: Border.all(color: context.divider),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(badge, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.textMuted)),
          ),
          const SizedBox(height: 8),
          Text(formula, style: TextStyle(fontSize: 12, color: context.textMuted)),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // 3. NAVIGATION GUIDE
  // ---------------------------------------------------------
  Widget _buildNavigation() {
    final navItems = [
      {'icon': Icons.business_center_rounded, 'title': 'Portfolio', 'desc': 'View your holdings and their Shariah compliance status, track portfolio performance and allocation.', 'color': context.primary},
      {'icon': Icons.bar_chart_rounded, 'title': 'Market Screener', 'desc': 'Check the Shariah compliance of all Nigerian stocks. View AAOIFI ratios and detailed screening reports.', 'color': Colors.deepPurple},
      {'icon': Icons.star_rounded, 'title': 'Alert (Watchlist)', 'desc': 'Monitor companies you are interested in. Set price alerts and receive notifications on status changes.', 'color': context.questionable},
      {'icon': Icons.insert_drive_file_rounded, 'title': 'Statement', 'desc': 'View a detailed financial statement of your portfolio activity and holdings over time.', 'color': Colors.lightBlue},
      {'icon': Icons.calculate_rounded, 'title': 'Zakat', 'desc': 'Automatically calculate your Zakat obligation based on your current portfolio holdings.', 'color': context.questionable},
      {'icon': Icons.verified_user_rounded, 'title': 'Purification', 'desc': 'Calculate and track income purification amounts for any Non-Compliant revenue earned.', 'color': context.halal},
      {'icon': Icons.menu_book_rounded, 'title': 'Resources', 'desc': 'Access Islamic finance educational content, lectures, and scholarship resources.', 'color': Colors.pink},
      {'icon': Icons.notifications_rounded, 'title': 'Updates', 'desc': 'Stay informed with compliance changes, business activity updates, and market intelligence.', 'color': context.review},
      {'icon': Icons.settings_rounded, 'title': 'Settings', 'desc': 'Manage notifications, account preferences, and personalise your Irshad experience.', 'color': Colors.grey},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.explore_rounded, 'Navigation Guide'),
        Text('Here is a quick explanation of each section in Irshad.', style: TextStyle(fontSize: 14, color: context.textMuted)),
        const SizedBox(height: 20),
        ...navItems.map((item) => _buildNavCard(item['icon'] as IconData, item['title'] as String, item['desc'] as String, item['color'] as Color)),
      ],
    );
  }

  Widget _buildNavCard(IconData icon, String title, String desc, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.divider),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark)),
                const SizedBox(height: 4),
                Text(desc, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // 4. FAQs
  // ---------------------------------------------------------
  Widget _buildFaq() {
    final faqs = [
      {'q': 'How is a stock screened for Shariah compliance?', 'a': 'Irshad implements AAOIFI (Accounting and Auditing Organisation for Islamic Financial Institutions) Shariah Standard No. 21. Screening involves two distinct stages: (1) Business Activity Screen (Rule 3/4/1) — the company must not operate in prohibited sectors like conventional banking, alcohol, pork, gambling, adult media, tobacco, or weapons. (2) Quantitative Financial Ratios — interest-bearing debt must be ≤ 30% of Market Cap, cash & interest-bearing securities must be ≤ 30% of Market Cap, and impermissible/interest income must be ≤ 5% of total revenue.'},
      {'q': 'Why is it permissible to invest in companies with minor interest or debt?', 'a': 'Under AAOIFI Standard No. 21 (Appendix B), senior Islamic scholars established that investing in mixed companies is permissible based on classical jurisprudence: (1) Removal of Hardship (Al-Mashaqqah Tajlib At-Taysir) — requiring zero contact with interest would lock Muslims out of equity markets. (2) Majority-Halal Wealth (Ghalabat al-Halal) — when 95%+ of revenue is lawful, the company is predominantly halal. (3) Separation of Bargains (Tafriq al-Safqah) — the lawful operating equity stands valid, while the impermissible fraction is isolated and purified.'},
      {'q': 'What does "Near Limit" (Dashed Badge) mean?', 'a': 'When a company\'s debt or cash ratio is approaching the 30% ceiling (e.g. 26% to 29.9%), Irshad applies a "Near Limit" proximity warning with a dashed border. The stock is currently compliant, but market price drops or next quarter\'s borrowings could cause it to exceed the threshold.'},
      {'q': 'What does "Purification Required" mean and how is it calculated?', 'a': 'If a compliant company earns up to 5% non-permissible income (such as treasury interest on bank deposits), investors must cleanse their dividend earnings. The purification percentage = (Impermissible Income ÷ Total Revenue). For example, if a stock has a 2.00% purification rate and you receive ₦100,000 in dividends, you must donate ₦2,000 to charity without expecting spiritual reward (thawab).'},
      {'q': 'Why does AAOIFI use Market Capitalisation instead of Total Assets?', 'a': 'AAOIFI Standard 21 specifies Market Capitalisation (or the 12/36-month average market cap) as the denominator because it represents the actual enterprise market valuation of the company\'s equity, avoiding book-value distortions from historical depreciation.'},
      {'q': 'Does Irshad allow Short Selling, Options, or Margin Trading?', 'a': 'No. AAOIFI Standard No. 21 strictly prohibits conventional short selling (selling shares one does not own — Bay\' ma la Yamlik), options & derivatives contracts (due to Gharar/excessive uncertainty), and margin loans (interest-based leverage). Irshad exclusively screens spot cash equity ownership.'},
      {'q': 'How often are compliance determinations updated?', 'a': 'Screenings are updated automatically whenever quarterly (10-Q equivalent) and annual (10-K equivalent) financial statements are published to the NGX and NGX Pulse. Additionally, corporate announcements are parsed daily for major business activity or restructuring changes.'},
      {'q': 'Is Irshad certified by AAOIFI or a registered financial advisor?', 'a': 'Irshad is an independent financial technology platform. We implement a rigorous, auditable computational interpretation of AAOIFI Shariah Standard No. 21 using verified public filings. Irshad is not affiliated with or certified by AAOIFI and does not provide bespoke financial advice.'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.help_outline_rounded, 'Frequently Asked Questions'),
        ...faqs.map((faq) => _FaqItem(question: faq['q']!, answer: faq['a']!)),
      ],
    );
  }

  // ---------------------------------------------------------
  // 5. TUTORIALS
  // ---------------------------------------------------------
  Widget _buildTutorials() {
    final tutorials = [
      {'icon': Icons.menu_book_rounded, 'title': 'AAOIFI Standard 21 Breakdown', 'desc': 'The 4 juristic pillars & 3 quantitative screening ratios', 'type': 'Guide'},
      {'icon': Icons.verified_user_rounded, 'title': 'How to Purify Dividend Income', 'desc': 'Step-by-step calculation & charitable disbursement guide', 'type': 'Guide'},
      {'icon': Icons.insert_drive_file_rounded, 'title': 'How to Read a Screening Report', 'desc': 'Understanding filing sources, headroom, and debt math', 'type': 'Guide'},
      {'icon': Icons.calculate_rounded, 'title': 'Calculating Portfolio Zakat', 'desc': 'How Irshad computes your annual equity Zakat obligation', 'type': 'Guide'},
      {'icon': Icons.play_circle_outline_rounded, 'title': 'Getting Started with Irshad', 'desc': '3-minute walkthrough of the Nigerian stock screener', 'type': 'Video'},
      {'icon': Icons.play_circle_outline_rounded, 'title': 'Setting Up Your Watchlist & Alerts', 'desc': 'Monitor compliance shifts across NGX tickers in real time', 'type': 'Video'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.play_circle_outline_rounded, 'Tutorials & Guides'),
        
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: context.questionable.withValues(alpha: 0.1),
            border: Border.all(color: context.questionable.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(Icons.warning_rounded, color: context.questionable, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Video tutorials are coming soon. Written guides are available now.', style: TextStyle(fontSize: 13, color: context.textMuted)),
              ),
            ],
          ),
        ),

        ...tutorials.map((t) => _buildTutorialCard(t['icon'] as IconData, t['title'] as String, t['desc'] as String, t['type'] as String)),
      ],
    );
  }

  Widget _buildTutorialCard(IconData icon, String title, String desc, String type) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.divider),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: context.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark)),
                const SizedBox(height: 4),
                Text(desc, style: TextStyle(fontSize: 12, color: context.textMuted)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(type, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.primary)),
                const SizedBox(width: 4),
                Icon(Icons.chevron_right_rounded, size: 14, color: context.primary),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // 6. SUPPORT
  // ---------------------------------------------------------
  Widget _buildSupport() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.support_agent_rounded, 'Contact Support'),
        Text('We\'re here to help. Choose how you\'d like to reach us.', style: TextStyle(fontSize: 14, color: context.textMuted)),
        const SizedBox(height: 24),
        
        _buildSupportCard(Icons.warning_rounded, 'Report an Issue', 'Found a bug or incorrect compliance data? Let us know immediately.', 'Report Issue', context.haram, 'mailto:support@irshad.app?subject=Bug Report'),
        _buildSupportCard(Icons.lightbulb_rounded, 'Suggest a Feature', 'Have an idea that would make Irshad better for Muslim investors?', 'Submit Suggestion', context.questionable, 'mailto:support@irshad.app?subject=Feature Suggestion'),
        _buildSupportCard(Icons.mail_rounded, 'Contact Support', 'For general inquiries, account help, or any other questions.', 'Email Support', context.primary, 'mailto:support@irshad.app'),
      ],
    );
  }

  Widget _buildSupportCard(IconData icon, String title, String desc, String btnLabel, Color color, String url) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.divider),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark)),
          const SizedBox(height: 8),
          Text(desc, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.5)),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                final uri = Uri.parse(url);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri);
                }
              },
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: color),
                backgroundColor: color.withValues(alpha: 0.05),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(btnLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: color)),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // SHARED
  // ---------------------------------------------------------
  Widget _buildSectionHeader(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: context.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
        ],
      ),
    );
  }
}

class _FaqItem extends StatefulWidget {
  final String question;
  final String answer;

  const _FaqItem({required this.question, required this.answer});

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border.all(color: context.divider),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(widget.question, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textDark, height: 1.4)),
          iconColor: Colors.white,
          collapsedIconColor: context.textMuted,
          trailing: Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color: _expanded ? context.primary : context.bgAlt,
              shape: BoxShape.circle,
            ),
            child: Icon(
              _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
              size: 18,
            ),
          ),
          onExpansionChanged: (val) => setState(() => _expanded = val),
          childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
          children: [
            const Divider(),
            const SizedBox(height: 8),
            Text(widget.answer, style: TextStyle(fontSize: 13, color: context.textMuted, height: 1.6)),
          ],
        ),
      ),
    );
  }
}
