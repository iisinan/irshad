import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD = """          ElevatedButton(
            onPressed: (_isLinking || _brokerName == null) ? null : () async {
              setState(() => _isLinking = true);
              final provider = Provider.of<PortfolioProvider>(context, listen: false);
              bool success = await provider.linkBroker(_brokerName!);
              setState(() => _isLinking = false);
              if (success) {
                if (mounted) Navigator.pop(context);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$_brokerName linked successfully.'), backgroundColor: context.halal));
              } else {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to link broker.'), backgroundColor: context.haram));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: context.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: _isLinking
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Continue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          ),"""

NEW = """          ElevatedButton(
            onPressed: null,
            style: ElevatedButton.styleFrom(
              backgroundColor: context.primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor: context.divider,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: const Text('Coming Soon', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Colors.grey)),
          ),"""

content = content.replace(OLD, NEW)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched mobile broker button")
