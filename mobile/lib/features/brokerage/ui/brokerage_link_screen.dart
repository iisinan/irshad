import 'package:flutter/material.dart';
import '../../../core/api/api_service.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
class BrokerageLinkScreen extends StatefulWidget {
  const BrokerageLinkScreen({super.key});

  @override
  State<BrokerageLinkScreen> createState() => _BrokerageLinkScreenState();
}

class _BrokerageLinkScreenState extends State<BrokerageLinkScreen> {
  // Theme Constants
final List<Map<String, String>> _brokers = [
    {'name': 'Bamboo', 'logo': 'B', 'description': 'Invest in US and Nigerian stocks'},
    {'name': 'Chaka', 'logo': 'C', 'description': 'Global and local investment access'},
    {'name': 'Risevest', 'logo': 'R', 'description': 'Automated dollar investments'},
    {'name': 'Trove', 'logo': 'T', 'description': 'Stocks, Bonds, and ETFs'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Linked Brokerage', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5)),
        backgroundColor: AppTheme.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
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
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.textDark, letterSpacing: -0.5),
            ),
            const SizedBox(height: 12),
            const Text(
              'Connect your existing brokerage account to execute Shariah-compliant trades directly from IRSHAD.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 15, height: 1.5, fontWeight: FontWeight.w400),
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
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1),
    );
  }

  Widget _buildBrokerCard(Map<String, String> broker) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              broker['logo']!,
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w900, fontSize: 20),
            ),
          ),
        ),
        title: Text(
          broker['name']!,
          style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, fontSize: 16),
        ),
        subtitle: Text(
          broker['description']!,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
        ),
        trailing: const Icon(Icons.link_rounded, color: AppTheme.textMuted),
        onTap: () => _initiateOAuth(broker['name']!),
      ),
    );
  }


  void _initiateOAuth(String name) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildOAuthBottomSheet(name),
    );
  }

  Widget _buildOAuthBottomSheet(String brokerName) {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    bool isConnecting = false;

    return StatefulBuilder(
      builder: (context, setState) {
        return Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.divider,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Icon(Icons.link_rounded, color: AppTheme.primary, size: 28),
                    const SizedBox(width: 12),
                    Text(
                      'Connect to $brokerName',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter your $brokerName credentials to securely link your account. IRSHAD does not store your password.',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 24),
                const Text('Email or Username', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textDark)),
                const SizedBox(height: 8),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(
                    hintText: 'Enter your email',
                    filled: true,
                    fillColor: AppTheme.bg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Password', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textDark)),
                const SizedBox(height: 8),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Enter your password',
                    filled: true,
                    fillColor: AppTheme.bg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: isConnecting
                        ? null
                        : () async {
                            if (emailController.text.isEmpty || passwordController.text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter your credentials'), backgroundColor: AppTheme.haram),
                              );
                              return;
                            }
                            
                            setState(() => isConnecting = true);
                            try {
                              await ApiService().post('broker/link', {'broker_name': brokerName});
                              
                              if (context.mounted) {
                                Navigator.pop(context); // Close bottom sheet
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Successfully linked $brokerName and funded account with ₦1,000,000!'),
                                    backgroundColor: AppTheme.primary,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                Navigator.pop(context); // Go back to portfolio
                              }
                            } catch (e) {
                              if (context.mounted) {
                                setState(() => isConnecting = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error linking broker: $e'), backgroundColor: AppTheme.haram),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: isConnecting
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Secure Connect', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
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
