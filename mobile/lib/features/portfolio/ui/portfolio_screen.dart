import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import 'tabs/portfolio_overview_tab.dart';
import 'tabs/purification_tab.dart';
import 'tabs/shariah_tab.dart';
import 'tabs/news_tab.dart';
import 'zakat_calculator_screen.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> {
@override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        backgroundColor: AppTheme.bg,
        appBar: AppBar(
          title: const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
          backgroundColor: AppTheme.bg,
          elevation: 0,
          bottom: const TabBar(
            isScrollable: true,
            labelColor: AppTheme.textDark,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorColor: AppTheme.primary,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
            tabAlignment: TabAlignment.start,
            dividerColor: Colors.transparent,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Zakat'),
              Tab(text: 'Purification'),
              Tab(text: 'Shariah'),
              Tab(text: 'News'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            PortfolioOverviewTab(),
            // Ensure ZakatCalculatorScreen can fit in a Tab (it has its own Scaffold, but that's fine)
            ZakatCalculatorScreen(isTab: true),
            PurificationTab(),
            ShariahTab(),
            NewsTab(),
          ],
        ),
      ),
    );
  }
}
