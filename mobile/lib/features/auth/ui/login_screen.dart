import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../data/auth_repository.dart';
import 'forgot_password_screen.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class LoginScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const LoginScreen({super.key, this.onBack});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authRepository = AuthRepository();
  final LocalAuthentication _localAuth = LocalAuthentication();
  final _secureStorage = const FlutterSecureStorage();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _biometricsEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    final prefs = await SharedPreferences.getInstance();
    final enabled = prefs.getBool('biometrics_enabled') ?? false;
    
    if (enabled) {
      final canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      setState(() {
        _biometricsEnabled = canCheckBiometrics && isDeviceSupported;
      });
    }
  }

  Future<void> _authenticateWithBiometrics() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to log in securely',
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );
      
      if (authenticated) {
        setState(() => _isLoading = true);
        final email = await _secureStorage.read(key: 'saved_email');
        final password = await _secureStorage.read(key: 'saved_password');
        
        if (email != null && password != null) {
          _emailController.text = email;
          _passwordController.text = password;
          _login();
        } else {
          setState(() => _isLoading = false);
          _showError('No saved credentials found. Please log in with your password once.');
        }
      }
    } catch (e) {
      _showError('Biometric authentication failed.');
    }
  }

  // Theme Constants
static const Color cardBg = Colors.white;
void _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showError('Please fill in all fields');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = await _authRepository.login(_emailController.text, _passwordController.text);
      if (user != null) {
        await _secureStorage.write(key: 'saved_email', value: _emailController.text);
        await _secureStorage.write(key: 'saved_password', value: _passwordController.text);
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

  void _loginWithGoogle() async {
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
      backgroundColor: AppTheme.bg,
      appBar: (widget.onBack != null || Navigator.canPop(context))
          ? AppBar(
              backgroundColor: AppTheme.bg,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textDark, size: 20),
                onPressed: () => widget.onBack != null ? widget.onBack!() : Navigator.pop(context),
              ),
            )
          : null,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Header
              const Text(
                'Welcome back',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textDark,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Sign in to your IRSHAD account to access your\nportfolio and premium features.',
                style: TextStyle(color: AppTheme.textMuted, height: 1.5, fontSize: 15),
              ),
              const SizedBox(height: 48),

              // Form fields
              _buildLabel('Email Address'),
              _buildTextField(
                controller: _emailController,
                hint: 'name@example.com',
                icon: Icons.alternate_email_rounded,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 24),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildLabel('Password'),
                  TextButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero),
                    child: const Text('Forgot Password?', 
                      style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                ],
              ),
              _buildTextField(
                controller: _passwordController,
                hint: 'Enter your password',
                icon: Icons.lock_outline_rounded,
                isPassword: true,
                obscure: _obscurePassword,
                toggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              const SizedBox(height: 40),

              // Login Button & Biometrics
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.textDark,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: _isLoading 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                          : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                  if (_biometricsEnabled) ...[
                    const SizedBox(width: 16),
                    SizedBox(
                      height: 56,
                      width: 56,
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : _authenticateWithBiometrics,
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          side: const BorderSide(color: AppTheme.divider),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Icon(Icons.fingerprint_rounded, color: AppTheme.textDark, size: 28),
                      ),
                    ),
                  ],
                ],
              ),
              
              const SizedBox(height: 24),
              Row(
                children: [
                  const Expanded(child: Divider(color: AppTheme.divider)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('or continue with', style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                  const Expanded(child: Divider(color: AppTheme.divider)),
                ],
              ),
              const SizedBox(height: 24),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _loginWithGoogle,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.divider, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Continue with Google', style: TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
              
              const SizedBox(height: 32),

              // Register Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Don\'t have an account?', style: TextStyle(color: AppTheme.textMuted)),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/register'),
                    child: const Text(
                      'Create Account',
                      style: TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 60),
              
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.verified_user_rounded, size: 14, color: AppTheme.primary),
                  SizedBox(width: 8),
                  Text(
                    'Secure & Shariah Compliant',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
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
          color: AppTheme.textDark,
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
      style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w500),
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
          borderSide: const BorderSide(color: AppTheme.divider, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.textDark, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}
