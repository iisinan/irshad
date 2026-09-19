import '../../../core/utils/suggest_modal_util.dart';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import 'tabs/update_tab.dart';
import 'tabs/portfolio_overview_tab.dart';
import 'tabs/purification_tab.dart';
import 'tabs/resources_tab.dart'; 
import 'tabs/guide_tab.dart';
import 'tabs/updates/updates_inbox_tab.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/portfolio_provider.dart';
import 'zakat_calculator_screen.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> with WidgetsBindingObserver {
  int _unreadInbox = 0;
  Future<void> _fetchUnreadCounts() async {
    try {
      final response = await ApiService().get('notifications/unread-count');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _unreadInbox = response.data['data']?['count'] ?? response.data['count'] ?? 0;
          });
        }
      }
    } catch (_) {}
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortfolioProvider>().fetchPortfolio();
      _fetchUnreadCounts();
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
      _fetchUnreadCounts();
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
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: IconButton(
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(Icons.mail_outline_rounded, color: context.textDark),
                    if (_unreadInbox > 0)
                      Positioned(
                        right: -2,
                        top: -2,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            _unreadInbox > 9 ? '9+' : _unreadInbox.toString(),
                            style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => Container(
                      height: MediaQuery.of(context).size.height * 0.9,
                      decoration: BoxDecoration(
                        color: context.bg,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Center(
                              child: Container(
                                width: 40,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: context.textMuted.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ),
                          ),
                          Expanded(child: const UpdatesInboxTab()),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
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
        floatingActionButton: Padding(
          padding: const EdgeInsets.only(bottom: 88.0),
          child: FloatingActionButton.extended(
            onPressed: () => SuggestModalUtil.show(context),
            backgroundColor: context.primary,
            elevation: 4,
            icon: const Icon(Icons.mail_outline_rounded, color: Colors.white, size: 20),
            label: const Text('Suggest for Irshad', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }
}
