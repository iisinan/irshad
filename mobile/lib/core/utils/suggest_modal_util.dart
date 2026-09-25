import 'package:flutter/material.dart';
import '../api/api_service.dart';
import '../theme/app_theme.dart';

class SuggestModalUtil {
  static void show(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) {
        return StatefulBuilder(
          builder: (BuildContext ctx, StateSetter setModalState) {
            return Container(
              margin: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                top: 60,
              ),
              decoration: BoxDecoration(
                color: context.bg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: context.appColors.divider)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: context.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.mail_rounded, color: context.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'New Suggestion',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: context.textDark,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: Icon(Icons.close, color: context.textMuted),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            SizedBox(width: 50, child: Text('To:', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.bold))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(color: context.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                              child: Text('Irshad Admin Team', style: TextStyle(color: context.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Divider(color: context.appColors.divider),
                        const SizedBox(height: 12),
                        TextField(
                          controller: controller,
                          maxLines: 8,
                          autofocus: true,
                          decoration: InputDecoration(
                            hintText: 'Type your suggestion or feedback here...',
                            hintStyle: TextStyle(color: context.textMuted.withOpacity(0.5)),
                            border: InputBorder.none,
                          ),
                          style: TextStyle(color: context.textDark, fontSize: 15),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  if (controller.text.trim().isEmpty) return;
                                  setModalState(() => isSubmitting = true);
                                  try {
                                    final res = await ApiService().post('suggestions', {'message': controller.text});
                                    if (res.statusCode == 200 || res.statusCode == 201) {
                                      if (ctx.mounted) {
                                        Navigator.pop(ctx);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: const Text('Suggestion sent!'), backgroundColor: context.halal),
                                        );
                                      }
                                    }
                                  } catch (e) {
                                    if (ctx.mounted) {
                                      ScaffoldMessenger.of(ctx).showSnackBar(
                                        const SnackBar(content: Text('Failed to send suggestion'), backgroundColor: Colors.red),
                                      );
                                    }
                                  } finally {
                                    if (ctx.mounted) setModalState(() => isSubmitting = false);
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: context.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: isSubmitting
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Send Suggestion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
