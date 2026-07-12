import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/auth_repository.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordConfirmationController = TextEditingController();
  final _authRepository = AuthRepository();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm  = true;

  // Theme Constants
  static const Color bgColor = Color(0xFFF5F0E8);
  static const Color primaryGold = Color(0xFFC9A84C);
  static const Color textDark = Color(0xFF1A1208);
  static const Color textMuted = Color(0xFF9A8C70);
  static const Color cardBg = Colors.white;
  static const Color divider = Color(0xFFE8E2D9);

  void _register() async {
    if (_nameController.text.isEmpty || 
        _emailController.text.isEmpty || 
        _passwordController.text.isEmpty) {
      _showError('Please fill in all required fields');
      return;
    }
    
    if (_passwordController.text != _passwordConfirmationController.text) {
      _showError('Passwords do not match');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = await _authRepository.register(
        _nameController.text,
        _emailController.text,
        _passwordController.text,
        _passwordConfirmationController.text,
      );
      if (user != null) {
        if (mounted) {
          Provider.of<AppStateProvider>(context, listen: false).setAuthenticated(true);
          Navigator.of(context, rootNavigator: true).pushReplacementNamed('/main');
        }
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _registerWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final user = await _authRepository.signInWithGoogleFlow();
      if (user != null) {
        if (mounted) {
          Provider.of<AppStateProvider>(context, listen: false).setAuthenticated(true);
          Navigator.of(context, rootNavigator: true).pushReplacementNamed('/main');
        }
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // Header
              const Text(
                'Create account',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: textDark,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Join IRSHAD today and start your journey\ntowards ethical and shariah-compliant investing.',
                style: TextStyle(color: textMuted, height: 1.5, fontSize: 15),
              ),
              const SizedBox(height: 32),

              // Form fields
              _buildLabel('Full Name'),
              _buildTextField(
                controller: _nameController,
                hint: 'Enter your full name',
                icon: Icons.person_outline_rounded,
              ),
              const SizedBox(height: 20),

              _buildLabel('Email Address'),
              _buildTextField(
                controller: _emailController,
                hint: 'name@example.com',
                icon: Icons.alternate_email_rounded,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),
              
              _buildLabel('Password'),
              _buildTextField(
                controller: _passwordController,
                hint: 'Create a password',
                icon: Icons.lock_outline_rounded,
                isPassword: true,
                obscure: _obscurePassword,
                toggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              const SizedBox(height: 20),

              _buildLabel('Confirm Password'),
              _buildTextField(
                controller: _passwordConfirmationController,
                hint: 'Repeat your password',
                icon: Icons.lock_reset_rounded,
                isPassword: true,
                obscure: _obscureConfirm,
                toggleObscure: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
              const SizedBox(height: 40),

              // Register Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _register,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: textDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                    : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              
              const SizedBox(height: 24),
              Row(
                children: [
                  const Expanded(child: Divider(color: divider)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('or sign up with', style: TextStyle(color: textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                  const Expanded(child: Divider(color: divider)),
                ],
              ),
              const SizedBox(height: 24),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _registerWithGoogle,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: divider, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Sign up with Google', style: TextStyle(color: textDark, fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
              
              const SizedBox(height: 32),

              // Login Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Already have an account?', style: TextStyle(color: textMuted)),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(color: textDark, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label,
        style: const TextStyle(
          color: textDark,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool? obscure,
    VoidCallback? toggleObscure,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure ?? false,
      keyboardType: keyboardType,
      style: const TextStyle(color: textDark, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
        prefixIcon: Icon(icon, color: Colors.grey, size: 20),
        suffixIcon: isPassword ? IconButton(
          icon: Icon(obscure! ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: Colors.grey, size: 20),
          onPressed: toggleObscure,
        ) : null,
        filled: true,
        fillColor: Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: divider, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: textDark, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}
