import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/admin_provider.dart';

class AdminZakatSettingsScreen extends StatefulWidget {
  const AdminZakatSettingsScreen({super.key});

  @override
  State<AdminZakatSettingsScreen> createState() => _AdminZakatSettingsScreenState();
}

class _AdminZakatSettingsScreenState extends State<AdminZakatSettingsScreen> {
  late final TextEditingController _goldPriceController;
  late final TextEditingController _silverPriceController;

  @override
  void initState() {
    super.initState();
    final zakatSettings = context.read<AdminProvider>().zakatSettings;
    _goldPriceController = TextEditingController(text: zakatSettings['goldPrice'].toString());
    _silverPriceController = TextEditingController(text: zakatSettings['silverPrice'].toString());
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Zakat Settings', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('GLOBAL VARIABLES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted)),
            const SizedBox(height: 16),
            TextField(
              controller: _goldPriceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Gold Price per Gram (₦)',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _silverPriceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Silver Price per Gram (₦)',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: provider.isLoading ? null : () async {
                  final gold = double.tryParse(_goldPriceController.text) ?? 125000.0;
                  final silver = double.tryParse(_silverPriceController.text) ?? 1500.0;
                  await context.read<AdminProvider>().saveZakatSettings(gold, silver);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Settings saved successfully')));
                    Navigator.pop(context);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: provider.isLoading 
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                  : const Text('Save Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
