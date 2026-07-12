import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
final List<Map<String, String>> _onboardingData = [
    {
      'title': 'Stock Screening',
      'subtitle': 'We analyze hundreds of companies. Easily spot fully compliant, questionable, and haram investments.',
      'image': 'assets/onboarding_search.png',
      'icon': 'search',
    },
    {
      'title': 'Thematic Baskets',
      'subtitle': 'Explore curated collections of halal Nigerian stocks like "Market Blue Chips" or "Halal Agriculture".',
      'image': 'assets/onboarding_baskets.png',
      'icon': 'widgets',
    },
    {
      'title': 'Watch & Alert',
      'subtitle': 'Track your favorite Nigerian companies and get real-time price alerts on your device.',
      'image': 'assets/onboarding_alerts.png',
      'icon': 'notifications_active',
    },
    {
      'title': 'Local Broker Linking',
      'subtitle': 'Connect your Nigerian brokerage accounts and monitor your portfolio compliance easily.',
      'image': 'assets/onboarding_invest.png',
      'icon': 'account_balance',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () async {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setBool('hasSeenOnboarding', true);
                  if (mounted) Navigator.pushReplacementNamed(context, '/main');
                },
                child: const Text('Skip', style: TextStyle(color: AppTheme.textMuted)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _onboardingData.length,
                itemBuilder: (context, index) => _buildPage(index),
              ),
            ),
            _buildBottomControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(int index) {
    final data = _onboardingData[index];
    final iconData = {
      'search': Icons.search_rounded,
      'widgets': Icons.widgets_rounded,
      'notifications_active': Icons.notifications_active_rounded,
      'account_balance': Icons.account_balance_rounded,
    }[data['icon']]!;

    return Padding(
      padding: const EdgeInsets.all(40.0),
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(iconData, size: 80, color: AppTheme.primary),
            ),
            const SizedBox(height: 60),
            Text(
              data['title']!,
              style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppTheme.textDark,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            data['subtitle']!,
            style: const TextStyle(
              fontSize: 16,
              color: AppTheme.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Padding(
      padding: const EdgeInsets.all(40.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _onboardingData.length,
              (index) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentPage == index ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentPage == index ? AppTheme.primary : AppTheme.divider,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () async {
                if (_currentPage < _onboardingData.length - 1) {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                } else {
                  // Mark onboarding as seen so it is never shown again
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setBool('hasSeenOnboarding', true);
                  if (mounted) Navigator.pushReplacementNamed(context, '/main');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.textDark,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: Text(
                _currentPage < _onboardingData.length - 1 ? 'Next' : 'Get Started',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
