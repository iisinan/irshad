import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import 'tabs/portfolio_overview_tab.dart';
import 'tabs/purification_tab.dart';
import 'tabs/shariah_tab.dart';
import 'tabs/resources_tab.dart'; 
import 'tabs/updates_tab.dart'; // Added
import 'tabs/guide_tab.dart'; // Added
import 'zakat_calculator_screen.dart';
import '../../stocks/ui/ngx_market_screen.dart';
import '../../profile/ui/favorites_screen.dart';
import '../../profile/ui/history_screen.dart';
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
      length: 10, // Changed to 10
      child: Scaffold(
        backgroundColor: context.bg,
        appBar: AppBar(
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
              Tab(text: 'Overview'),
              Tab(text: 'Updates'), // Added
              Tab(text: 'Market'),
              Tab(text: 'Watchlist'),
              Tab(text: 'Activity'),
              Tab(text: 'Zakat'),
              Tab(text: 'Purification'),
              Tab(text: 'Shariah'),
              Tab(text: 'Resources'),
              Tab(text: 'Guide'), // Added
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            PortfolioOverviewTab(),
            UpdatesTab(), // Added
            NgxMarketScreen(isTab: true),
            FavoritesScreen(isTab: true),
            HistoryScreen(isTab: true),
            ZakatCalculatorScreen(isTab: true),
            PurificationTab(),
            ShariahTab(),
            ResourcesTab(),
            GuideTab(), // Added
          ],
        ),
      ),
    );
  }
}
