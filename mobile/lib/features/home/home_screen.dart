import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/app_state_provider.dart';
import '../portfolio/providers/portfolio_provider.dart';
import '../stocks/ui/stock_screener_screen.dart';
import '../baskets/ui/baskets_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load profile if authenticated
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = Provider.of<AppStateProvider>(context, listen: false);
      if (appState.isAuthenticated && appState.userProfile == null) {
        appState.loadProfile();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: context.bg,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _buildTopDashboard(context),
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
                  labelColor: Colors.white,
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
              const SizedBox(height: 16),
              Expanded(
                child: TabBarView(
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopDashboard(BuildContext context) {
    return Consumer2<AppStateProvider, PortfolioProvider>(
      builder: (context, appState, portfolio, child) {
        final userName = appState.userProfile?['first_name'] ?? 'Investor';
        final isGuest = portfolio.isGuest || !appState.isAuthenticated;
        
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                context.primary,
                Color.lerp(context.primary, Colors.black, 0.3) ?? context.primary,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: context.primary.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isGuest ? 'Welcome to irshad' : 'Good Morning, $userName',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isGuest ? 'Start Halal Investing' : 'Your Portfolio',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/settings'),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.settings_outlined, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
              if (!isGuest) ...[
                const SizedBox(height: 24),
                Text(
                  '₦ ${portfolio.summary['total_balance'].toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.trending_up_rounded, color: context.halal, size: 14),
                          const SizedBox(width: 4),
                          const Text(
                            '+0.00%', // Mock daily return
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle_rounded, color: context.halal, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${portfolio.summary['health_percentage']}% Halal',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
              if (isGuest) ...[
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: context.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    elevation: 0,
                  ),
                  child: const Text('Sign In or Register', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildComingSoonState(BuildContext context, IconData icon, String title, String description) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(left: 40.0, right: 40.0, bottom: 100.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(40),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: context.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: context.primary.withValues(alpha: 0.2), width: 1.5),
                  ),
                  child: Icon(icon, size: 48, color: context.primary),
                ),
              ),
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

