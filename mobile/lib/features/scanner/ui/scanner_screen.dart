import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Scanner', style: TextStyle(color: context.textDark, fontWeight: FontWeight.w900)),
        backgroundColor: context.bg,
        elevation: 0,
        iconTheme: IconThemeData(color: context.textDark),
      ),
      body: Center(
        child: Text('Scanner Screen', style: TextStyle(color: context.textDark)),
      ),
    );
  }
}
