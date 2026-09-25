import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# Add _buildTickerSymbolField and _buildTextField to _PortfolioOverviewTabState
func_to_add = """  Widget _buildTickerSymbolField(_HoldingFormData form) {
    return RawAutocomplete<Map<String, dynamic>>(
      textEditingController: form.symbol,
      focusNode: form.symbolFocus,
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text == '') {
          return const Iterable<Map<String, dynamic>>.empty();
        }
        final stocks = Provider.of<StockProvider>(context, listen: false).ngxStocks;
        return stocks.where((stock) {
          final symbol = stock['symbol']?.toString().toLowerCase() ?? '';
          final name = stock['name']?.toString().toLowerCase() ?? '';
          final query = textEditingValue.text.toLowerCase();
          return symbol.contains(query) || name.contains(query);
        });
      },
      displayStringForOption: (option) => option['symbol']?.toString() ?? '',
      onSelected: (Map<String, dynamic> selection) {
        form.price.text = selection['latest_price']?.toString() ?? '0.00';
      },
      fieldViewBuilder: (BuildContext context, TextEditingController textEditingController, FocusNode focusNode, VoidCallback onFieldSubmitted) {
        return _buildTextField(
          'Ticker Symbol',
          controller: textEditingController,
          focusNode: focusNode,
          prefixIcon: Icons.search,
          hint: 'CMFC',
        );
      },
      optionsViewBuilder: (BuildContext context, AutocompleteOnSelected<Map<String, dynamic>> onSelected, Iterable<Map<String, dynamic>> options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Material(
              elevation: 12.0,
              borderRadius: BorderRadius.circular(16),
              color: context.bg,
              shadowColor: Colors.black.withOpacity(0.5),
              clipBehavior: Clip.antiAlias,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: 260,
                  maxWidth: MediaQuery.of(context).size.width - 88,
                  minWidth: MediaQuery.of(context).size.width - 88,
                ),
                child: ListView.separated(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  itemCount: options.length,
                  separatorBuilder: (context, index) => Divider(height: 1, color: context.divider.withOpacity(0.3)),
                  itemBuilder: (BuildContext context, int index) {
                    final option = options.elementAt(index);
                    return InkWell(
                      onTap: () => onSelected(option),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(option['symbol'] ?? '', style: TextStyle(fontWeight: FontWeight.w900, color: context.textDark, fontSize: 14)),
                                  Text(option['name'] ?? '', style: TextStyle(color: context.textMuted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                                ],
                              ),
                            ),
                            Text('₦${option['latest_price']}', style: TextStyle(fontWeight: FontWeight.w800, color: context.primary, fontSize: 13)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTextField(String label, {required TextEditingController controller, FocusNode? focusNode, String? hint, IconData? prefixIcon, IconData? suffixIcon, TextInputType? keyboardType, bool readOnly = false, VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: context.textDark, fontWeight: FontWeight.w800, fontSize: 13)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          readOnly: readOnly,
          onTap: onTap,
          style: TextStyle(color: context.textDark, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600),
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: context.textMuted, size: 20) : null,
            suffixIcon: suffixIcon != null ? Icon(suffixIcon, color: context.textMuted, size: 20) : null,
            filled: true,
            fillColor: context.bg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.divider, width: 2)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: context.primary, width: 2)),
          ),
        ),
      ],
    );
  }
"""

old_end = """  void _showAddHoldingSheet(BuildContext context) {"""
new_end = func_to_add + "\n" + old_end
content = content.replace(old_end, new_end)

with open(filepath, 'w') as f:
    f.write(content)
