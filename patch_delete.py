import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/portfolio_overview_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

# We need to insert the Delete Holding button directly after the Row containing Cancel/Save buttons.
# Here is the pattern that uniquely matches the end of that Row.

search_str = """                              child: isSaving 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ],
                      ),"""

insert_str = """                              child: isSaving 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: TextButton.icon(
                          onPressed: isSaving ? null : () async {
                            setState(() => isSaving = true);
                            try {
                              await ApiService().delete('portfolio/${holding['id']}');
                              if (mounted) {
                                await Provider.of<PortfolioProvider>(context, listen: false).fetchPortfolio();
                                Navigator.pop(bottomSheetContext);
                              }
                            } catch (e) {
                              if (mounted) ScaffoldMessenger.of(bottomSheetContext).showSnackBar(SnackBar(content: Text('Failed to delete: $e'), backgroundColor: context.haram));
                            } finally {
                              if (mounted) setState(() => isSaving = false);
                            }
                          },
                          icon: const Icon(Icons.delete_outline, size: 20),
                          label: const Text('Delete Holding', style: TextStyle(fontWeight: FontWeight.w800)),
                          style: TextButton.styleFrom(
                            foregroundColor: context.haram,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),"""

if search_str in content:
    content = content.replace(search_str, insert_str)
    with open(filepath, 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to find search_str")
