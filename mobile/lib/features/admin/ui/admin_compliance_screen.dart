import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/admin_provider.dart';

class AdminComplianceScreen extends StatefulWidget {
  const AdminComplianceScreen({super.key});

  @override
  State<AdminComplianceScreen> createState() => _AdminComplianceScreenState();
}

class _AdminComplianceScreenState extends State<AdminComplianceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchComplianceQueue();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final mockReviews = provider.complianceQueue;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Compliance Queue', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: mockReviews.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final review = mockReviews[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(review['symbol'], style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark)),
                    Text(review['date'], style: TextStyle(fontSize: 12, color: context.textMuted)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: context.bgAlt, borderRadius: BorderRadius.circular(8)),
                      child: Text(review['type'], style: TextStyle(color: context.textDark, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: Text(review['status'], style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review editor coming soon')));
                    },
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: BorderSide(color: context.primary),
                    ),
                    child: Text('Start Review', style: TextStyle(color: context.primary, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
