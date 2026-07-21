import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_service.dart';
import '../../portfolio/providers/portfolio_provider.dart';
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

  List<dynamic> _linkedAccounts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLinkedAccounts();
  }

  Future<void> _fetchLinkedAccounts() async {
    try {
      final response = await ApiService().get('brokerage/accounts');
      if (response.data['status'] == 'success') {
        if (mounted) {
          setState(() {
            _linkedAccounts = response.data['data'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Linked Brokerage', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: context.primary))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trade Instantly',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
                ),
                const SizedBox(height: 12),
                Text(
                  'Connect your existing brokerage account to execute Shariah-compliant trades directly from IRSHAD.',
                  style: TextStyle(color: context.textMuted, fontSize: 15, height: 1.5, fontWeight: FontWeight.w400),
                ),
                const SizedBox(height: 32),
                
                if (_linkedAccounts.isNotEmpty) ...[
                  _buildSectionLabel('LINKED ACCOUNTS'),
                  const SizedBox(height: 16),
                  ..._linkedAccounts.map((account) => _buildLinkedAccountCard(account)).toList(),
                  const SizedBox(height: 32),
                ],

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
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1),
    );
  }

  Widget _buildLinkedAccountCard(dynamic account) {
    final brokerName = account['broker_name'] ?? 'Unknown Broker';
    final initial = brokerName.isNotEmpty ? brokerName[0] : '?';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.primary.withValues(alpha: 0.3)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: context.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              initial,
              style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 20),
            ),
          ),
        ),
        title: Text(
          brokerName,
          style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16),
        ),
        subtitle: Text(
          'Active Connection',
          style: TextStyle(color: context.primary, fontSize: 13, fontWeight: FontWeight.bold),
        ),
        trailing: Icon(Icons.check_circle_rounded, color: context.primary),
      ),
    );
  }

  Widget _buildBrokerCard(Map<String, String> broker) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: context.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              broker['logo']!,
              style: TextStyle(color: context.primary, fontWeight: FontWeight.w900, fontSize: 20),
            ),
          ),
        ),
        title: Text(
          broker['name']!,
          style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16),
        ),
        subtitle: Text(
          broker['description']!,
          style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.4),
        ),
        trailing: Icon(Icons.link_rounded, color: context.textMuted),
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
          decoration: BoxDecoration(
            color: context.bgAlt,
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
                      color: context.divider,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Icon(Icons.link_rounded, color: context.primary, size: 28),
                    const SizedBox(width: 12),
                    Text(
                      'Connect to $brokerName',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: context.textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter your $brokerName credentials to securely link your account. IRSHAD does not store your password.',
                  style: TextStyle(color: context.textMuted, fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 24),
                Text('Email or Username', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: context.textDark)),
                const SizedBox(height: 8),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(
                    hintText: 'Enter your email',
                    filled: true,
                    fillColor: context.bg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Password', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: context.textDark)),
                const SizedBox(height: 8),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Enter your password',
                    filled: true,
                    fillColor: context.bg,
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
                                SnackBar(content: Text('Please enter your credentials'), backgroundColor: context.haram),
                              );
                              return;
                          }
                            
                            setState(() => isConnecting = true);
                            try {
                              final success = await Provider.of<PortfolioProvider>(context, listen: false)
                                  .linkBroker(brokerName);
                              
                              if (context.mounted) {
                                if (success) {
                                  Navigator.pop(context); // Close bottom sheet
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Successfully linked $brokerName and funded account with ₦1,000,000!'),
                                      backgroundColor: context.primary,
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                  _fetchLinkedAccounts(); // Refresh the list
                                } else {
                                  setState(() => isConnecting = false);
                                  final error = Provider.of<PortfolioProvider>(context, listen: false).error;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error linking broker: $error'), backgroundColor: context.haram),
                                  );
                                }
                              }
                            } catch (e) {
                              if (context.mounted) {
                                setState(() => isConnecting = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error linking broker: $e'), backgroundColor: context.haram),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
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
