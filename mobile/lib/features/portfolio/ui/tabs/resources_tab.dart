import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class ResourcesTab extends StatelessWidget {
  const ResourcesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 24.0, bottom: 100.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Islamic Finance Academy',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.textDark),
          ),
          const SizedBox(height: 12),
          Text(
            'Learn the fundamentals of halal investing, shariah compliance, and how to purify your wealth.',
            style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5),
          ),
          const SizedBox(height: 32),
          
          Text(
            'Featured Videos',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
          ),
          const SizedBox(height: 16),
          _buildResourceCard(
            context,
            title: 'Introduction to Halal Investing',
            subtitle: '10 min video • Basics',
            icon: Icons.play_circle_fill_rounded,
            color: context.primary,
            isDocument: false,
          ),
          const SizedBox(height: 12),
          _buildResourceCard(
            context,
            title: 'How Zakat is Calculated on Stocks',
            subtitle: '15 min video • Advanced',
            icon: Icons.play_circle_fill_rounded,
            color: context.primary,
            isDocument: false,
          ),
          
          const SizedBox(height: 32),
          Text(
            'Essential Documents',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
          ),
          const SizedBox(height: 16),
          _buildResourceCard(
            context,
            title: 'AAOIFI Shariah Standards',
            subtitle: 'PDF • 45 pages',
            icon: Icons.picture_as_pdf_rounded,
            color: context.haram,
            isDocument: true,
          ),
          const SizedBox(height: 12),
          _buildResourceCard(
            context,
            title: 'Dividend Purification Guide',
            subtitle: 'PDF • 5 pages',
            icon: Icons.picture_as_pdf_rounded,
            color: context.haram,
            isDocument: true,
          ),
        ],
      ),
    );
  }

  Widget _buildResourceCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required bool isDocument}) {
    return GestureDetector(
      onTap: () {
        if (isDocument) {
          _showDocumentModal(context, title);
        } else {
          _showVideoModal(context, title);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(fontSize: 13, color: context.textMuted, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.textMuted),
          ],
        ),
      ),
    );
  }

  void _showVideoModal(BuildContext context, String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 250,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.play_circle_outline_rounded, color: Colors.white, size: 64),
                    const SizedBox(height: 12),
                    Text('Playing: $title', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark))),
                      IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'This is a placeholder for the video player. In a real scenario, this would host a YouTube player or a local video player widget.',
                    style: TextStyle(fontSize: 15, color: context.textMuted, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDocumentModal(BuildContext context, String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark)),
                        const SizedBox(height: 4),
                        Text('PDF Document', style: TextStyle(color: context.textMuted, fontSize: 13)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Divider(height: 1, color: context.divider),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Icon(Icons.picture_as_pdf_rounded, size: 80, color: context.divider),
                    const SizedBox(height: 24),
                    Text(
                      'Document viewer goes here.\n\nYou would typically use a package like flutter_pdfview to render the PDF file here.',
                      style: TextStyle(fontSize: 16, color: context.textMuted, height: 1.6),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.download_rounded, size: 18),
                label: const Text('Download PDF', style: TextStyle(fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.textDark,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
