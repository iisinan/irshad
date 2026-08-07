import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/admin_provider.dart';

class AdminTickersScreen extends StatefulWidget {
  const AdminTickersScreen({super.key});

  @override
  State<AdminTickersScreen> createState() => _AdminTickersScreenState();
}

class _AdminTickersScreenState extends State<AdminTickersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchTickers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final mockTickers = provider.tickers;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Manage Tickers', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(icon: Icon(Icons.add_rounded, color: context.primary), onPressed: () {}),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: mockTickers.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final ticker = mockTickers[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.divider),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.show_chart_rounded, color: context.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(ticker['symbol'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                      const SizedBox(height: 2),
                      Text('₦${ticker['price']}', style: TextStyle(fontSize: 14, color: context.textMuted)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: ticker['status'] == 'Active' ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(ticker['status'], style: TextStyle(color: ticker['status'] == 'Active' ? Colors.green : Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
