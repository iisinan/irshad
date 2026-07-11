import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state_provider.dart';
import '../data/user_activity_repository.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _activityRepository = UserActivityRepository();
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = true;
  String? _filter;

  // Theme Constants
  static const Color bgColor = Color(0xFFFAFAFA);
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color textDark = Color(0xFF111827);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  void _fetchHistory() async {
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
    final history = await _activityRepository.getHistory(action: _filter);
    setState(() {
      _history = history;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Activity History', style: TextStyle(fontWeight: FontWeight.w900, color: textDark, letterSpacing: -0.5)),
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: PopupMenuButton<String>(
              position: PopupMenuPosition.under,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              onSelected: (value) {
                setState(() => _filter = value == 'all' ? null : value);
                _fetchHistory();
              },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'all', child: Text('Show All')),
                const PopupMenuItem(value: 'scan', child: Text('Products Only')),
                const PopupMenuItem(value: 'check', child: Text('Stocks Only')),
              ],
              icon: const Icon(Icons.tune_rounded, color: textDark, size: 22),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryGreen))
          : _history.isEmpty
              ? _buildEmptyState()
              : _buildTimeline(),
    );
  }

  Widget _buildTimeline() {
    Map<String, List<Map<String, dynamic>>> grouped = {};
    for (var item in _history) {
      final createdAtStr = item['created_at']?.toString() ?? DateTime.now().toIso8601String();
      final date = DateTime.parse(createdAtStr).toLocal();
      final dateString = DateFormat('MMMM d, yyyy').format(date);
      grouped.putIfAbsent(dateString, () => []).add(item);
    }

    final dates = grouped.keys.toList();

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: dates.length,
      itemBuilder: (context, index) {
        final date = dates[index];
        final items = grouped[date]!;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12, top: 20),
              child: Text(
                date.toUpperCase(),
                style: const TextStyle(
                  color: textMuted,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            ...items.map((item) => _buildHistoryItem(item)).toList(),
          ],
        );
      },
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> item) {
    final detail = item['detail'];
    final isScan = item['action'] == 'scan';
    if (detail == null) return const SizedBox.shrink();

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
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            isScan ? Icons.qr_code_scanner_rounded : Icons.show_chart_rounded,
            size: 20,
            color: textMuted,
          ),
        ),
        title: Text(
          isScan ? detail['name'] : detail['symbol'],
          style: const TextStyle(fontWeight: FontWeight.w900, color: textDark, fontSize: 16),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            isScan ? 'Product Verification' : 'Market Screening',
            style: const TextStyle(color: textMuted, fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: divider),
        onTap: () {
          if (isScan) {
            Navigator.pushNamed(context, '/product_details', arguments: detail);
          } else {
            Navigator.pushNamed(context, '/stock_details', arguments: detail);
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
              child: const Icon(Icons.history_rounded, size: 40, color: primaryGreen),
            ),
            const SizedBox(height: 24),
            Text(
              isAuth ? 'No Activity Yet' : 'Login to view History',
              style: const TextStyle(fontSize: 20, color: textDark, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              isAuth 
                  ? 'Your scan and screening history will be\nsaved here for quick access.'
                  : 'You must be logged in to view your scan and screening history.',
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
}
