import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../providers/admin_provider.dart';

class AdminFinancesScreen extends StatefulWidget {
  const AdminFinancesScreen({super.key});

  @override
  State<AdminFinancesScreen> createState() => _AdminFinancesScreenState();
}

class _AdminFinancesScreenState extends State<AdminFinancesScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _statusFilter = 'all';
  String _planFilter = 'all';
  int? _verifyingId;

  final NumberFormat _ngnFmt = NumberFormat('#,##0.##', 'en_NG');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _reload(page: 1);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _reload({int? page}) async {
    final provider = context.read<AdminProvider>();
    await provider.fetchFinances(
      page: page ?? provider.financesPage,
      search: _searchCtrl.text,
      status: _statusFilter,
      plan: _planFilter,
    );
  }

  String _fmtNaira(dynamic value) {
    final num val = value is num ? value : (double.tryParse(value?.toString() ?? '0') ?? 0);
    return '₦${_ngnFmt.format(val)}';
  }

  String _fmtDate(dynamic iso) {
    if (iso == null) return '—';
    final parsed = DateTime.tryParse(iso.toString())?.toLocal();
    if (parsed == null) return iso.toString();
    return DateFormat('dd MMM yyyy, HH:mm').format(parsed);
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'success':
        return const Color(0xFF059669);
      case 'pending':
        return const Color(0xFFD97706);
      case 'failed':
        return const Color(0xFFDC2626);
      default:
        return Colors.grey;
    }
  }

  Future<void> _handleVerify(Map<String, dynamic> tx) async {
    final id = (tx['id'] as num?)?.toInt();
    if (id == null || _verifyingId == id) return;
    setState(() => _verifyingId = id);
    try {
      final res = await context.read<AdminProvider>().verifyFinanceTransaction(id);
      if (!mounted) return;
      final msg = res?['message']?.toString() ?? 'Verification complete.';
      final isFailed = res?['status'] == 'failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg, style: const TextStyle(fontWeight: FontWeight.w700)),
          backgroundColor: isFailed ? Colors.red.shade700 : const Color(0xFF059669),
        ),
      );
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification failed: $e'),
          backgroundColor: Colors.red.shade700,
        ),
      );
    } finally {
      if (mounted) setState(() => _verifyingId = null);
    }
  }

  void _showTxDetails(Map<String, dynamic> tx) {
    final user = tx['user'] as Map<String, dynamic>? ?? {};
    final plan = tx['plan'] as Map<String, dynamic>? ?? {};
    final status = (tx['status'] ?? 'pending').toString();
    final payload = tx['raw_payload'];
    final payloadText = payload != null
        ? const JsonEncoder.withIndent('  ').convert(payload)
        : 'No raw gateway payload recorded.';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.82),
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 28),
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: context.divider, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Payment #${tx['id'] ?? ''}',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.textDark),
                  ),
                  _statusPill(status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                tx['transaction_ref']?.toString() ?? '',
                style: TextStyle(fontSize: 12, color: context.textMuted, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              _detailRow('User', '${user['name'] ?? '—'} (${user['email'] ?? '—'})'),
              _detailRow('Plan & Cycle', '${plan['name'] ?? '—'} • ${tx['billing_cycle'] ?? '—'}'),
              _detailRow('Amount', _fmtNaira(tx['amount_ngn'] ?? ((tx['amount_kobo'] ?? 0) / 100))),
              _detailRow('Gateway & Type', '${tx['gateway'] ?? 'squad'} • ${tx['type'] ?? 'initial'}'),
              if (tx['gateway_ref'] != null) _detailRow('Gateway Ref', tx['gateway_ref'].toString()),
              _detailRow('Paid At', _fmtDate(tx['paid_at'] ?? tx['created_at'])),
              if (status == 'pending' && (tx['gateway'] ?? 'squad') == 'squad') ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _handleVerify(tx);
                    },
                    icon: const Icon(Icons.verified_user_rounded, size: 18),
                    label: const Text('Verify with Squad', style: TextStyle(fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                'GATEWAY PAYLOAD',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted),
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.bgAlt,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.divider),
                ),
                child: SelectableText(
                  payloadText,
                  style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: context.textDark),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted)),
          ),
          Expanded(
            child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textDark)),
          ),
        ],
      ),
    );
  }

  Widget _statusPill(String status) {
    final c = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: c.withValues(alpha: 0.35)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: c),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final summary = provider.financesSummary;
    final txs = provider.financesTransactions;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: Text(
          'Finances & Payments',
          style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5),
        ),
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.textDark, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.textDark),
            onPressed: () => _reload(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _reload(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
          children: [
            // KPI Summary Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.55,
              children: [
                _kpiCard(
                  'Total Revenue',
                  _fmtNaira(summary['total_revenue_ngn'] ?? 0),
                  '${summary['active_paid_subs'] ?? 0} active paid subs',
                  Icons.account_balance_wallet_rounded,
                  context.primary,
                ),
                _kpiCard(
                  'Last 30 Days',
                  _fmtNaira(summary['revenue_30d_ngn'] ?? 0),
                  '${summary['paying_users_count'] ?? 0} paying users',
                  Icons.trending_up_rounded,
                  const Color(0xFF059669),
                ),
                _kpiCard(
                  'Avg Ticket',
                  _fmtNaira(summary['avg_ticket_ngn'] ?? 0),
                  '${summary['success_rate'] ?? 0}% success rate',
                  Icons.bar_chart_rounded,
                  const Color(0xFF7C3AED),
                ),
                _kpiCard(
                  'Transactions',
                  '${summary['success_count'] ?? 0} / ${summary['pending_count'] ?? 0} / ${summary['failed_count'] ?? 0}',
                  'Success • Pending • Failed',
                  Icons.credit_card_rounded,
                  const Color(0xFFD97706),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // Search box
            TextField(
              controller: _searchCtrl,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _reload(page: 1),
              decoration: InputDecoration(
                hintText: 'Search user, email, or reference...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          _reload(page: 1);
                        },
                      )
                    : null,
                filled: true,
                fillColor: context.bgAlt,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.divider),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.divider),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Status & Plan Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ...['all', 'success', 'pending', 'failed'].map((s) {
                    final selected = _statusFilter == s;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          s == 'all' ? 'All Status' : s[0].toUpperCase() + s.substring(1),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                        selected: selected,
                        onSelected: (_) {
                          setState(() => _statusFilter = s);
                          _reload(page: 1);
                        },
                      ),
                    );
                  }),
                  const SizedBox(width: 6),
                  ...[('all', 'All Plans'), ('pro', 'Rawdha'), ('max', 'Noor')].map((entry) {
                    final selected = _planFilter == entry.$1;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(entry.$2, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        selected: selected,
                        onSelected: (_) {
                          setState(() => _planFilter = entry.$1);
                          _reload(page: 1);
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),

            const SizedBox(height: 14),

            if (provider.financesError != null)
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.25)),
                ),
                child: Text(
                  provider.financesError!,
                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),

            if (provider.isLoadingFinances && txs.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator(color: context.primary)),
              )
            else if (txs.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: context.bgAlt,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.divider),
                ),
                child: Column(
                  children: [
                    Icon(Icons.receipt_long_rounded, size: 36, color: context.textMuted),
                    const SizedBox(height: 10),
                    Text(
                      'No payment transactions match your filters.',
                      style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              )
            else
              ...txs.map((tx) {
                final user = tx['user'] as Map<String, dynamic>? ?? {};
                final plan = tx['plan'] as Map<String, dynamic>? ?? {};
                final status = (tx['status'] ?? 'pending').toString();
                final ref = (tx['transaction_ref'] ?? '').toString();
                final txId = (tx['id'] as num?)?.toInt();

                return GestureDetector(
                  onTap: () => _showTxDetails(tx),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.bgAlt,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user['name']?.toString() ?? 'Deleted User',
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: context.textDark),
                                  ),
                                  Text(
                                    user['email']?.toString() ?? 'User #${tx['user_id']}',
                                    style: TextStyle(fontSize: 12, color: context.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              _fmtNaira(tx['amount_ngn'] ?? ((tx['amount_kobo'] ?? 0) / 100)),
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.textDark),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${plan['name'] ?? 'Plan'} • ${tx['billing_cycle'] ?? '—'} • ${tx['type'] ?? 'initial'}',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.textMuted),
                            ),
                            _statusPill(status),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: ref));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Reference copied'), duration: Duration(seconds: 1)),
                                );
                              },
                              child: Row(
                                children: [
                                  Text(
                                    ref,
                                    style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: context.textMuted),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(Icons.copy_rounded, size: 12, color: context.textMuted),
                                ],
                              ),
                            ),
                            Text(
                              _fmtDate(tx['paid_at'] ?? tx['created_at']),
                              style: TextStyle(fontSize: 11, color: context.textMuted),
                            ),
                          ],
                        ),
                        if (status == 'pending' && (tx['gateway'] ?? 'squad') == 'squad') ...[
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: OutlinedButton.icon(
                              onPressed: _verifyingId == txId ? null : () => _handleVerify(tx),
                              icon: const Icon(Icons.verified_user_rounded, size: 14),
                              label: Text(_verifyingId == txId ? 'Verifying...' : 'Verify with Squad'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF059669),
                                side: BorderSide(color: const Color(0xFF059669).withValues(alpha: 0.4)),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),

            if (provider.financesLastPage > 1)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: provider.financesPage > 1
                          ? () => _reload(page: provider.financesPage - 1)
                          : null,
                      icon: const Icon(Icons.chevron_left_rounded),
                      label: const Text('Previous'),
                    ),
                    Text(
                      'Page ${provider.financesPage} of ${provider.financesLastPage}',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted),
                    ),
                    TextButton.icon(
                      onPressed: provider.financesPage < provider.financesLastPage
                          ? () => _reload(page: provider.financesPage + 1)
                          : null,
                      icon: const Icon(Icons.chevron_right_rounded),
                      label: const Text('Next'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _kpiCard(String title, String value, String sub, IconData icon, Color accent) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.textMuted),
                ),
              ),
              Icon(icon, size: 16, color: accent),
            ],
          ),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: context.textDark),
          ),
          Text(
            sub,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
