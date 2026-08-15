import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/portfolio_provider.dart';
import '../../../../core/theme/app_theme.dart';

class CharitiesBottomSheet extends StatefulWidget {
  final double amountDue;
  final String? symbol; // If null, means donate all

  const CharitiesBottomSheet({
    super.key,
    required this.amountDue,
    this.symbol,
  });

  @override
  State<CharitiesBottomSheet> createState() => _CharitiesBottomSheetState();
}

class _CharitiesBottomSheetState extends State<CharitiesBottomSheet> {
  bool _isSubmitting = false;

  final List<Map<String, String>> _charities = [
    {
      "id": "1",
      "name": "Voice of Bazawara",
      "bank": "Gt Bank: 0869251235",
      "contact": "Whatsapp- 08145201878",
      "ig": "https://www.instagram.com/voice_of_bazawara"
    },
    {
      "id": "2",
      "name": "Sadqa Drive Foundation",
      "bank": "Zenith bank: 1221960210",
      "ig": "https://www.instagram.com/sadaqahdrivefoundation_"
    },
    {
      "id": "3",
      "name": "Domin Marayu Charity Org",
      "bank": "Zenith Bank: 1213408773",
      "contact": "Whatsapp-08032896206",
      "ig": "https://www.instagram.com/dominmarayucharityfoundation"
    },
    {
      "id": "4",
      "name": "Protect the Needy Foundation",
      "bank": "Premium Trust Bank: 0040249382",
      "contact": "Whatsapp- 08030754510, 08034530100"
    },
    {
      "id": "5",
      "name": "Al-Maheer Charity and Endowment Foundation",
      "bank": "Taj Bank: 0015604766",
      "contact": "Whatsapp- 09121526431"
    },
    {
      "id": "6",
      "name": "Ummahatul Yateem Foundation",
      "bank": "Providus/Unity: 8900510157",
      "contact": "Whatsapp- 07057323225"
    },
    {
      "id": "7",
      "name": "JADAFIA (Jamaatud Da'awah -Fou'ad Labadidi)",
      "bank": "Jaiz: 1000239373",
      "contact": "Whatsapp- 08033334393"
    },
    {
      "id": "8",
      "name": "Sunnah TV Programmes Sponsorship",
      "bank": "Stanbic IBTC: 0006740998"
    },
    {
      "id": "9",
      "name": "Al-Ansar Educational Welfare and First Aid",
      "bank": "Jaiz Bank: 0001046218"
    }
  ];

  Future<void> _handleConfirm() async {
    setState(() => _isSubmitting = true);
    final provider = context.read<PortfolioProvider>();
    final success = await provider.purifyHoldings(symbol: widget.symbol);
    
    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Purification recorded successfully!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Failed to record purification. Please try again.')),
        );
      }
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.scaffoldBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Verifiable Charities', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textDark, letterSpacing: -0.5)),
                      const SizedBox(height: 4),
                      Text('Donate your purification amount of ₦${widget.amountDue.toStringAsFixed(2)} directly.', style: TextStyle(fontSize: 13, color: context.textMuted)),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  style: IconButton.styleFrom(backgroundColor: context.divider, foregroundColor: context.textMuted),
                ),
              ],
            ),
          ),
          
          // Warning Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            color: Colors.amber.shade50,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined, size: 20, color: Colors.amber.shade700),
                const SizedBox(width: 12),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(fontSize: 13, color: Colors.amber.shade900, height: 1.5, fontFamily: 'Inter'),
                      children: const [
                        TextSpan(text: 'Note: ', style: TextStyle(fontWeight: FontWeight.w800)),
                        TextSpan(text: 'We are not affiliated with any of these charities and organisations. Please do your own verification.', style: TextStyle(fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Charities List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: _charities.length,
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final charity = _charities[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: context.divider),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(color: context.primary.withOpacity(0.1), shape: BoxShape.circle),
                            child: Center(child: Text(charity['id']!, style: TextStyle(color: context.primary, fontWeight: FontWeight.w800, fontSize: 12))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Text(charity['name']!, style: TextStyle(fontWeight: FontWeight.w800, color: context.textDark, fontSize: 15))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.only(left: 40),
                        child: Column(
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SizedBox(width: 70, child: Text('Bank:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted))),
                                Expanded(child: Text(charity['bank']!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.textDark))),
                              ],
                            ),
                            if (charity['contact'] != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(width: 70, child: Text('Contact:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted))),
                                  Expanded(child: Text(charity['contact']!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.textDark))),
                                ],
                              ),
                            ],
                            if (charity['ig'] != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(width: 70, child: Text('Instagram:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textMuted))),
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () => _launchUrl(charity['ig']!),
                                      child: Text('View Profile ↗', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.primary)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Actions
          Container(
            padding: EdgeInsets.only(left: 24, right: 24, top: 20, bottom: MediaQuery.of(context).padding.bottom + 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: context.divider)),
            ),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handleConfirm,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSubmitting
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline, size: 20),
                        SizedBox(width: 8),
                        Text('Mark as Purified', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
