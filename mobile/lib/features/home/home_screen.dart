import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../stocks/ui/stock_screener_screen.dart';

import '../baskets/ui/baskets_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: context.bg,
        appBar: AppBar(
          backgroundColor: context.bg,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.settings_outlined, color: context.textMuted),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          centerTitle: true,
          title: Text(
            'irshad',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: context.textDark,
              letterSpacing: -1,
            ),
          ),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Explore',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w400,
                      color: context.textDark,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: context.bgAlt,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: TabBar(
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    indicator: BoxDecoration(
                      color: context.primary,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: context.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    labelColor: Colors.black, // High contrast on primary
                    unselectedLabelColor: context.textMuted,
                    labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    unselectedLabelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    tabs: const [
                      Tab(text: 'Stocks'),
                      Tab(text: 'Funds'),
                      Tab(text: 'Baskets'),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
        body: TabBarView(
          children: [
            StockScreenerScreen(),
            _buildComingSoonState(
              context, 
              Icons.trending_up_rounded, 
              'Halal Mutual Funds', 
              'We are partnering with leading asset managers to bring you curated, shariah-compliant mutual funds. Stay tuned!'
            ),
            const BasketsScreen(),
          ],
        ),
      ),
    );
  }

  Widget _buildComingSoonState(BuildContext context, IconData icon, String title, String description) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(left: 40.0, right: 40.0, bottom: 100.0), // Padding to account for nav pill
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(fontSize: 22, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 15),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: context.textDark,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'COMING SOON',
                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
