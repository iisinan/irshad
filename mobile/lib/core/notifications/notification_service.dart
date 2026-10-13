import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../features/scanner/data/product_repository.dart';
import '../../features/stocks/data/stock_repository.dart';
import '../api/api_service.dart';

// Top-level background message handler required by FCM on Android
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint("Handling a background message: ${message.messageId}");
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const String channelId = 'irshad_alerts_channel';
  static const String channelName = 'IRSHAD Alerts & Updates';
  static const String channelDescription = 'Notifications for price movements, Shariah compliance changes, and Irshad Digest.';

  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // 1. Request notification permissions (Handles iOS & Android 13+)
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      debugPrint('User notification permission status: ${settings.authorizationStatus}');

      // 2. Setup Android local notification channel
      final androidLocalPlugin = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      
      if (androidLocalPlugin != null) {
        await androidLocalPlugin.requestNotificationsPermission();
        
        const AndroidNotificationChannel channel = AndroidNotificationChannel(
          channelId,
          channelName,
          description: channelDescription,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        );
        await androidLocalPlugin.createNotificationChannel(channel);
      }

      // 3. Configure local notification settings
      const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const InitializationSettings initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

      await _localNotifications.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (details) {
          if (details.payload != null && details.payload!.isNotEmpty) {
            _handleDeepLink(details.payload!);
          }
        },
      );

      // 4. Foreground message listener -> show system heads-up notification
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM Foreground message received: ${message.notification?.title}');
        _showLocalNotification(message);
      });

      // 5. Message opened from background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('FCM onMessageOpenedApp tapped: ${message.data}');
        _handleMessage(message);
      });

      // 6. Check if app was opened from terminated state
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        _handleMessage(initialMessage);
      }

      // 7. Auto-register token and listen for token refresh
      final token = await getToken();
      if (token != null) {
        _syncTokenWithBackend(token);
      }

      _fcm.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token refreshed: $newToken');
        _syncTokenWithBackend(newToken);
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('PushNotificationService initialize error: $e');
    }
  }

  void _syncTokenWithBackend(String token) async {
    try {
      await ApiService().post('notifications/subscribe', {'fcm_token': token});
      debugPrint('Synced FCM token with backend.');
    } catch (e) {
      debugPrint('Failed to sync FCM token with backend: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      channelDescription: channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );
    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const NotificationDetails details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    final title = message.notification?.title ?? message.data['title'] ?? 'Irshad Alert';
    final body = message.notification?.body ?? message.data['body'] ?? message.data['message'] ?? '';

    final type = message.data['type'] ?? 'inbox';
    final ref = message.data['symbol'] ?? message.data['reference_id'] ?? '';
    final payload = ref.toString().isNotEmpty ? '$type:$ref' : type.toString();

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }

  /// Trigger an immediate local phone notification (for test or custom in-app alerts)
  Future<void> showLocalNotificationDirect({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      channelDescription: channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );
    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const NotificationDetails details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? 'inbox',
    );
  }

  void _handleMessage(RemoteMessage message) {
    final type = message.data['type'] ?? 'inbox';
    final ref = message.data['symbol'] ?? message.data['reference_id'] ?? '';
    final payload = ref.toString().isNotEmpty ? '$type:$ref' : type.toString();
    _handleDeepLink(payload);
  }

  void _handleDeepLink(String payload) async {
    final parts = payload.split(':');
    final type = parts[0];
    final id = parts.length > 1 ? parts[1] : null;

    try {
      if ((type == 'stock' || type == 'price_alert' || type == 'compliance') && id != null) {
        final repo = StockRepository();
        final stock = await repo.getStockDetails(id);
        if (stock != null) {
          ApiService.navigatorKey.currentState?.pushNamed('/stock_details', arguments: stock);
          return;
        }
      } else if (type == 'product' && id != null) {
        final repo = ProductRepository();
        final product = await repo.scanBarcode(id);
        if (product != null) {
          ApiService.navigatorKey.currentState?.pushNamed('/product_details', arguments: product);
          return;
        }
      }
      
      // Default fallback: navigate to Notifications screen
      ApiService.navigatorKey.currentState?.pushNamed('/notifications');
    } catch (e) {
      debugPrint('Deep link navigation error: $e');
    }
  }

  Future<String?> getToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      debugPrint('Error fetching FCM token: $e');
      return null;
    }
  }
}
