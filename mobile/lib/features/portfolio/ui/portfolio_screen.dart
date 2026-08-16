import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import 'tabs/update_tab.dart';
import 'tabs/portfolio_overview_tab.dart';
import 'tabs/purification_tab.dart';
import 'tabs/resources_tab.dart'; 
import 'tabs/guide_tab.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/portfolio_provider.dart';
import 'zakat_calculator_screen.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortfolioProvider>().fetchPortfolio();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      context.read<PortfolioProvider>().fetchPortfolio();
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 6,
      child: Scaffold(
        backgroundColor: context.bg,
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text('Portfolio', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
          backgroundColor: context.bg,
          elevation: 0,
          bottom: TabBar(
            isScrollable: true,
            labelColor: Colors.white,
            unselectedLabelColor: context.textMuted,
            indicator: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: context.primary,
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            labelPadding: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            labelStyle: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabAlignment: TabAlignment.start,
            dividerColor: Colors.transparent,
            splashBorderRadius: BorderRadius.circular(20),
            tabs: [
              Tab(text: 'Update'),
              Tab(text: 'Holdings'),
              Tab(text: 'Purification'),
              Tab(text: 'Zakat'),
              Tab(text: 'Resources'),
              Tab(text: 'Guide'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            UpdateTab(),
            PortfolioOverviewTab(),
            PurificationTab(),
            ZakatCalculatorScreen(isTab: true),
            ResourcesTab(),
            GuideTab(),
          ],
        ),
      ),
    );
  }
}
