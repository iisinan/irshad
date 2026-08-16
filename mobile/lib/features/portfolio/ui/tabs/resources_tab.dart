import 'package:flutter/material.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/api/api_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:hive/hive.dart';
import 'dart:convert';

class ResourcesTab extends StatefulWidget {
  const ResourcesTab({super.key});

  @override
  State<ResourcesTab> createState() => _ResourcesTabState();
}

class _ResourcesTabState extends State<ResourcesTab> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _resources = [];
  
  String _searchQuery = '';
  String _selectedFilter = 'all'; // 'all', 'video', 'document'

  @override
  void initState() {
    super.initState();
    _fetchResources();
  }

  Future<void> _fetchResources() async {
    // 1. Try cache first
    try {
      final box = await Hive.openBox('resourcesBox');
      final cachedStr = box.get('resources_data');
      if (cachedStr != null) {
        final Map<String, dynamic> cached = jsonDecode(cachedStr);
        final int expiry = cached['expiry'] ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          if (mounted) {
            setState(() {
              _resources = cached['data'] ?? [];
              _isLoading = false;
            });
          }
        }
      }
    } catch (_) {}

    // 2. Fetch live data silently
    try {
      // Pass search and type to API if backend supports it, but for now we filter locally
      // just like the web does with localforage, or maybe the web does server side search.
      // Actually web does server side search: `api.get('/resources', { params: { search, type: filter } })`
      // I'll implement local filtering here for simplicity since we fetched all before.
      final response = await ApiService().get('resources');
      if (response.statusCode == 200) {
        if (mounted) {
          final data = response.data['data'] ?? [];
          
          try {
            final box = await Hive.openBox('resourcesBox');
            await box.put('resources_data', jsonEncode({
              'data': data,
              'expiry': DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch
            }));
          } catch (_) {}

          setState(() {
            _resources = data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted && _resources.isEmpty) {
          setState(() {
            _error = 'Failed to fetch resources. Status: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted && _resources.isEmpty) {
        setState(() {
          _error = 'Error loading resources: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.tryParse(urlString);
    if (uri != null) {
      try {
        final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (!launched && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open $urlString')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open $urlString')),
          );
        }
      }
    }
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

    final filteredResources = _resources.where((r) {
      if (_selectedFilter != 'all') {
        if (r['type'] != _selectedFilter) return false;
      }
      if (_searchQuery.isNotEmpty) {
        final searchLower = _searchQuery.toLowerCase();
        final title = (r['title'] ?? '').toLowerCase();
        final scholar = (r['scholar'] ?? '').toLowerCase();
        final category = (r['category'] ?? '').toLowerCase();
        if (!title.contains(searchLower) && !scholar.contains(searchLower) && !category.contains(searchLower)) {
          return false;
        }
      }
      return true;
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 20.0, bottom: 100.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeaderBanner(context),
          const SizedBox(height: 24),
          _buildSearchAndFilters(context),
          const SizedBox(height: 24),
          
          if (filteredResources.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40.0),
                child: Column(
                  children: [
                    Icon(Icons.search_off_rounded, size: 48, color: context.textMuted.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    Text('No resources found matching your search.', style: TextStyle(color: context.textMuted, fontSize: 14)),
                  ],
                ),
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.75, // Taller than wide to fit content below thumbnail
              ),
              itemCount: filteredResources.length,
              itemBuilder: (context, index) {
                final r = filteredResources[index];
                return _buildResourceCard(context, r);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildHeaderBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [context.bg, context.primary.withValues(alpha: 0.05)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: context.bg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.divider),
              boxShadow: [BoxShadow(color: context.primary.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Icon(Icons.menu_book_rounded, color: context.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Islamic Finance Library', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                const SizedBox(height: 4),
                Text('Verified scholars • AAOIFI-aligned content', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(BuildContext context) {
    return Column(
      children: [
        // Search Input
        Container(
          height: 44,
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.divider),
          ),
          child: TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            style: TextStyle(fontSize: 14, color: context.textDark),
            decoration: InputDecoration(
              hintText: 'Search resources...',
              hintStyle: TextStyle(fontSize: 14, color: context.textMuted),
              prefixIcon: Icon(Icons.search_rounded, size: 18, color: context.textMuted),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Filter Buttons
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: context.bgAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: context.divider),
          ),
          child: Row(
            children: [
              _buildFilterButton('All', 'all'),
              _buildFilterButton('Videos', 'video'),
              _buildFilterButton('Docs', 'document'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterButton(String label, String value) {
    final isSelected = _selectedFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedFilter = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? context.bg : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: isSelected ? Border.all(color: Colors.black.withValues(alpha: 0.04)) : Border.all(color: Colors.transparent),
            boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))] : [],
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? context.textDark : context.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResourceCard(BuildContext context, dynamic r) {
    final isVideo = r['type'] == 'video';
    
    return GestureDetector(
      onTap: () {
        _showResourceModal(context, r);
      },
      child: Container(
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Media Area
            if (isVideo)
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (r['thumbnail'] != null)
                      Image.network(r['thumbnail'], fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(color: Colors.black),
                      )
                    else
                      Container(color: Colors.black),
                    
                    // Dark overlay
                    Container(color: Colors.black.withValues(alpha: 0.3)),
                    
                    // Play Button Overlay
                    Center(
                      child: Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                    
                    // Duration Pill
                    if (r['duration'] != null)
                      Positioned(
                        bottom: 8, right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(r['duration'].toString(), style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                      ),
                  ],
                ),
              )
            else
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [context.primary.withValues(alpha: 0.1), context.bgAlt],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border(bottom: BorderSide(color: context.divider)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.primary.withValues(alpha: 0.2)),
                        ),
                        child: Icon(Icons.picture_as_pdf_rounded, color: context.primary, size: 20),
                      ),
                      const SizedBox(height: 8),
                      Text('PDF DOC', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.primary, letterSpacing: 0.5)),
                    ],
                  ),
                ),
              ),

            // Content Area
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          (r['category']?.toString() ?? 'Gen').toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: context.primary, letterSpacing: 0.5),
                        ),
                      ),
                      Icon(isVideo ? Icons.play_circle_outline_rounded : Icons.download_rounded, size: 14, color: context.textMuted),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    r['title'] ?? 'Untitled',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textDark, height: 1.2),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        width: 16, height: 16,
                        decoration: BoxDecoration(
                          color: context.divider,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            (r['scholar']?.toString() ?? '?')[0].toUpperCase(),
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.textDark),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          r['scholar'] ?? 'Unknown',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.textMuted),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showResourceModal(BuildContext context, dynamic r) {
    final isVideo = r['type'] == 'video';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: context.divider)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r['title'] ?? 'Untitled',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark, height: 1.2),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'By ${r['scholar'] ?? 'Unknown'}',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: context.textMuted),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: context.textMuted),
                      onPressed: () => Navigator.pop(context),
                      style: IconButton.styleFrom(backgroundColor: context.bgAlt),
                    ),
                  ],
                ),
              ),
              
              // Content Area
              Expanded(
                child: Container(
                  color: context.bgAlt,
                  child: isVideo ? _VideoModalPlayer(r: r) : _buildDocModalContent(context, r),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Replaced with _VideoModalPlayer

  Widget _buildDocModalContent(BuildContext context, dynamic r) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          color: context.bg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Document Viewer', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
              ElevatedButton.icon(
                onPressed: () {
                  final url = r['url'];
                  if (url != null && url.toString().isNotEmpty) _launchUrl(url);
                },
                icon: const Icon(Icons.download_rounded, size: 16, color: Colors.white),
                label: const Text('Download PDF', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: context.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.picture_as_pdf_rounded, color: context.primary, size: 40),
                ),
                const SizedBox(height: 24),
                Text('PDF Document Ready', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.textDark)),
                const SizedBox(height: 8),
                Text('Tap the button above to view or download.', style: TextStyle(color: context.textMuted)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _VideoModalPlayer extends StatefulWidget {
  final dynamic r;
  const _VideoModalPlayer({Key? key, required this.r}) : super(key: key);

  @override
  State<_VideoModalPlayer> createState() => _VideoModalPlayerState();
}

class _VideoModalPlayerState extends State<_VideoModalPlayer> {
  YoutubePlayerController? _controller;

  String? _extractVideoId(String url) {
    final RegExp regExp = RegExp(
      r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
    );
    final Match? match = regExp.firstMatch(url);
    return match?.group(1);
  }

  @override
  void initState() {
    super.initState();
    final url = widget.r['url'];
    if (url != null) {
      final regExp = RegExp(r'.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*');
      final match = regExp.firstMatch(url);
      final videoId = (match != null && match.group(1)?.length == 11) ? match.group(1) : null;
      
      if (videoId != null) {
        _controller = YoutubePlayerController.fromVideoId(
          videoId: videoId,
          autoPlay: true,
          params: const YoutubePlayerParams(
            showControls: true,
            mute: false,
            showFullscreenButton: true,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 220,
          child: _controller != null 
            ? YoutubePlayer(
                controller: _controller!,
              )
            : Container(
                color: Colors.black,
                child: const Center(
                  child: Text('Invalid video URL', style: TextStyle(color: Colors.white)),
                ),
              ),
        ),
        Expanded(
          child: Container(
            color: context.bg,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark)),
                const SizedBox(height: 12),
                Text(
                  'This is an educational video provided by our Islamic Finance partners. Please note that the content is for educational purposes and should not be taken as direct financial advice.',
                  style: TextStyle(fontSize: 14, color: context.textMuted, height: 1.6),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
