import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class VerifyEmailScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const VerifyEmailScreen({super.key, this.onBack});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _tokenController = TextEditingController();
  bool _isLoading = false;

  void _verify() {
    if (_tokenController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter the verification code')));
      return;
    }
    setState(() => _isLoading = true);
    
    // Simulate API call
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Email verified successfully!')));
        if (widget.onBack != null) {
          widget.onBack!();
        } else {
          Navigator.pop(context);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: widget.onBack ?? () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: context.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                child: Icon(Icons.mark_email_read_rounded, color: context.primary, size: 28),
              ),
              const SizedBox(height: 24),
              Text('Verify your email', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
              const SizedBox(height: 12),
              Text('We sent a verification code to your email address. Please enter it below to verify your account.', style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5)),
              const SizedBox(height: 40),
              TextField(
                controller: _tokenController,
                keyboardType: TextInputType.number,
                style: TextStyle(color: context.textDark, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  labelText: 'Verification Code',
                  labelStyle: TextStyle(color: context.textMuted),
                  hintText: 'Enter 6-digit code',
                  hintStyle: TextStyle(color: context.textMuted.withValues(alpha: 0.5)),
                  prefixIcon: Icon(Icons.password_rounded, color: context.textMuted),
                  filled: true,
                  fillColor: context.bgAlt,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.divider)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.primary, width: 2)),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : const Text('Verify Email', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verification code resent!')));
                  },
                  child: Text('Resend Code', style: TextStyle(color: context.primary, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
