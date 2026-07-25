import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../data/stock_repository.dart';

import 'package:irshad_mobile/core/theme/app_theme.dart';
class AiAnalysisSheet extends StatefulWidget {
  final String symbol;

  const AiAnalysisSheet({super.key, required this.symbol});

  static void show(BuildContext context, String symbol) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AiAnalysisSheet(symbol: symbol),
    );
  }

  @override
  State<AiAnalysisSheet> createState() => _AiAnalysisSheetState();
}

class _AiAnalysisSheetState extends State<AiAnalysisSheet> {
  final StockRepository _repository = StockRepository();
  bool _isLoading = true;
  String? _analysis;
  int? _confidenceScore;
  List<String> _sources = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAnalysis();
  }

  Future<void> _fetchAnalysis() async {
    try {
      final res = await _repository.fetchAiAnalysis(widget.symbol);
      if (mounted) {
        setState(() {
          if (res != null) {
            _analysis = res['reasoning'] ?? res['analysis'] ?? 'No analysis available.';
            _confidenceScore = res['confidence_score'];
            if (res['sources'] != null) {
              _sources = List<String>.from(res['sources'].map((s) => s.toString()));
            }
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: context.bgAlt,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 24),
              height: 4,
              width: 40,
              decoration: BoxDecoration(
                color: context.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('✨', style: TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Irshad Analysis Reasoning',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: context.textDark,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Powered by Irshad Shariah Engine',
                        style: TextStyle(color: Colors.amber, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: context.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          
          const Divider(height: 32),

          // Content
          Expanded(
            child: _isLoading
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: Colors.blue),
                        SizedBox(height: 16),
                        Text('Irshad is analyzing corporate disclosures...', style: TextStyle(color: context.textMuted)),
                      ],
                    ),
                  )
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: context.haram, fontSize: 16),
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_confidenceScore != null)
                              Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: Colors.amber.withOpacity(0.5)),
                                ),
                                child: Text(
                                  '✨ Irshad Confidence Score: $_confidenceScore%',
                                  style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                            MarkdownBody(
                              data: _analysis ?? 'No analysis available.',
                              styleSheet: MarkdownStyleSheet(
                                p: TextStyle(fontSize: 15, height: 1.6, color: context.textMuted),
                                h1: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.textDark),
                                h2: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.textDark),
                                listBullet: const TextStyle(color: Colors.amber, fontSize: 16),
                              ),
                            ),
                            if (_sources.isNotEmpty) ...[
                              const SizedBox(height: 24),
                              const Divider(),
                              const SizedBox(height: 12),
                              Text(
                                'DATA SOURCES ANALYSED:',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.8),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: _sources.map((src) {
                                  final isUrl = src.startsWith('http');
                                  final display = isUrl ? src.replaceAll(RegExp(r'^https?://(www\.)?'), '').split('/')[0] : src;
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: context.bg,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: context.divider),
                                    ),
                                    child: Text(
                                      '📰 $display',
                                      style: TextStyle(fontSize: 12, color: context.textDark, fontWeight: FontWeight.w600),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 32),
                            ],
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
