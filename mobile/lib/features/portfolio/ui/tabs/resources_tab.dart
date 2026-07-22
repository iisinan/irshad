import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class ResourcesTab extends StatefulWidget {
  const ResourcesTab({super.key});

  @override
  State<ResourcesTab> createState() => _ResourcesTabState();
}

class _ResourcesTabState extends State<ResourcesTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _resources = [];

  @override
  void initState() {
    super.initState();
    _fetchResources();
  }

  Future<void> _fetchResources() async {
    try {
      final response = await ApiService().get('resources');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _resources = response.data['data'] ?? [];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Failed to fetch resources. Status: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error loading resources: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.tryParse(urlString);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $urlString')),
        );
      }
    }
  }

  Widget _buildResourceCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    String? url,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: GestureDetector(
        onTap: () {
          if (url != null && url.isNotEmpty) {
            _launchUrl(url);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Resource URL not available')),
            );
          }
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.divider),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
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
                  color: color.withValues(alpha: 0.1),
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
                    Text(subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: context.textMuted, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: context.textMuted),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: TextStyle(color: context.haram)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _error = null;
                });
                _fetchResources();
              },
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    final videos = _resources.where((r) => r['type'] == 'video').toList();
    final documents = _resources.where((r) => r['type'] == 'document').toList();

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
          if (videos.isNotEmpty) ...[
            Text(
              'Featured Videos',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
            ),
            const SizedBox(height: 16),
            ...videos.map((v) => _buildResourceCard(
                  context,
                  title: v['title'] ?? 'Untitled Video',
                  subtitle: v['description'] ?? 'Video',
                  icon: Icons.play_circle_fill_rounded,
                  color: context.primary,
                  url: v['url'],
                )),
            const SizedBox(height: 16),
          ],
          if (documents.isNotEmpty) ...[
            Text(
              'Essential Documents',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.textDark),
            ),
            const SizedBox(height: 16),
            ...documents.map((d) => _buildResourceCard(
                  context,
                  title: d['title'] ?? 'Untitled Document',
                  subtitle: d['description'] ?? 'Document',
                  icon: Icons.picture_as_pdf_rounded,
                  color: context.haram,
                  url: d['url'],
                )),
          ],
        ],
      ),
    );
  }
}
