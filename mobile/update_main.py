import os

main_dart_path = 'lib/main.dart'

with open(main_dart_path, 'r') as f:
    content = f.read()

imports_to_add = """
import 'dart:convert';
import 'package:dio/dio.dart';
"""

# Insert imports after the first import
first_import_idx = content.find("import ")
end_of_first_import = content.find("\n", first_import_idx)

content = content[:end_of_first_import+1] + imports_to_add + content[end_of_first_import+1:]

old_dispatcher = """@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint("Native called background task: $task");
    // TODO: Reconcile cached halal product data with backend API when online
    return Future.value(true);
  });
}"""

new_dispatcher = """@pragma('vm:entry-point')
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

        final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://irshad-k3el.onrender.com/api/v1/';
        
        final dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        ));

        final storage = const FlutterSecureStorage();
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
}"""

if old_dispatcher in content:
    content = content.replace(old_dispatcher, new_dispatcher)
else:
    print("WARNING: Could not find old dispatcher in main.dart")

with open(main_dart_path, 'w') as f:
    f.write(content)

print("Updated main.dart successfully.")
