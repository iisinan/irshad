const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

// 1. Add pagination variables and API calls
file = file.replace(/List<dynamic> _notifications = \[\];\n  String _activeCategory = 'all';/,
  "List<dynamic> _notifications = [];\n  String _activeCategory = 'all';\n  int _currentPage = 1;\n  int _lastPage = 1;\n  bool _isLoadingMore = false;\n  final ScrollController _scrollController = ScrollController();\n");

// Inside initState, listen to scroll for infinite scroll
file = file.replace(/void initState\(\) \{\n    super.initState\(\);\n    _fetchInbox\(\);\n  \}/,
  "void initState() {\n    super.initState();\n    _scrollController.addListener(_onScroll);\n    _fetchInbox();\n  }\n\n  @override\n  void dispose() {\n    _scrollController.dispose();\n    super.dispose();\n  }\n\n  void _onScroll() {\n    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && !_isLoadingMore && _currentPage < _lastPage) {\n      _loadMore();\n    }\n  }");

// Fix _fetchInbox logic
file = file.replace(/Future<void> _fetchInbox\(\) async \{/, 
  "Future<void> _fetchInbox({bool loadMore = false}) async {\n    if (!loadMore) {\n      setState(() { _isLoading = true; _currentPage = 1; });\n    }\n");

file = file.replace(/final response = await ApiService\(\)\.get\('notifications\/inbox', queryParameters: _activeCategory != 'all' \? \{'category': _activeCategory\} : null\);/,
  "final response = await ApiService().get('notifications/inbox', queryParameters: {\n        if (_activeCategory != 'all') 'category': _activeCategory,\n        'page': _currentPage,\n      });");

file = file.replace(/final data = response.data\['data'\] \?\? \[\];/, 
  "final data = response.data['data'] ?? [];\n          final pagination = response.data['pagination'];");

file = file.replace(/setState\(\(\) \{\n            _notifications = data;\n            _isLoading = false;\n          \}\);/,
  "setState(() {\n            if (loadMore) {\n              _notifications.addAll(data);\n              _isLoadingMore = false;\n            } else {\n              _notifications = data;\n              _isLoading = false;\n            }\n            if (pagination != null) {\n              _lastPage = pagination['last_page'];\n            }\n          });");

file = file.replace(/if \(mounted && _notifications.isEmpty\) \{\n          setState\(\(\) \{\n            _error = 'Failed to fetch inbox';\n            _isLoading = false;\n          \}\);\n        \}/,
  "if (mounted) {\n          setState(() {\n            if (_notifications.isEmpty) _error = 'Failed to fetch inbox';\n            _isLoading = false;\n            _isLoadingMore = false;\n          });\n        }");

file = file.replace(/if \(mounted && _notifications.isEmpty\) \{\n        setState\(\(\) \{\n          _error = 'Error loading inbox';\n          _isLoading = false;\n        \}\);\n      \}/,
  "if (mounted) {\n        setState(() {\n          if (_notifications.isEmpty) _error = 'Error loading inbox';\n          _isLoading = false;\n          _isLoadingMore = false;\n        });\n      }");

// Add _loadMore method
file = file.replace(/Future<void> _markAsRead\(int id\) async \{/,
  "Future<void> _loadMore() async {\n    setState(() {\n      _isLoadingMore = true;\n      _currentPage++;\n    });\n    await _fetchInbox(loadMore: true);\n  }\n\n  Future<void> _markAsRead(int id) async {");

// Add _markAllAsRead, _archive, _delete methods
file = file.replace(/Widget _getIconForCategory/,
  `Future<void> _markAllAsRead() async {
    try {
      await ApiService().put('notifications/read-all', {});
      setState(() {
        for (var n in _notifications) {
          n['read_at'] = DateTime.now().toIso8601String();
        }
      });
    } catch (_) {}
  }

  Future<void> _archiveNotification(int id) async {
    try {
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
      await ApiService().put('notifications/$id/archive', {});
    } catch (_) {}
  }

  Future<void> _deleteNotification(int id) async {
    try {
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
      await ApiService().delete('notifications/$id');
    } catch (_) {}
  }

  Widget _getIconForCategory`);

// Replace SingleChildScrollView inside Column with Expanded -> ListView so infinite scroll works
// Wait, the structure in build() is:
// return Column([
//   Padding(Row([ Irshad Digest Settings ])),
//   SingleChildScrollView(categories),
//   if (empty) Center() else ListView.builder(shrinkWrap: true, physics: NeverScrollableScrollPhysics())
// ])
// We should use an outer SingleChildScrollView or change ListView to Expanded.
// Since UpdatesInboxTab is inside a bottom sheet container which is a Column... wait, is the bottom sheet scrollable?
// The bottom sheet container might be `isScrollControlled: true` but limits height to something.

fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', file);
console.log("Patched logic!");
