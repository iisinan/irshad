import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'core/api/api_service.dart';
import 'features/auth/ui/login_screen.dart';
import 'features/auth/ui/register_screen.dart';
import 'features/auth/ui/welcome_screen.dart';
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
import 'features/stocks/ui/basket_detail_screen.dart';
import 'features/onboarding/ui/onboarding_screen.dart';
import 'features/profile/ui/favorites_screen.dart';
import 'features/profile/ui/history_screen.dart';
import 'features/brokerage/ui/brokerage_link_screen.dart';
import 'features/portfolio/ui/portfolio_screen.dart';
import 'features/portfolio/ui/zakat_calculator_screen.dart';

import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/notifications/notification_service.dart';
import 'features/stocks/providers/stock_provider.dart';
import 'core/providers/app_state_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  try {
    await Firebase.initializeApp();
    await PushNotificationService().initialize();
  } catch (e) {
    debugPrint("Firebase init failed (missing google-services.json?): $e");
  }

  await Hive.initFlutter();

  final prefs = await SharedPreferences.getInstance();
  final hasSeenOnboarding = prefs.getBool('hasSeenOnboarding') ?? false;

  // Always go straight to /main after onboarding — guest mode, no forced login
  final String startRoute = hasSeenOnboarding ? '/main' : '/onboarding';

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => StockProvider()),
        ChangeNotifierProvider(create: (_) => AppStateProvider()),
      ],
      child: IrshadApp(initialRoute: startRoute),
    ),
  );
}

class IrshadApp extends StatelessWidget {
  final String initialRoute;
  const IrshadApp({super.key, this.initialRoute = '/onboarding'});

  static const Color bgColor = Color(0xFFF5F0E8); // Cream
  static const Color primaryGold = Color(0xFFC9A84C); // Gold
  static const Color darkSlate = Color(0xFF1A1208); // Dark Slate

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IRSHAD',
      debugShowCheckedModeBanner: false,
      navigatorKey: ApiService.navigatorKey,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: 'Inter',
        scaffoldBackgroundColor: bgColor,
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: darkSlate,
        ),
        colorScheme: const ColorScheme.light(
          primary: primaryGold,
          secondary: Color(0xFFE8C96A),
          surface: Colors.white,
          onSurface: darkSlate,
          background: bgColor,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: darkSlate,
          selectedItemColor: primaryGold,
          unselectedItemColor: Color(0xFF9A8C70),
          elevation: 16,
          selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
          unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
        ),
      ),
      initialRoute: initialRoute,
      onGenerateRoute: (settings) {
        if (settings.name == '/product_details') {
          final product = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(builder: (context) => ProductDetailsScreen(product: product));
        }
        if (settings.name == '/stock_details') {
          final stock = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(builder: (context) => StockDetailScreen(stock: stock));
        }
        if (settings.name == '/basket_details') {
          final basket = settings.arguments;
          return MaterialPageRoute(builder: (context) => BasketDetailScreen(basket: basket));
        }
        if (settings.name == '/submit_product') {
          final barcode = settings.arguments as String?;
          return MaterialPageRoute(builder: (context) => UserSubmissionScreen(initialBarcode: barcode));
        }
        return null;
      },
      routes: {
        '/onboarding':       (context) => const OnboardingScreen(),
        '/welcome':          (context) => const WelcomeScreen(),
        '/login':            (context) => const LoginScreen(),
        '/register':         (context) => const RegisterScreen(),
        '/upgrade':          (context) => const UpgradeScreen(),
        '/main':             (context) => const MainNavigationScreen(),
        '/profile':          (context) => const ProfileScreen(),
        '/edit_profile':     (context) => const EditProfileScreen(),
        '/favorites':        (context) => const FavoritesScreen(),
        '/history':          (context) => const HistoryScreen(),
        '/notifications':    (context) => const NotificationsScreen(),
        '/settings':         (context) => const SettingsScreen(),
        '/submit_product':   (context) => const UserSubmissionScreen(),
        '/brokerage/link':   (context) => const BrokerageLinkScreen(),
        '/zakat_calculator': (context) => const ZakatCalculatorScreen(),
      },
    );
  }
}

// ─── Tab indices ──────────────────────────────────────────────────────────────
// 0 = Explore   (public)
// 1 = Search    (public)
// 2 = Watchlist (protected – requires login)
// 3 = Portfolio (protected – requires login)
// 4 = Profile   (protected – requires login)

class AuthTabWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback onBackToExplore;

  const AuthTabWrapper({
    super.key,
    required this.child,
    required this.onBackToExplore,
  });

  @override
  State<AuthTabWrapper> createState() => _AuthTabWrapperState();
}

class _AuthTabWrapperState extends State<AuthTabWrapper> {
  final _navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    final isAuthenticated = context.watch<AppStateProvider>().isAuthenticated;

    if (isAuthenticated) {
      return widget.child;
    }

    return Navigator(
      key: _navigatorKey,
      onGenerateRoute: (settings) {
        Widget page;
        if (settings.name == '/register') {
          page = const RegisterScreen();
        } else {
          page = LoginScreen(onBack: widget.onBackToExplore);
        }
        return MaterialPageRoute(builder: (_) => page);
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
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null && token.isNotEmpty) {
      if (mounted) {
        Provider.of<AppStateProvider>(context, listen: false).setAuthenticated(true);
      }
    }
  }

  void _onBackToExplore() {
    if (mounted) setState(() => _selectedIndex = 0);
  }

  Widget _buildScreen(int index) {
    switch (index) {
      case 0:
        return const HomeScreen();
      case 1:
        return const StockSearchScreen();
      case 2:
        return AuthTabWrapper(
          onBackToExplore: _onBackToExplore,
          child: const FavoritesScreen(),
        );
      case 3:
        return AuthTabWrapper(
          onBackToExplore: _onBackToExplore,
          child: const PortfolioScreen(),
        );
      case 4:
        return AuthTabWrapper(
          onBackToExplore: _onBackToExplore,
          child: const ProfileScreen(),
        );
      default:
        return const HomeScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildScreen(0),
          _buildScreen(1),
          _buildScreen(2),
          _buildScreen(3),
          _buildScreen(4),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE8E2D9), width: 1)),
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
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

