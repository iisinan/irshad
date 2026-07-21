import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../data/product_repository.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class UserSubmissionScreen extends StatefulWidget {
  final String? initialBarcode;

  const UserSubmissionScreen({super.key, this.initialBarcode});

  @override
  State<UserSubmissionScreen> createState() => _UserSubmissionScreenState();
}

class _UserSubmissionScreenState extends State<UserSubmissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _brandController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _ingredientsController = TextEditingController();
  
  bool _isLoading = false;
  XFile? _imageFile;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    if (widget.initialBarcode != null) {
      _barcodeController.text = widget.initialBarcode!;
    }
  }

  final _productRepo = ProductRepository();

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final success = await _productRepo.submitProduct({
        'name': _nameController.text.trim(),
        'brand': _brandController.text.trim(),
        'barcode': _barcodeController.text.trim(),
        'ingredients_text': _ingredientsController.text.trim(),
      }, imagePath: _imageFile?.path);
      
      if (success && mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: context.bgAlt,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titlePadding: const EdgeInsets.only(top: 40),
        title: Column(
          children: [
            Icon(Icons.check_circle_rounded, color: context.primary, size: 64),
            SizedBox(height: 24),
            Text(
              'Submission Received', 
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20),
            ),
          ],
        ),
        content: Text(
          'Thank you for contributing to the IRSHAD community! Our scholars will review this product shortly.',
          textAlign: TextAlign.center,
          style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
        ),
        actionsPadding: const EdgeInsets.all(24),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                elevation: 0,
              ),
              child: const Text('Return to Home', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: context.haram,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('New Submission', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 32),
              
              _buildSectionLabel('PRODUCT DATA'),
              const SizedBox(height: 12),
              _buildCustomTextField(
                controller: _nameController,
                hint: 'Product Name (e.g. Peak Milk)',
                icon: Icons.shopping_bag_outlined,
                validator: (v) => v!.isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),
              
              _buildCustomTextField(
                controller: _brandController,
                hint: 'Brand (e.g. FrieslandCampina)',
                icon: Icons.business_outlined,
              ),
              const SizedBox(height: 16),
              
              _buildCustomTextField(
                controller: _barcodeController,
                hint: 'Barcode ID',
                icon: Icons.qr_code_rounded,
                validator: (v) => v!.isEmpty ? 'Barcode is required' : null,
              ),
              const SizedBox(height: 16),
              
              _buildCustomTextField(
                controller: _ingredientsController,
                hint: 'Ingredients list...',
                icon: Icons.list_alt_rounded,
                maxLines: 4,
              ),
              const SizedBox(height: 32),
              
              // Photo Upload 
              _buildSectionLabel('VISUAL PROOF'),
              const SizedBox(height: 12),
              _buildPhotoUploadSection(),
              const SizedBox(height: 48),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                    elevation: 0,
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                    : const Text('Submit for Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 1),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Missing Product?',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
        ),
        const SizedBox(height: 12),
        Text(
          'Help the IRSHAD community by submitting this product for scholar verification.',
          style: TextStyle(color: context.textMuted, fontSize: 15, height: 1.5, fontWeight: FontWeight.w400),
        ),
      ],
    );
  }

  Widget _buildCustomTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      validator: validator,
      style: TextStyle(color: context.textDark, fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w400),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(bottom: 0),
          child: Icon(icon, color: context.textMuted, size: 20),
        ),
        filled: true,
        fillColor: Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.divider, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildPhotoUploadSection() {
    return GestureDetector(
      onTap: () async {
        final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
        if (image != null) {
          setState(() => _imageFile = image);
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider, width: 1.5),
        ),
        child: _imageFile != null 
          ? Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    File(_imageFile!.path),
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Tap to change photo', style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            )
          : Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: context.bg, borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.camera_alt_rounded, color: context.primary, size: 28),
                ),
                const SizedBox(height: 16),
                Text(
                  'Upload Product Image',
                  style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 14),
                ),
                const SizedBox(height: 6),
                Text(
                  'High quality photo of ingredients list preferred',
                  style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
      ),
    );
  }
}
