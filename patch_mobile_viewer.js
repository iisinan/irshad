const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

const regex = /void _showDigestViewer.*?Expanded\(/s;

const replacement = `void _showDigestViewer(BuildContext context, Map<String, dynamic> meta) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final gainers = meta['top_gainers'] as List<dynamic>? ?? [];
        final losers = meta['top_losers'] as List<dynamic>? ?? [];
        final userPerf = meta['user_performances'] as List<dynamic>? ?? [];
        final dividends = meta['dividends'] as List<dynamic>? ?? [];
        final complianceChanges = meta['compliance_changes'] as List<dynamic>? ?? [];
        final ipos = meta['ipos'] as List<dynamic>? ?? [];

        Widget buildPerfItem(dynamic item) {
          final isUp = (item['change_pct'] ?? 0) > 0;
          final isDown = (item['change_pct'] ?? 0) < 0;
          final color = isUp ? const Color(0xFF10B981) : isDown ? const Color(0xFFEF4444) : Colors.grey;
          final icon = isUp ? Icons.trending_up : isDown ? Icons.trending_down : Icons.remove;
          
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.bg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.appColors.divider),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['symbol'] ?? item['ticker'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                    Text(item['status'] ?? 'Unknown', style: TextStyle(fontSize: 12, color: context.textMuted)),
                  ],
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Icon(icon, size: 12, color: color),
                    ),
                    const SizedBox(width: 6),
                    Text('\${isUp ? '+' : ''}\${item['change_pct']}%', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: color)),
                  ],
                ),
              ],
            ),
          );
        }

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: context.bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: context.appColors.divider)),
                ),
                child: Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: context.textMuted.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              Expanded(`;

file = file.replace(regex, replacement);

const regex2 = /if \(userPerf\.isNotEmpty\).*?\]\n                  \),\n                \),\n              \),/s;

const replacement2 = `
                      if (complianceChanges.isNotEmpty) ...[
                        Text('Compliance Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFFEF4444))),
                        const SizedBox(height: 12),
                        ...complianceChanges.map((c) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.shield_outlined, color: Color(0xFFEF4444), size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('\${c['company']?['symbol'] ?? 'Unknown'} - \${c['new_status']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                    Text('Was previously \${c['previous_status']}.', style: TextStyle(fontSize: 12, color: context.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                      if (userPerf.isNotEmpty) ...[
                        Text('Your Watchlist & Portfolio', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...userPerf.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (gainers.isNotEmpty) ...[
                        Text('Market Top Gainers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...gainers.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (losers.isNotEmpty) ...[
                        Text('Market Top Losers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...losers.map((p) => buildPerfItem(p)),
                        const SizedBox(height: 24),
                      ],
                      if (dividends.isNotEmpty) ...[
                        Text('Dividends Declared', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...dividends.map((d) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.appColors.divider),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(d['company']?['symbol'] ?? d['ticker'] ?? '', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                                  Text('Declared: \${d['created_at']?.split('T')[0] ?? ''}', style: TextStyle(fontSize: 12, color: context.textMuted)),
                                ],
                              ),
                              Text('\${d['amount']} \${d['currency'] ?? ''}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.primary)),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                      if (ipos.isNotEmpty) ...[
                        Text('Recent IPOs & Listings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textDark)),
                        const SizedBox(height: 12),
                        ...ipos.map((c) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.bg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.appColors.divider),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.show_chart, color: context.primary, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('\${c['symbol']} - \${c['name']}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark)),
                                    Text('Listed: \${c['date_listed']}', style: TextStyle(fontSize: 12, color: context.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                    ]
                  ),
                ),
              ),`;

file = file.replace(regex2, replacement2);
fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', file);
