import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../data/product_repository.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _productRepository = ProductRepository();
  bool _isScanning = true;
  final MobileScannerController _controller = MobileScannerController();

  void _onDetect(BarcodeCapture capture) async {
    if (!_isScanning) return;
    if (capture.barcodes.isEmpty) return;
    
    final barcode = capture.barcodes.first.rawValue;
    if (barcode == null) return;

    // Provide haptic feedback for detection
    HapticFeedback.mediumImpact();
    
    setState(() => _isScanning = false);
    
    try {
      final product = await _productRepository.scanBarcode(barcode);
      if (product != null) {
        if (mounted) {
          Navigator.pushNamed(context, '/product_details', arguments: product).then((_) {
            setState(() => _isScanning = true);
          });
        }
      } else {
        // Product not found, navigate to submission
        if (mounted) {
          _controller.stop();
          Navigator.pushNamed(context, '/submit_product', arguments: barcode).then((_) {
             _controller.start();
             setState(() => _isScanning = true);
          });
        }
      }
    } catch (e) {
      _showError(e.toString());
      setState(() => _isScanning = true);
    }
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
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Feed
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          
          // Overlay: Modern Transparent Viewport
          _buildScannerOverlay(context),

          // Top Bar (Back button & Torch)
          Positioned(
            top: 40,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CircleAvatar(
                  backgroundColor: Colors.black.withOpacity(0.5),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                CircleAvatar(
                  backgroundColor: Colors.black.withOpacity(0.5),
                  child: IconButton(
                    icon: ValueListenableBuilder(
                      valueListenable: _controller,
                      builder: (context, state, child) {
                        return Icon(
                          state.torchState == TorchState.on ? Icons.flash_on : Icons.flash_off,
                          color: Colors.white,
                        );
                      },
                    ),
                    onPressed: () => _controller.toggleTorch(),
                  ),
                ),
              ],
            ),
          ),

          // Bottom Bar: Hint Text & Branding
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text(
                    'Align Barcode Within Frame',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset('assets/images/logo.png', height: 40, color: Colors.white.withOpacity(0.7)),
                    const SizedBox(width: 12),
                    Text(
                      'AI POWERED VERIFICATION',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 10,
                        letterSpacing: 2,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScannerOverlay(BuildContext context) {
    return Container(
      decoration: const ShapeDecoration(
        shape: ScannerOverlayShape(
          borderColor: Color(0xFFDAA520),
          borderRadius: 20,
          borderLength: 40,
          borderWidth: 8,
          cutOutSize: 280,
        ),
      ),
    );
  }
}

// Custom Painter for the rounded scan frame with cutout
class ScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final double borderLength;
  final double borderRadius;
  final double cutOutSize;

  const ScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 4.0,
    this.borderLength = 20.0,
    this.borderRadius = 0.0,
    this.cutOutSize = 250.0,
  });

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => Path();

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    return Path()..addRect(rect);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final backgroundPath = Path()..addRect(rect);
    final cutoutPath = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromCenter(center: rect.center, width: cutOutSize, height: cutOutSize),
        Radius.circular(borderRadius),
      ));

    final paint = Paint()
      ..color = Colors.black.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    canvas.drawPath(
      Path.combine(PathOperation.difference, backgroundPath, cutoutPath),
      paint,
    );

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth
      ..strokeCap = StrokeCap.round;

    final halfCutout = cutOutSize / 2;
    final center = rect.center;

    // Draw 4 corners
    // Top Left
    canvas.drawPath(
      Path()
        ..moveTo(center.dx - halfCutout, center.dy - halfCutout + borderLength)
        ..lineTo(center.dx - halfCutout, center.dy - halfCutout)
        ..lineTo(center.dx - halfCutout + borderLength, center.dy - halfCutout),
      borderPaint,
    );
    // Top Right
    canvas.drawPath(
      Path()
        ..moveTo(center.dx + halfCutout - borderLength, center.dy - halfCutout)
        ..lineTo(center.dx + halfCutout, center.dy - halfCutout)
        ..lineTo(center.dx + halfCutout, center.dy - halfCutout + borderLength),
      borderPaint,
    );
    // Bottom Left
    canvas.drawPath(
      Path()
        ..moveTo(center.dx - halfCutout, center.dy + halfCutout - borderLength)
        ..lineTo(center.dx - halfCutout, center.dy + halfCutout)
        ..lineTo(center.dx - halfCutout + borderLength, center.dy + halfCutout),
      borderPaint,
    );
    // Bottom Right
    canvas.drawPath(
      Path()
        ..moveTo(center.dx + halfCutout - borderLength, center.dy + halfCutout)
        ..lineTo(center.dx + halfCutout, center.dy + halfCutout)
        ..lineTo(center.dx + halfCutout, center.dy + halfCutout - borderLength),
      borderPaint,
    );
  }

  @override
  ShapeBorder scale(double t) => this;
}
