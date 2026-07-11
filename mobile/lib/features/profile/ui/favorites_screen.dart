import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/user_activity_repository.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final _activityRepository = UserActivityRepository();
  List<Map<String, dynamic>> _favorites = [];
  bool _isLoading = true;
  String _currentFilter = 'all';

  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  @override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  void _fetchFavorites() async {
    final isAuth = Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
    if (!isAuth) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      return;
    }

    setState(() => _isLoading = true);
    final favs = await _activityRepository.getFavorites();
    if (mounted) {
      Provider.of<AppStateProvider>(context, listen: false).setWatchlistCount(favs.length);
      setState(() {
        _favorites = favs;
        _isLoading = false;
      });
    }
  }

  void _removeFavorite(int favoriteId) async {
    final success = await _activityRepository.removeFromFavorites(favoriteId);
    if (success) {
      if (mounted) {
        Provider.of<AppStateProvider>(context, listen: false).decrementWatchlist();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Removed from watchlist'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: textDark,
          ),
        );
      }
      _fetchFavorites();
    }
  }

  List<Map<String, dynamic>> get _filteredFavorites {
    if (_currentFilter == 'all') return _favorites;
    return _favorites.where((f) => f['type'] == _currentFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Watchlist', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: _isLoading
                ? _buildLoading()
                : _filteredFavorites.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: _filteredFavorites.length,
                        itemBuilder: (context, index) {
                          return _buildFavoriteCard(_filteredFavorites[index]);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildFilterChip('all', 'All Items'),
          const SizedBox(width: 8),
          _buildFilterChip('stock', 'Stocks'),
          const SizedBox(width: 8),
          _buildFilterChip('product', 'Products'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _currentFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _currentFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? textDark : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isSelected ? textDark : divider),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : textMuted,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildFavoriteCard(Map<String, dynamic> fav) {
    final item = fav['item'];
    final isProduct = fav['type'] == 'product';
    final status = isProduct 
      ? item['status']?.toString().toLowerCase() 
      : item['status']?['status']?.toString().toLowerCase();

    bool isHalal = status == 'halal';
    bool isNonHalal = status == 'non-halal';
    Color statusColor = isHalal ? const Color(0xFF16A34A) : (isNonHalal ? Colors.red : const Color(0xFFD97706));
    Color badgeBg = isHalal ? const Color(0xFFDCFCE7) : (isNonHalal ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: badgeBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            isHalal ? Icons.check_circle_rounded : (isNonHalal ? Icons.cancel_rounded : Icons.help_rounded), 
            color: statusColor, 
            size: 24
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                isProduct ? item['name'] : item['symbol'],
                style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            isProduct ? (item['brand'] ?? 'Market Listed') : item['name'],
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: textMuted, fontSize: 13),
          ),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.favorite_rounded, color: Colors.redAccent, size: 22),
          onPressed: () => _removeFavorite(fav['id'] as int),
        ),
        onTap: () {
          if (isProduct) {
            Navigator.pushNamed(context, '/product_details', arguments: item);
          } else {
            Navigator.pushNamed(context, '/stock_details', arguments: item);
          }
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    final isAuth = Provider.of<AppStateProvider>(context, listen: false).isAuthenticated;
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: primaryGreen.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.favorite_outline_rounded, size: 40, color: primaryGreen),
            ),
            const SizedBox(height: 24),
            Text(
              isAuth ? 'Your Watchlist is Empty' : 'Login to view Watchlist',
              style: const TextStyle(fontSize: 20, color: textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              isAuth 
                  ? 'Add stocks or products to your watchlist\nto track their Shariah status and prices.'
                  : 'You must be logged in to save and track items in your watchlist.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: textMuted, height: 1.5, fontSize: 14),
            ),
            if (!isAuth) ...[
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: textDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Login / Register', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(child: CircularProgressIndicator(color: primaryGreen));
  }
}
