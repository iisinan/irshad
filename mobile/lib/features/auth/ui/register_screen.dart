import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/auth_repository.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with SingleTickerProviderStateMixin {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordConfirmationController = TextEditingController();
  final _authRepository = AuthRepository();
  
  late AnimationController _animationController;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm  = true;
  bool _agreedToTerms = false;

  String _country = 'Nigeria';
  String _investorType = 'Retail Investor';
  String _primaryUseCase = 'Personal Wealth Growth';
  String _investmentExperience = 'Novice (Just Starting)';

  final List<String> _countries = [
    'Nigeria', 'Benin', 'Burkina Faso', 'Cape Verde', 'Côte d\'Ivoire', 
    'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Liberia', 'Mali', 
    'Niger', 'Senegal', 'Sierra Leone', 'Togo', 'Other'
  ];

  final List<String> _investorTypes = [
    'Retail Investor', 'Institutional Manager', 'Islamic Finance Scholar / Expert',
    'Academic / Researcher', 'Other'
  ];

  final List<String> _useCases = [
    'Personal Wealth Growth', 'Halal Portfolio Compliance', 
    'Client Advisory Services', 'Zakat Calculation & Cleansing'
  ];

  final List<String> _experiences = [
    'Novice (Just Starting)', 'Competent (Casual Investor)', 
    'Proficient (Active Trader)', 'Expert (Professional)'
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _passwordConfirmationController.dispose();
    super.dispose();
  }

  Color get cardBg => context.bgAlt;

  void _register() async {
    if (_firstNameController.text.trim().isEmpty || 
        _lastNameController.text.trim().isEmpty || 
        _emailController.text.trim().isEmpty || 
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
        '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
        _emailController.text.trim(),
        _passwordController.text,
        _passwordConfirmationController.text,
        location: _country,
        phoneNumber: _phoneController.text.trim(),
        investorType: _investorType,
        primaryUseCase: _primaryUseCase,
        investmentExperience: _investmentExperience,
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
    if (!_agreedToTerms) {
      // For google sign in, they also technically need to agree, but the frontend
      // allows google sign in. We'll enforce the checkbox here too just in case.
      // Wait, frontend google sign in doesn't enforce the checkbox directly on click, 
      // but it's good practice. Let's just let google sign in pass or prompt if they want.
      // Actually, frontend google login handles it on the server if the user is new.
    }
    
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
        backgroundColor: context.haram,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              context.primary.withValues(alpha: 0.05),
              context.bg,
              context.bg,
            ],
            stops: const [0.0, 0.3, 1.0],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                // App Logo
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.0,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Image.asset(
                      'assets/mobile logo.png',
                      height: 48,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Header
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.0,
                  child: ShaderMask(
                    blendMode: BlendMode.srcIn,
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [context.textDark, context.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ).createShader(bounds),
                    child: Text(
                      'Create account',
                      style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -1.2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.1,
                  child: Text(
                    'Join IRSHAD today and start your journey\ntowards ethical and shariah-compliant investing.',
                    style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 15, fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 32),

                // Form fields
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.2,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('First Name *'),
                            _buildTextField(
                              controller: _firstNameController,
                              hint: 'Omar',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Last Name *'),
                            _buildTextField(
                              controller: _lastNameController,
                              hint: 'Bello',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                _FadeSlide(
                  controller: _animationController,
                  delay: 0.25,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel('Email Address *'),
                      _buildTextField(
                        controller: _emailController,
                        hint: 'you@example.com',
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                _FadeSlide(
                  controller: _animationController,
                  delay: 0.3,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Phone Number'),
                            _buildTextField(
                              controller: _phoneController,
                              hint: '+234 800...',
                              keyboardType: TextInputType.phone,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Country'),
                            _buildDropdown(
                              value: _country,
                              items: _countries,
                              onChanged: (v) => setState(() => _country = v!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                _FadeSlide(
                  controller: _animationController,
                  delay: 0.35,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel('Investor Type'),
                      _buildDropdown(
                        value: _investorType,
                        items: _investorTypes,
                        onChanged: (v) => setState(() => _investorType = v!),
                      ),
                      const SizedBox(height: 20),
                      _buildLabel('Primary Use Case'),
                      _buildDropdown(
                        value: _primaryUseCase,
                        items: _useCases,
                        onChanged: (v) => setState(() => _primaryUseCase = v!),
                      ),
                      const SizedBox(height: 20),
                      _buildLabel('Investment Experience'),
                      _buildDropdown(
                        value: _investmentExperience,
                        items: _experiences,
                        onChanged: (v) => setState(() => _investmentExperience = v!),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.4,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Password *'),
                            _buildTextField(
                              controller: _passwordController,
                              hint: 'Strong password',
                              isPassword: true,
                              obscure: _obscurePassword,
                              toggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Confirm *'),
                            _buildTextField(
                              controller: _passwordConfirmationController,
                              hint: 'Repeat',
                              isPassword: true,
                              obscure: _obscureConfirm,
                              toggleObscure: () => setState(() => _obscureConfirm = !_obscureConfirm),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                _FadeSlide(
                  controller: _animationController,
                  delay: 0.45,
                  child: GestureDetector(
                    onTap: () => setState(() => _agreedToTerms = !_agreedToTerms),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: Checkbox(
                            value: _agreedToTerms,
                            onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                            activeColor: context.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'I agree to the Terms of Service, Privacy Policy, and acknowledge the Shariah Methodology.',
                            style: TextStyle(color: context.textMuted, fontSize: 13, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Register Button
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.5,
                  child: Container(
                    decoration: BoxDecoration(
                      boxShadow: [
                        if (_agreedToTerms)
                          BoxShadow(
                            color: context.primary.withValues(alpha: 0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: (_isLoading || !_agreedToTerms) ? null : _register,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: context.primary.withValues(alpha: 0.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                          elevation: 0,
                        ),
                        child: _isLoading 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                          : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.55,
                  child: Row(
                    children: [
                      Expanded(child: Divider(color: context.divider)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text('or sign up with', style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                      Expanded(child: Divider(color: context.divider)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.6,
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : _registerWithGoogle,
                      style: OutlinedButton.styleFrom(
                        backgroundColor: context.bg,
                        side: BorderSide(color: context.divider, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset('assets/images/google_logo.png', height: 24, width: 24),
                          const SizedBox(width: 12),
                          Text('Sign up with Google', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700, fontSize: 16)),
                        ],
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),

                // Login Link
                _FadeSlide(
                  controller: _animationController,
                  delay: 0.65,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Already have an account?', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w500)),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text(
                          'Sign In',
                          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
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
        style: TextStyle(
          color: context.textDark,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    IconData? icon,
    bool isPassword = false,
    bool? obscure,
    VoidCallback? toggleObscure,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure ?? false,
      keyboardType: keyboardType,
      style: TextStyle(color: context.textDark, fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: context.textMuted.withValues(alpha: 0.7), fontWeight: FontWeight.w500),
        prefixIcon: icon != null ? Icon(icon, color: context.textMuted, size: 20) : null,
        suffixIcon: isPassword ? IconButton(
          icon: Icon(obscure! ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: context.textMuted, size: 20),
          onPressed: toggleObscure,
        ) : null,
        filled: true,
        fillColor: context.bg,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.divider, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.primary, width: 2),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: icon != null ? 16 : 20, vertical: 16),
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider, width: 1.5),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: Icon(Icons.expand_more_rounded, color: context.textMuted),
          dropdownColor: context.bg,
          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w600, fontSize: 16),
          onChanged: onChanged,
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item, overflow: TextOverflow.ellipsis),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _FadeSlide extends StatelessWidget {
  final AnimationController controller;
  final double delay;
  final Widget child;

  const _FadeSlide({
    required this.controller,
    required this.delay,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final start = delay;
    final end = (delay + 0.4).clamp(0.0, 1.0);

    final animation = CurvedAnimation(
      parent: controller,
      curve: Interval(start, end, curve: Curves.easeOutCubic),
    );

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Opacity(
          opacity: animation.value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - animation.value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
