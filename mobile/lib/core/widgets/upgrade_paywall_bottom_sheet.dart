import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api/api_service.dart';

class UpgradePaywallBottomSheet extends StatefulWidget {
  final String message;
  
  const UpgradePaywallBottomSheet({super.key, required this.message});

  @override
  State<UpgradePaywallBottomSheet> createState() => _UpgradePaywallBottomSheetState();
}

class _UpgradePaywallBottomSheetState extends State<UpgradePaywallBottomSheet> {
  bool _isLoading = false;
  bool _sent = false;

  Future<void> _sendMagicLink() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      await ApiService().post('subscription/magic-link', {});
      setState(() {
        _sent = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Magic link sent successfully! Check your email.', style: TextStyle(fontWeight: FontWeight.bold))),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send link: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
            margin: const EdgeInsets.bottom(24),
          ),
          
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF0F3A40).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.unlock, color: Color(0xFF0A192F), size: 32),
          ),
          const SizedBox(height: 24),
          
          Text(
            'Upgrade to Irshad Pro',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0A192F),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 15,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.mail, color: Color(0xFFD9A05B), size: 24),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Since you are on the mobile app, we can email you a secure link to easily upgrade your account on our website.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _sent || _isLoading ? null : _sendMagicLink,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD9A05B),
                disabledBackgroundColor: _sent ? Colors.green : const Color(0xFFD9A05B).withOpacity(0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24, height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_sent ? LucideIcons.checkCircle2 : LucideIcons.send, color: Colors.white),
                        const SizedBox(width: 12),
                        Text(
                          _sent ? 'Email Sent!' : 'Send me an Upgrade Link',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Maybe Later',
              style: GoogleFonts.inter(
                color: Colors.grey[500],
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
