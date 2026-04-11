import 'package:flutter/material.dart';
import 'features/auth/ui/login_screen.dart';
import 'features/auth/ui/register_screen.dart';
import 'features/auth/ui/profile_screen.dart';
import 'features/auth/ui/edit_profile_screen.dart';
import 'features/auth/ui/upgrade_screen.dart';
import 'features/home/home_screen.dart';
import 'features/profile/ui/settings_screen.dart';
import 'features/profile/ui/notifications_screen.dart';
import 'features/scanner/ui/search_screen.dart';
import 'features/scanner/ui/product_details_screen.dart';
import 'features/scanner/ui/user_submission_screen.dart';
import 'features/stocks/ui/stock_search_screen.dart';
import 'features/stocks/ui/stock_detail_screen.dart';
import 'features/onboarding/ui/onboarding_screen.dart';
import 'features/profile/ui/favorites_screen.dart';
import 'features/profile/ui/history_screen.dart';
import 'features/brokerage/ui/brokerage_link_screen.dart';


void main() {
  runApp(const IrshadApp());
}

class IrshadApp extends StatelessWidget {
  const IrshadApp({super.key});

  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IRSHAD',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: 'Inter',
        scaffoldBackgroundColor: bgColor,
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: Color(0xFF111827),
        ),
        colorScheme: const ColorScheme.light(
          primary: primaryGreen,
          secondary: Color(0xFFD97706),
          surface: Colors.white,
          onSurface: Color(0xFF111827),
          background: bgColor,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          selectedItemColor: primaryGreen,
          unselectedItemColor: Color(0xFF9CA3AF),
          elevation: 8,
          selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
          unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
        ),
      ),
      // App starts at the onboarding screen for new users
      initialRoute: '/onboarding',
      onGenerateRoute: (settings) {
        if (settings.name == '/product_details') {
          final product = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(builder: (context) => ProductDetailsScreen(product: product));
        }
        if (settings.name == '/stock_details') {
          final stock = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(builder: (context) => StockDetailScreen(stock: stock));
        }
        if (settings.name == '/submit_product') {
          final barcode = settings.arguments as String?;
          return MaterialPageRoute(builder: (context) => UserSubmissionScreen(initialBarcode: barcode));
        }
        return null;
      },
      routes: {
        '/onboarding': (context) => const OnboardingScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/upgrade': (context) => const UpgradeScreen(),
        '/main': (context) => const MainNavigationScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/edit_profile': (context) => const EditProfileScreen(),
        '/favorites': (context) => const FavoritesScreen(),
        '/history': (context) => const HistoryScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/submit_product': (context) => const UserSubmissionScreen(),
        '/brokerage/link': (context) => const BrokerageLinkScreen(),
      },
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),        // Explore
    const StockSearchScreen(), // Search
    const FavoritesScreen(),   // Watchlist
    const ProfileScreen(),     // Portfolio
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: const Color(0xFFE5E7EB), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore_rounded),
              label: 'Explore',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search_rounded),
              activeIcon: Icon(Icons.search_rounded),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.favorite_outline_rounded),
              activeIcon: Icon(Icons.favorite_rounded),
              label: 'Watchlist',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.pie_chart_outline_rounded),
              activeIcon: Icon(Icons.pie_chart_rounded),
              label: 'Portfolio',
            ),
          ],
        ),
      ),
    );
  }
}
