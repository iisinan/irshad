import 'package:flutter/material.dart';
import '../../../core/api/api_service.dart';
class BrokerageLinkScreen extends StatefulWidget {
  const BrokerageLinkScreen({super.key});

  @override
  State<BrokerageLinkScreen> createState() => _BrokerageLinkScreenState();
}

class _BrokerageLinkScreenState extends State<BrokerageLinkScreen> {
  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  final List<Map<String, String>> _brokers = [
    {'name': 'Bamboo', 'logo': 'B', 'description': 'Invest in US and Nigerian stocks'},
    {'name': 'Chaka', 'logo': 'C', 'description': 'Global and local investment access'},
    {'name': 'Risevest', 'logo': 'R', 'description': 'Automated dollar investments'},
    {'name': 'Trove', 'logo': 'T', 'description': 'Stocks, Bonds, and ETFs'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Linked Brokerage', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Trade Instantly',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5),
            ),
            const SizedBox(height: 12),
            const Text(
              'Connect your existing brokerage account to execute Shariah-compliant trades directly from IRSHAD.',
              style: TextStyle(color: textMuted, fontSize: 15, height: 1.5, fontWeight: FontWeight.w400),
            ),
            const SizedBox(height: 32),
            
            _buildSectionLabel('AVAILABLE BROKERS'),
            const SizedBox(height: 16),
            ..._brokers.map((broker) => _buildBrokerCard(broker)).toList(),
            
            const SizedBox(height: 40),
            _buildSecurityNotice(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 1),
    );
  }

  Widget _buildBrokerCard(Map<String, String> broker) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: primaryGreen.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              broker['logo']!,
              style: const TextStyle(color: primaryGreen, fontWeight: FontWeight.w900, fontSize: 20),
            ),
          ),
        ),
        title: Text(
          broker['name']!,
          style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, fontSize: 16),
        ),
        subtitle: Text(
          broker['description']!,
          style: const TextStyle(color: textMuted, fontSize: 13, height: 1.4),
        ),
        trailing: const Icon(Icons.link_rounded, color: textMuted),
        onTap: () => _initiateOAuth(broker['name']!),
      ),
    );
  }


  Future<void> _initiateOAuth(String name) async {
    // Show a loading indicator since we are simulating the connection
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: primaryGreen)),
    );

    try {
      final apiService = ApiService();
      await apiService.post('broker/link', {'broker_name': name});
      
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        
        // Show success snackbar
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully linked $name and funded account with ₦1,000,000!'),
            backgroundColor: primaryGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
        
        // Pop back to portfolio
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error linking broker: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildSecurityNotice() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF2FF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield_rounded, color: Colors.indigo, size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bank-Level Security', style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.w800, fontSize: 14)),
                SizedBox(height: 4),
                Text(
                  'Your credentials are encrypted and never stored on IRSHAD servers. We use OAuth 2.0 to securely link with your broker.',
                  style: TextStyle(color: Colors.indigo, fontSize: 12, height: 1.4, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
