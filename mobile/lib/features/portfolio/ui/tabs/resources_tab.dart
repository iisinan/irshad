import 'package:flutter/material.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import 'package:video_player/video_player.dart';
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

    return Padding(
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
                        errorBuilder: (context, error, stackTrace) => Container(color: const Color(0xFF0F172A)),
                      )
                    else
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                      ),
                    
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
  const _VideoModalPlayer({required this.r});

  @override
  State<_VideoModalPlayer> createState() => _VideoModalPlayerState();
}

class _VideoModalPlayerState extends State<_VideoModalPlayer> {
  YoutubePlayerController? _youtubeController;
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _showControls = true;
  String? _videoError;
  String? _resolvedUrl;

  String? _extractYoutubeId(String url) {
    final regExp = RegExp(
      r'(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
    );
    return regExp.firstMatch(url)?.group(1);
  }

  /// Upgrade non-local http:// media URLs (e.g. legacy cached Railway URLs) to https:// for Android/iOS playback.
  String _normalizeMediaUrl(String rawUrl) {
    final trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') &&
        !RegExp(r'^http://(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?/', caseSensitive: false).hasMatch(trimmed)) {
      return 'https://${trimmed.substring(7)}';
    }
    return trimmed;
  }

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  void _initPlayer() {
    final rawUrl = widget.r['url']?.toString();
    if (rawUrl == null || rawUrl.trim().isEmpty) {
      _videoError = 'No video URL provided.';
      return;
    }

    final normalizedUrl = _normalizeMediaUrl(rawUrl);
    _resolvedUrl = normalizedUrl;

    final youtubeId = _extractYoutubeId(normalizedUrl);
    if (youtubeId != null) {
      _youtubeController = YoutubePlayerController.fromVideoId(
        videoId: youtubeId,
        autoPlay: true,
        params: const YoutubePlayerParams(
          showControls: true,
          mute: false,
          showFullscreenButton: true,
        ),
      );
      return;
    }

    final uri = Uri.tryParse(normalizedUrl);
    if (uri == null || !uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
      _videoError = 'Invalid video URL';
      return;
    }

    _startNativeVideo(uri);
  }

  Future<void> _startNativeVideo(Uri uri) async {
    final oldController = _videoController;
    _videoController = VideoPlayerController.networkUrl(uri);
    await oldController?.dispose();

    if (mounted) {
      setState(() {
        _isVideoInitialized = false;
        _videoError = null;
      });
    }

    try {
      await _videoController!.initialize();
      await _videoController!.play();
      if (mounted) {
        setState(() {
          _isVideoInitialized = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _videoError = 'Could not load video.';
        });
      }
    }
  }

  Future<void> _openExternally() async {
    if (_resolvedUrl == null) return;
    final uri = Uri.tryParse(_resolvedUrl!);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openFullscreen() async {
    final controller = _videoController;
    if (controller == null) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _FullscreenVideoPage(
          controller: controller,
          formatDuration: _formatDuration,
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(1, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (d.inHours > 0) {
      return '${d.inHours}:${d.inMinutes.remainder(60).toString().padLeft(2, '0')}:$seconds';
    }
    return '$minutes:$seconds';
  }

  @override
  void dispose() {
    _youtubeController?.close();
    _videoController?.dispose();
    super.dispose();
  }

  Widget _buildNativePlayerArea() {
    if (_videoError != null) {
      return Container(
        color: Colors.black,
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white70, size: 32),
              const SizedBox(height: 8),
              Text(_videoError!, style: const TextStyle(color: Colors.white), textAlign: TextAlign.center),
              if (_resolvedUrl != null) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () {
                        final uri = Uri.tryParse(_resolvedUrl!);
                        if (uri != null) _startNativeVideo(uri);
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 16, color: Colors.white),
                      label: const Text('Retry', style: TextStyle(color: Colors.white)),
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white38)),
                    ),
                    TextButton.icon(
                      onPressed: _openExternally,
                      icon: const Icon(Icons.open_in_new_rounded, size: 16, color: Colors.white70),
                      label: const Text('Open Externally', style: TextStyle(color: Colors.white70)),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      );
    }

    final controller = _videoController;
    if (controller == null || !_isVideoInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    return Container(
      color: Colors.black,
      child: ValueListenableBuilder<VideoPlayerValue>(
        valueListenable: controller,
        builder: (context, value, _) {
          final isMuted = value.volume == 0;
          return GestureDetector(
            onTap: () => setState(() => _showControls = !_showControls),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Center(
                  child: AspectRatio(
                    aspectRatio: value.aspectRatio > 0 ? value.aspectRatio : 16 / 9,
                    child: VideoPlayer(controller),
                  ),
                ),
                if (value.isBuffering)
                  const Center(child: CircularProgressIndicator(color: Colors.white70)),
                if (_showControls) ...[
                  GestureDetector(
                    onTap: () {
                      if (value.isPlaying) {
                        controller.pause();
                      } else {
                        if (value.position >= value.duration && value.duration > Duration.zero) {
                          controller.seekTo(Duration.zero);
                        }
                        controller.play();
                      }
                    },
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(12, 8, 8, 4),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [Colors.black.withValues(alpha: 0.8), Colors.transparent],
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          VideoProgressIndicator(
                            controller,
                            allowScrubbing: true,
                            colors: VideoProgressColors(
                              playedColor: context.primary,
                              bufferedColor: Colors.white38,
                              backgroundColor: Colors.white24,
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                '${_formatDuration(value.position)} / ${_formatDuration(value.duration)}',
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                              const Spacer(),
                              IconButton(
                                icon: Icon(
                                  isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                onPressed: () => controller.setVolume(isMuted ? 1.0 : 0.0),
                                visualDensity: VisualDensity.compact,
                              ),
                              IconButton(
                                icon: const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 22),
                                onPressed: _openFullscreen,
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final description = widget.r['description']?.toString().trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 240,
          child: _youtubeController != null
              ? YoutubePlayer(controller: _youtubeController!)
              : _buildNativePlayerArea(),
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
                  (description != null && description.isNotEmpty) ? description : 'This is an Educational Video',
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

class _FullscreenVideoPage extends StatefulWidget {
  final VideoPlayerController controller;
  final String Function(Duration) formatDuration;

  const _FullscreenVideoPage({
    required this.controller,
    required this.formatDuration,
  });

  @override
  State<_FullscreenVideoPage> createState() => _FullscreenVideoPageState();
}

class _FullscreenVideoPageState extends State<_FullscreenVideoPage> {
  bool _showControls = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: ValueListenableBuilder<VideoPlayerValue>(
          valueListenable: widget.controller,
          builder: (context, value, _) {
            return GestureDetector(
              onTap: () => setState(() => _showControls = !_showControls),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Center(
                    child: AspectRatio(
                      aspectRatio: value.aspectRatio > 0 ? value.aspectRatio : 16 / 9,
                      child: VideoPlayer(widget.controller),
                    ),
                  ),
                  if (_showControls) ...[
                    Positioned(
                      top: 8,
                      right: 8,
                      child: IconButton(
                        icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white, size: 28),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => value.isPlaying ? widget.controller.pause() : widget.controller.play(),
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.55),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 38,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 16,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          VideoProgressIndicator(
                            widget.controller,
                            allowScrubbing: true,
                            colors: const VideoProgressColors(
                              playedColor: Colors.white,
                              bufferedColor: Colors.white38,
                              backgroundColor: Colors.white24,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '${widget.formatDuration(value.position)} / ${widget.formatDuration(value.duration)}',
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
