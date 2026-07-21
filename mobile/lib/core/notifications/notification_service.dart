import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:io';
import '../../features/scanner/data/product_repository.dart';
import '../../features/stocks/data/stock_repository.dart';
import '../api/api_service.dart';

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    if (Platform.isIOS) {
      await _fcm.requestPermission();
    }

    // Configure local notifications
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);
    
    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
       // Handle notification tap while app is in foreground
       if (details.payload != null) {
         _handleDeepLink(details.payload!);
       }
    });

    // Listen for foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // Listen for background message taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
       _handleMessage(message);
    });

    // Check if app was opened from a terminated state
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleMessage(initialMessage);
    }
  }

  void _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'irshad_channel',
      'IRSHAD Updates',
      importance: Importance.max,
      priority: Priority.high,
    );
    const NotificationDetails details = NotificationDetails(android: androidDetails);
    
    final type = message.data['type'] ?? 'unknown';
    final refId = message.data['reference_id']?.toString() ?? '';
    final payload = refId.isNotEmpty ? '$type:$refId' : type;

    await _localNotifications.show(
      id: 0,
      title: message.notification?.title,
      body: message.notification?.body,
      notificationDetails: details,
      payload: payload,
    );
  }

  void _handleMessage(RemoteMessage message) {
    if (message.data.containsKey('type')) {
      final type = message.data['type'] ?? 'unknown';
      final refId = message.data['reference_id']?.toString() ?? '';
      final payload = refId.isNotEmpty ? '$type:$refId' : type;
      _handleDeepLink(payload);
    }
  }

  void _handleDeepLink(String payload) async {
    final parts = payload.split(':');
    final type = parts[0];
    final id = parts.length > 1 ? parts[1] : null;

    if (type == 'product' && id != null) {
       final repo = ProductRepository();
       final product = await repo.scanBarcode(id);
       if (product != null) {
         ApiService.navigatorKey.currentState?.pushNamed('/product_details', arguments: product);
       }
    } else if (type == 'stock' && id != null) {
       final repo = StockRepository();
       final stock = await repo.getStockDetails(id);
       if (stock != null) {
         ApiService.navigatorKey.currentState?.pushNamed('/stock_details', arguments: stock);
       }
    }
  }

  Future<String?> getToken() async {
    return await _fcm.getToken();
  }
}
