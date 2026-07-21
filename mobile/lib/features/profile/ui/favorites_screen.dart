import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/user_activity_repository.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
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
@override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  Future<void> _fetchFavorites() async {
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
          SnackBar(
            content: Text('Removed from watchlist'), 
            behavior: SnackBarBehavior.floating,
            backgroundColor: context.textDark,
          ),
        );
      }
      _fetchFavorites();
    }
  }

  void _toggleAlert(int favoriteId, bool currentWhatsapp, bool currentEmail, String alertType) async {
    bool newWhatsapp = currentWhatsapp;
    bool newEmail = currentEmail;
    
    if (alertType == 'whatsapp') newWhatsapp = !newWhatsapp;
    if (alertType == 'email') newEmail = !newEmail;
    
    final success = await _activityRepository.updateFavoriteAlerts(favoriteId, newWhatsapp, newEmail);
    if (success) {
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
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text('Watchlist', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
        backgroundColor: context.bg,
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
                    : RefreshIndicator(
                        onRefresh: _fetchFavorites,
                        color: context.primary,
                        backgroundColor: context.bgAlt,
                        child: ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
                          itemCount: _filteredFavorites.length,
                          itemBuilder: (context, index) {
                            return _buildFavoriteCard(_filteredFavorites[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: _filteredFavorites.isEmpty && !_isLoading ? null : FloatingActionButton(
        onPressed: () {
          _showAddBottomSheet(context);
        },
        backgroundColor: context.textDark,
        child: const Icon(Icons.add_rounded, color: Colors.white),
      ),
    );
  }

  void _showAddBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: context.bgAlt,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Add to Watchlist',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark),
            ),
            const SizedBox(height: 8),
            Text(
              'What would you like to track?',
              style: TextStyle(color: context.textMuted, fontSize: 14),
            ),
            const SizedBox(height: 24),
            _buildAddOption(
              icon: Icons.storefront_rounded,
              title: 'Search NGX Stocks',
              subtitle: 'Track Nigerian stocks & their Shariah status',
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/market');
              },
            ),
            const SizedBox(height: 12),
            _buildAddOption(
              icon: Icons.qr_code_scanner_rounded,
              title: 'Scan a Product',
              subtitle: 'Check if a food item is Halal',
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/scan');
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildAddOption({required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.divider),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: context.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(color: context.textMuted, fontSize: 13)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.textMuted),
          ],
        ),
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
          color: isSelected ? context.textDark : context.bgAlt,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: isSelected ? context.textDark : context.divider.withValues(alpha: 0.5)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : context.textMuted,
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
    Color statusColor = isHalal ? context.halal : (isNonHalal ? context.haram : context.questionable);
    Color badgeBg = isHalal ? context.halalBg : (isNonHalal ? context.haramBg : context.questionableBg);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
                style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 8),
              child: Text(
                isProduct ? (item['brand'] ?? 'Market Listed') : item['name'],
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: context.textMuted, fontSize: 13),
              ),
            ),
            Row(
              children: [
                _buildAlertButton(
                  icon: Icons.email_rounded,
                  isActive: fav['alert_email'] == true,
                  onTap: () => _toggleAlert(fav['id'], fav['alert_whatsapp'] == true, fav['alert_email'] == true, 'email'),
                ),
                const SizedBox(width: 8),
                _buildAlertButton(
                  icon: Icons.chat_bubble_rounded, // Assuming WhatsApp representation
                  isActive: fav['alert_whatsapp'] == true,
                  onTap: () => _toggleAlert(fav['id'], fav['alert_whatsapp'] == true, fav['alert_email'] == true, 'whatsapp'),
                ),
              ],
            )
          ],
        ),
        trailing: IconButton(
          icon: Icon(Icons.favorite_rounded, color: context.haram, size: 22),
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

  Widget _buildAlertButton({required IconData icon, required bool isActive, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: isActive ? context.primary : context.accentSoft,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isActive ? context.primary : Colors.transparent),
        ),
        child: Icon(
          icon,
          size: 16,
          color: isActive ? Colors.white : context.textMuted,
        ),
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
                color: context.primary.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.favorite_outline_rounded, size: 40, color: context.primary),
            ),
            const SizedBox(height: 24),
            Text(
              isAuth ? 'Your Watchlist is Empty' : 'Login to view Watchlist',
              style: TextStyle(fontSize: 20, color: context.textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              isAuth 
                  ? 'Add stocks or products to your watchlist\nto track their Shariah status and prices.'
                  : 'You must be logged in to save and track items in your watchlist.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textMuted, height: 1.5, fontSize: 14),
            ),
            if (!isAuth) ...[
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.textDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Login / Register', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
            ] else ...[
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => _showAddBottomSheet(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Add Item to Watchlist', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Center(child: CircularProgressIndicator(color: context.primary));
  }
}
