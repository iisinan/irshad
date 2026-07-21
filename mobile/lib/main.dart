import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'core/api/api_service.dart';
import 'features/auth/ui/login_screen.dart';
import 'features/auth/ui/register_screen.dart';
import 'features/auth/ui/welcome_screen.dart';
import 'features/auth/ui/profile_screen.dart';
import 'features/auth/ui/edit_profile_screen.dart';
import 'core/theme/app_theme.dart';
import 'features/home/home_screen.dart';
import 'features/profile/ui/settings_screen.dart';
import 'features/profile/ui/notifications_screen.dart';
import 'features/scanner/ui/search_screen.dart';
import 'features/scanner/ui/product_details_screen.dart';
import 'features/scanner/ui/user_submission_screen.dart';
import 'features/stocks/ui/stock_search_screen.dart';
import 'features/stocks/ui/stock_detail_screen.dart';
import 'features/stocks/ui/basket_detail_screen.dart';
import 'features/stocks/ui/edit_basket_screen.dart';
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
import 'features/baskets/providers/basket_provider.dart';
import 'features/portfolio/providers/portfolio_provider.dart';
import 'package:workmanager/workmanager.dart';
import 'core/providers/app_state_provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint("Native called background task: $task");
    
    if (task == "backgroundSync") {
      try {
        WidgetsFlutterBinding.ensureInitialized();
        
        try {
          await dotenv.load(fileName: ".env");
        } catch (e) {
          debugPrint("Failed to load .env in background isolate: $e");
        }

        final prefs = await SharedPreferences.getInstance();
        List<String> history = prefs.getStringList('scan_history') ?? [];
        if (history.isEmpty) return Future.value(true);

        final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api/';
        
        final dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        ));

        final storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
        final token = await storage.read(key: 'access_token');
        if (token != null) {
          dio.options.headers['Authorization'] = 'Bearer $token';
        }

        bool updatedAny = false;
        List<String> newHistory = [];

        for (String itemStr in history) {
          try {
            final Map<String, dynamic> item = jsonDecode(itemStr);
            final String barcode = item['barcode'];
            
            final response = await dio.get('products/$barcode');
            if (response.statusCode == 200) {
              newHistory.add(jsonEncode(response.data['data']));
              updatedAny = true;
            } else {
              newHistory.add(itemStr);
            }
          } catch (e) {
            newHistory.add(itemStr);
          }
        }

        if (updatedAny) {
          await prefs.setStringList('scan_history', newHistory);
          debugPrint("Background sync completed successfully. Updated products in cache.");
        }
      } catch (e) {
        debugPrint("Background sync failed: $e");
        return Future.value(false);
      }
    }
    
    return Future.value(true);
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");

  // Initialize Firebase
  try {
    await Firebase.initializeApp();
    await PushNotificationService().initialize();
  } catch (e) {
    debugPrint("Firebase init failed (missing google-services.json?): $e");
  }

  Workmanager().initialize(
    callbackDispatcher, 
    isInDebugMode: true 
  );

  Workmanager().registerPeriodicTask(
    "syncTask",
    "backgroundSync",
    frequency: const Duration(minutes: 15),
  );

  await Hive.initFlutter();
  await Hive.openBox('api_cache');

  final prefs = await SharedPreferences.getInstance();
  final hasSeenOnboarding = prefs.getBool('hasSeenOnboarding') ?? false;

  final storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
  final token = await storage.read(key: 'access_token');
  final bool hasToken = token != null && token.isNotEmpty;

  // Lock the app behind registration: go to welcome if onboarding is done but no token
  final String startRoute = !hasSeenOnboarding 
      ? '/onboarding' 
      : (hasToken ? '/main' : '/welcome');

  final appState = AppStateProvider();
  await appState.loadThemeMode();
  if (hasToken) {
    appState.setAuthenticated(true);
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => StockProvider()),
        ChangeNotifierProvider(create: (_) => BasketProvider()),
        ChangeNotifierProvider(create: (_) => PortfolioProvider()),
        ChangeNotifierProvider.value(value: appState),
      ],
      child: IrshadApp(initialRoute: startRoute),
    ),
  );
}

class IrshadApp extends StatelessWidget {
  final String initialRoute;
  const IrshadApp({super.key, this.initialRoute = '/onboarding'});

  @override
  Widget build(BuildContext context) {
    final themeMode = Provider.of<AppStateProvider>(context).themeMode;
    return MaterialApp(
      title: 'IRSHAD',
      debugShowCheckedModeBanner: false,
      navigatorKey: ApiService.navigatorKey,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
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
        if (settings.name == '/edit_basket') {
          final basket = settings.arguments;
          return MaterialPageRoute(builder: (context) => EditBasketScreen(basket: basket));
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



class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;
  final _storage = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));

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
        return const FavoritesScreen();
      case 2:
        return const PortfolioScreen();
      case 3:
        return const StockSearchScreen();
      default:
        return const HomeScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _selectedIndex,
            children: [
              _buildScreen(0),
              _buildScreen(1),
              _buildScreen(2),
              _buildScreen(3),
            ],
          ),
          // Floating Pill Navigation
          Positioned(
            left: 24,
            right: 24,
            bottom: 24 + MediaQuery.of(context).padding.bottom, // Dynamic padding for safe areas (like iPhone home indicator)
            child: ClipRRect(
              borderRadius: BorderRadius.circular(40),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 64,
                  decoration: BoxDecoration(
                    color: context.bgAlt.withValues(alpha: 0.8), // Glass effect matching theme
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: context.textDark.withValues(alpha: 0.1), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildNavItem(0, Icons.explore_outlined, Icons.explore_rounded, 'Explore'),
                      _buildNavItem(1, Icons.favorite_outline_rounded, Icons.favorite_rounded, 'Watchlist'),
                      _buildNavItem(2, Icons.pie_chart_outline_rounded, Icons.pie_chart_rounded, 'Portfolio'),
                      _buildNavItem(3, Icons.search_rounded, Icons.search_rounded, 'Search'),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData iconOutlined, IconData iconFilled, String label) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        margin: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? context.accentSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? iconFilled : iconOutlined,
              color: isSelected ? context.primary : context.textMuted,
              size: 22,
            ),
            if (isSelected)
              Text(
                label,
                style: TextStyle(
                  color: context.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

