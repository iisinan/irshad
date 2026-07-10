import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:io';

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

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
    
    await _localNotifications.show(
      id: 0,
      title: message.notification?.title,
      body: message.notification?.body,
      notificationDetails: details,
      payload: message.data['type'] + ':' + message.data['reference_id'].toString(),
    );
  }

  void _handleMessage(RemoteMessage message) {
    if (message.data.containsKey('type')) {
      _handleDeepLink('${message.data['type']}:${message.data['reference_id']}');
    }
  }

  void _handleDeepLink(String payload) {
    final parts = payload.split(':');
    final type = parts[0];
    final id = parts.length > 1 ? parts[1] : null;

    if (type == 'product') {
       // Logic to fetch product and navigate
       // navigatorKey.currentState?.pushNamed('/product_details', arguments: {...});
    } else if (type == 'stock') {
       // Logic to fetch stock and navigate
    }
  }

  Future<String?> getToken() async {
    return await _fcm.getToken();
  }
}
