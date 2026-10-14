

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import 'tabs/update_tab.dart';
import 'tabs/portfolio_overview_tab.dart';
import 'tabs/purification_tab.dart';
import 'tabs/updates/updates_inbox_tab.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/portfolio_provider.dart';
import 'zakat_calculator_screen.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> with WidgetsBindingObserver, TickerProviderStateMixin {
  late TabController _tabController;
  int _currentIndex = 0;
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
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging || _tabController.index != _currentIndex) {
        setState(() => _currentIndex = _tabController.index);
      }
    });
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortfolioProvider>().fetchPortfolio();
      _fetchUnreadCounts();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
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
    return Scaffold(
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
                    builder: (context) => StatefulBuilder(
                      builder: (context, setModalState) {
                        return ScaffoldMessenger(
                          child: Scaffold(
                            backgroundColor: Colors.transparent,
                            body: Stack(
                              children: [
                                Positioned.fill(
                                  child: GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => Navigator.pop(context),
                                  ),
                                ),
                                Align(
                                  alignment: Alignment.bottomCenter,
                                  child: Container(
                                    height: MediaQuery.of(context).size.height * 0.9,
                                    decoration: BoxDecoration(
                                      color: context.bg,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                                    ),
                                    child: Column(
                                      children: [
                                        // 1. Drag handle
                                        Container(
                                          padding: const EdgeInsets.only(top: 12, bottom: 8),
                                          child: Center(
                                            child: Container(
                                              width: 38,
                                              height: 4.5,
                                              decoration: BoxDecoration(
                                                color: context.textMuted.withValues(alpha: 0.25),
                                                borderRadius: BorderRadius.circular(3),
                                              ),
                                            ),
                                          ),
                                        ),
                                        // 2. Header Bar
                                        Padding(
                                          padding: const EdgeInsets.fromLTRB(20, 4, 12, 12),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.all(8),
                                                    decoration: BoxDecoration(
                                                      color: context.primary.withValues(alpha: 0.1),
                                                      borderRadius: BorderRadius.circular(12),
                                                    ),
                                                    child: Icon(Icons.notifications_rounded, color: context.primary, size: 20),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Text(
                                                    'Notifications',
                                                    style: TextStyle(
                                                      fontSize: 20,
                                                      fontWeight: FontWeight.w900,
                                                      color: context.textDark,
                                                      letterSpacing: -0.4,
                                                    ),
                                                  ),
                                                  if (_unreadInbox > 0) ...[
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                      decoration: BoxDecoration(
                                                        color: context.primary.withValues(alpha: 0.12),
                                                        borderRadius: BorderRadius.circular(12),
                                                      ),
                                                      child: Text(
                                                        '$_unreadInbox new',
                                                        style: TextStyle(
                                                          color: context.primary,
                                                          fontWeight: FontWeight.w800,
                                                          fontSize: 11,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              Row(
                                                children: [
                                                  IconButton(
                                                    tooltip: 'Alert Settings',
                                                    icon: Icon(Icons.tune_rounded, color: context.textDark, size: 20),
                                                    onPressed: () {
                                                      Navigator.pop(context);
                                                      Navigator.pushNamed(context, '/alerts');
                                                    },
                                                  ),
                                                  IconButton(
                                                    tooltip: 'Close',
                                                    icon: Icon(Icons.close_rounded, color: context.textMuted, size: 22),
                                                    onPressed: () => Navigator.pop(context),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        Divider(height: 1, color: context.appColors.divider.withValues(alpha: 0.7)),
                                        // 3. Notifications content
                                        Expanded(
                                          child: SingleChildScrollView(
                                            child: UpdatesInboxTab(
                                              onUnreadCountChanged: (count) {
                                                if (mounted) {
                                                  setState(() => _unreadInbox = count);
                                                  setModalState(() {});
                                                }
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ).then((_) {
                    if (mounted) _fetchUnreadCounts();
                  });
                },
              ),
            ),
          ],
          elevation: 0,
          bottom: TabBar(
            controller: _tabController,
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
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: const [
            UpdateTab(),
            PortfolioOverviewTab(),
            PurificationTab(),
            ZakatCalculatorScreen(isTab: true),
          ],
        ),
    );
  }
}
