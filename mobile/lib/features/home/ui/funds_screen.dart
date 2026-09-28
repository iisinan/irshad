import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../stocks/data/stock_repository.dart';

class FundsScreen extends StatefulWidget {
  const FundsScreen({super.key});

  @override
  State<FundsScreen> createState() => _FundsScreenState();
}

class _FundsScreenState extends State<FundsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final StockRepository _stockRepo = StockRepository();

  String _searchQuery = '';
  String _activeType = 'All';

  List<Map<String, dynamic>> _funds = [];
  bool _isLoading = true;

  static const List<String> _allTypes = [
    'All',
    'Fixed Income',
    'Balanced',
    'Equity',
    'ETF',
    'Endowment',
    'Commodities',
    'Ethical',
  ];

  @override
  void initState() {
    super.initState();
    _fetchFunds();
  }

  Future<void> _fetchFunds() async {
    try {
      final res = await _stockRepo.getNgxStocksPaginated(1);
      final List<dynamic> data = res['data'] ?? [];

      final mutualFunds = data
          .where((s) => s['asset_class'] == 'mutual_fund')
          .map((s) => s as Map<String, dynamic>)
          .toList();

      if (mounted) {
        setState(() {
          _funds = mutualFunds;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching mutual funds: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Color _typeColor(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income':
        return context.primary;
      case 'Balanced':
        return context.halal;
      case 'Equity':
        return context.primary;
      case 'ETF':
        return context.questionable;
      case 'Endowment':
        return context.questionable;
      case 'Commodities':
        return context.questionable;
      case 'Ethical':
        return context.halal;
      default:
        return context.primary;
    }
  }

  Color _typeBg(BuildContext context, String type) {
    switch (type) {
      case 'Fixed Income':
        return context.primary.withValues(alpha: 0.1);
      case 'Balanced':
        return context.halalBg;
      case 'Equity':
        return context.primary.withValues(alpha: 0.14);
      case 'ETF':
        return context.questionableBg;
      case 'Endowment':
        return context.questionableBg;
      case 'Commodities':
        return context.questionableBg;
      case 'Ethical':
        return context.halalBg;
      default:
        return context.primary.withValues(alpha: 0.1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _funds.where((fund) {
      final q = _searchQuery.toLowerCase();
      final fd = (fund['fund_details'] as Map<String, dynamic>?) ?? {};
      final provider = (fd['provider']?.toString() ?? '').toLowerCase();
      final name = (fund['name']?.toString() ?? '').toLowerCase();
      final strategy = (fd['investment_components_target']?.toString() ?? '')
          .toLowerCase();

      final matchSearch =
          q.isEmpty ||
          name.contains(q) ||
          provider.contains(q) ||
          strategy.contains(q);

      final sector = fund['sector']?.toString() ?? 'Balanced';
      final matchType = _activeType == 'All' || sector == _activeType;

      return matchSearch && matchType;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Container(
            decoration: BoxDecoration(
              color: context.bgAlt,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.divider),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              style: TextStyle(color: context.textDark, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search funds, providers, or details...',
                hintStyle: TextStyle(color: context.textMuted, fontSize: 14),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.textMuted,
                  size: 20,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ),

        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _allTypes.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final type = _allTypes[i];
              final isActive = _activeType == type;
              final color = type == 'All'
                  ? context.primary
                  : _typeColor(context, type);
              final bg = type == 'All'
                  ? context.primary.withValues(alpha: 0.1)
                  : _typeBg(context, type);
              return GestureDetector(
                onTap: () => setState(() => _activeType = type),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: isActive ? bg : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive ? color : context.divider,
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    type,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: isActive ? color : context.textMuted,
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 12),

        Expanded(
          child: _isLoading
              ? Center(child: CircularProgressIndicator(color: context.primary))
              : filtered.isEmpty
              ? Center(
                  child: Text(
                    'No funds found',
                    style: TextStyle(color: context.textMuted, fontSize: 15),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final sector =
                        filtered[i]['sector']?.toString() ?? 'Balanced';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _FundCard(
                        fund: filtered[i],
                        typeColor: _typeColor(context, sector),
                        typeBg: _typeBg(context, sector),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _FundCard extends StatefulWidget {
  final Map<String, dynamic> fund;
  final Color typeColor;
  final Color typeBg;
  const _FundCard({
    required this.fund,
    required this.typeColor,
    required this.typeBg,
  });

  @override
  State<_FundCard> createState() => _FundCardState();
}

class _FundCardState extends State<_FundCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final fund = widget.fund;
    final fd = (fund['fund_details'] as Map<String, dynamic>?) ?? {};

    final trustee = fd['trustee']?.toString() ?? '';
    final custodian = fd['custodian']?.toString() ?? '';
    final provider = fd['provider']?.toString() ?? 'N/A';
    final strategy =
        fd['investment_components_target']?.toString() ??
        'No strategy details provided.';
    final assetMix = fd['asset_mix']?.toString() ?? 'Not available.';
    final purification =
        fd['purification_note']?.toString() ?? 'Not disclosed.';
    final launched = fd['launched']?.toString() ?? '';

    final hasMeta = trustee.isNotEmpty || custodian.isNotEmpty;
    final historyRaw = fd['purification_history'];
    final history = (historyRaw is List) ? historyRaw : [];

    return Container(
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.primary, context.questionable],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: context.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: context.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        fund['name'].toString().isNotEmpty
                            ? fund['name'].toString()[0].toUpperCase()
                            : 'F',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fund['name']?.toString() ?? '',
                            style: TextStyle(
                              color: context.textDark,
                              fontWeight: FontWeight.w900,
                              fontSize: 14.5,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: widget.typeBg,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: widget.typeColor.withValues(
                                      alpha: 0.25,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  fund['sector']?.toString() ?? 'Balanced',
                                  style: TextStyle(
                                    color: widget.typeColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                              if (launched.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.calendar_today,
                                  size: 11,
                                  color: context.textMuted,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  'Est. $launched',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Icon(Icons.business, size: 13, color: context.textMuted),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        provider,
                        style: TextStyle(
                          color: context.textMuted,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),

                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: context.divider, height: 1),
                ),

                Text(
                  strategy,
                  maxLines: _expanded ? null : 2,
                  overflow: _expanded ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.textBody,
                    fontSize: 13,
                    height: 1.55,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                if (_expanded) ...[
                  const SizedBox(height: 16),

                  // Asset Mix
                  Row(
                    children: [
                      Icon(
                        Icons.pie_chart_outline,
                        size: 14,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'ASSET MIX',
                        style: TextStyle(
                          color: context.textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    assetMix,
                    style: TextStyle(
                      color: context.textMuted,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Purification
                  Row(
                    children: [
                      Icon(
                        Icons.water_drop_outlined,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'PURIFICATION DETAILS',
                        style: TextStyle(
                          color: context.textDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    purification,
                    style: TextStyle(
                      color: context.textMuted,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  if (history.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: context.divider),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: context.bgSection,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(8),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'YEAR',
                                    style: TextStyle(
                                      color: context.textMuted,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                Text(
                                  'PER UNIT (₦)',
                                  style: TextStyle(
                                    color: context.textMuted,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ...history
                              .map(
                                (h) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      top: BorderSide(color: context.divider),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          h['year'].toString(),
                                          style: TextStyle(
                                            color: context.textDark,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        '₦${double.tryParse(h['per_unit'].toString())?.toStringAsFixed(5) ?? h['per_unit']}',
                                        style: TextStyle(
                                          color: Colors.orange,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ],
                      ),
                    ),
                  ],

                  if (hasMeta) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (trustee.isNotEmpty)
                          _MetaChip(
                            label: 'Trustee',
                            value: trustee,
                            icon: Icons.shield_outlined,
                          ),
                        if (custodian.isNotEmpty)
                          _MetaChip(
                            label: 'Custodian',
                            value: custodian,
                            icon: Icons.account_balance_outlined,
                          ),
                      ],
                    ),
                  ],
                ],

                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Row(
                    children: [
                      Text(
                        _expanded ? 'Show less' : 'Show full details',
                        style: TextStyle(
                          color: context.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        _expanded
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        size: 16,
                        color: context.primary,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _MetaChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.bgSection,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: context.textMuted),
          const SizedBox(width: 5),
          Text(
            '$label: ',
            style: TextStyle(
              color: context.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: context.textDark,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
