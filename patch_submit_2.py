import re

content = open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart').read()

OLD_SUBMIT = """    if (success) {
      final prefs = await SharedPreferences.getInstance();
      final hasZakatDate = prefs.getString('ZAKAT_DATE_KEY') != null;
      if (!hasZakatDate) {
        String firstPurchaseDate = payload.firstWhere((p) => p['purchase_date'] != null, orElse: () => {'purchase_date': DateTime.now().toString().substring(0, 10)})['purchase_date'];
        if (mounted) _showZakatDatePrompt(firstPurchaseDate);
      } else {
        if (mounted) Navigator.pop(context);
      }
    } else {
      if (mounted) {
        final err = provider.error ?? '';
        if (err.toLowerCase().contains('limit') || err.toLowerCase().contains('upgrade')) {
          Navigator.pop(context); // Close the add holdings sheet first
          Future.delayed(const Duration(milliseconds: 300), () {
            if (navigatorKey.currentContext != null) {
              showModalBottomSheet(
                context: navigatorKey.currentContext!,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => UpgradePaywallBottomSheet(message: err),
              );
            }
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.isEmpty ? 'Failed to add holdings.' : err), backgroundColor: context.haram));
        }
      }
    }"""

NEW_SUBMIT = """    if (success) {
      final prefs = await SharedPreferences.getInstance();
      final hasZakatDate = prefs.getString('ZAKAT_DATE_KEY') != null;
      if (!hasZakatDate) {
        String firstPurchaseDate = payload.firstWhere((p) => p['purchase_date'] != null, orElse: () => {'purchase_date': DateTime.now().toString().substring(0, 10)})['purchase_date'];
        if (mounted) _showZakatDatePrompt(firstPurchaseDate);
      } else {
        if (mounted) Navigator.pop(context);
      }
    } else {
      if (mounted) {
        final err = provider.error ?? '';
        if (err.toLowerCase().contains('limit') || err.toLowerCase().contains('upgrade')) {
          Navigator.pop(context); 
          Future.delayed(const Duration(milliseconds: 300), () {
            if (ApiService.navigatorKey.currentContext != null) {
              showModalBottomSheet(
                context: ApiService.navigatorKey.currentContext!,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => UpgradePaywallBottomSheet(message: err),
              );
            }
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.isEmpty ? 'Failed to add holdings.' : err), backgroundColor: context.haram));
        }
      }
    }"""

content = content.replace(OLD_SUBMIT, NEW_SUBMIT)
open('mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart', 'w').write(content)
print("Patched navigatorKey")
