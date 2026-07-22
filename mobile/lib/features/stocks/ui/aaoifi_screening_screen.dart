import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import '../data/stock_repository.dart';
import 'dart:async';

class AaoifiScreeningScreen extends StatefulWidget {
  final Map<String, dynamic> stock;

  const AaoifiScreeningScreen({super.key, required this.stock});

  @override
  State<AaoifiScreeningScreen> createState() => _AaoifiScreeningScreenState();
}

class _AaoifiScreeningScreenState extends State<AaoifiScreeningScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _report;
  
  int _currentStepIndex = 0;
  final List<String> _loadingSteps = [
    "Initializing AAOIFI Screening...",
    "Reading latest financial statements...",
    "Fetching regulatory filings...",
    "Searching latest company news...",
    "Analyzing business activities...",
    "Consulting Gemini AI...",
    "Calculating AAOIFI financial ratios...",
    "Running compliance engine...",
    "Generating transparent report..."
  ];
  
  Timer? _stepTimer;

  @override
  void initState() {
    super.initState();
    _startLoadingAnimation();
    _fetchScreening();
  }

  @override
  void dispose() {
    _stepTimer?.cancel();
    super.dispose();
  }

  void _startLoadingAnimation() {
    // Animate through the steps roughly every 1.5 seconds while waiting for API
    _stepTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      if (!mounted || !_isLoading) {
        timer.cancel();
        return;
      }
      if (_currentStepIndex < _loadingSteps.length - 1) {
        setState(() {
          _currentStepIndex++;
        });
      }
    });
  }

  Future<void> _fetchScreening() async {
    try {
      final repo = context.read<StockRepository>();
      final result = await repo.fetchAaoifiScreening(widget.stock['symbol']);
      if (!mounted) return;
      
      // Make sure we at least show the final step before revealing the report
      setState(() {
        _currentStepIndex = _loadingSteps.length - 1;
      });
      
      await Future.delayed(const Duration(milliseconds: 800));
      
      if (!mounted) return;
      setState(() {
        _report = result;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Widget _buildLoadingState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: context.primary),
            const SizedBox(height: 32),
            Text(
              "Institutional AAOIFI Analysis",
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              child: Text(
                _loadingSteps[_currentStepIndex],
                key: ValueKey<int>(_currentStepIndex),
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            // Progress dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_loadingSteps.length, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentStepIndex == index ? 12 : 8,
                  height: _currentStepIndex == index ? 12 : 8,
                  decoration: BoxDecoration(
                    color: _currentStepIndex >= index ? context.primary : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportState() {
    if (_report == null) {
      return const Center(child: Text("No report data available."));
    }

    final finalStatus = _report!['final_status'] ?? 'unknown';
    Color statusColor = Colors.grey;
    IconData statusIcon = Icons.help_outline;
    
    if (finalStatus == 'compliant') {
      statusColor = Colors.green;
      statusIcon = Icons.check_circle;
    } else if (finalStatus == 'non-compliant') {
      statusColor = Colors.red;
      statusIcon = Icons.cancel;
    } else if (finalStatus == 'doubtful') {
      statusColor = Colors.orange;
      statusIcon = Icons.warning;
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: statusColor.withOpacity(0.5)),
          ),
          child: Column(
            children: [
              Icon(statusIcon, color: statusColor, size: 48),
              const SizedBox(height: 8),
              Text(
                finalStatus.toString().toUpperCase(),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                "AAOIFI Compliance Verdict",
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // 1. Business Activity
        _buildSectionHeader("1. Business Activity Screening", _report!['business_status']),
        const SizedBox(height: 8),
        _buildBusinessAnalysis(),

        const SizedBox(height: 24),

        // 2. Debt Ratio
        _buildSectionHeader("2. Debt Ratio Screening", _report!['debt_status']),
        const SizedBox(height: 8),
        _buildRatioCard(
          title: "Debt to Market Cap",
          ratio: _report!['debt_ratio'],
          threshold: "≤ 30%",
          formula: "Total Interest-Bearing Debt / Market Cap",
          numeratorLabel: "Total Debt",
          numeratorValue: _report!['financial_data_used']?['total_debt'],
          denominatorLabel: "Market Cap",
          denominatorValue: _report!['financial_data_used']?['market_cap'],
        ),

        const SizedBox(height: 24),

        // 3. Cash Ratio
        _buildSectionHeader("3. Cash & Securities Screening", _report!['cash_status']),
        const SizedBox(height: 8),
        _buildRatioCard(
          title: "Cash to Market Cap",
          ratio: _report!['cash_ratio'],
          threshold: "≤ 30%",
          formula: "Cash & Interest-bearing Securities / Market Cap",
          numeratorLabel: "Cash & Securities",
          numeratorValue: _report!['financial_data_used']?['cash'],
          denominatorLabel: "Market Cap",
          denominatorValue: _report!['financial_data_used']?['market_cap'],
        ),

        const SizedBox(height: 24),

        // 4. Impermissible Income
        _buildSectionHeader("4. Impermissible Income", _report!['impermissible_income_status']),
        const SizedBox(height: 8),
        _buildRatioCard(
          title: "Impure Income to Total Revenue",
          ratio: _report!['impermissible_income_ratio'],
          threshold: "≤ 5%",
          formula: "Interest Income / Total Revenue",
          numeratorLabel: "Interest Income",
          numeratorValue: _report!['financial_data_used']?['interest_income'],
          denominatorLabel: "Total Revenue",
          denominatorValue: _report!['financial_data_used']?['total_revenue'],
        ),

        const SizedBox(height: 32),
        const Divider(),
        const SizedBox(height: 16),
        _buildEvidencePanel(),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildSectionHeader(String title, String? status) {
    Color color = Colors.grey;
    if (status == 'pass') color = Colors.green;
    if (status == 'fail') color = Colors.red;
    if (status == 'warning') color = Colors.orange;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            (status ?? 'UNKNOWN').toUpperCase(),
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBusinessAnalysis() {
    final aiData = _report!['business_reasoning'];
    if (aiData == null) return const Text("No AI analysis available.");

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDetailRow("Principal Business", aiData['principal_business']?.toString() ?? "N/A"),
          const SizedBox(height: 8),
          if (aiData['prohibited_activities'] != null && (aiData['prohibited_activities'] as List).isNotEmpty) ...[
            const Text(
              "Prohibited Activities Found:",
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            ...((aiData['prohibited_activities'] as List).map((act) => Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("• ", style: TextStyle(color: Colors.red)),
                Expanded(child: Text(act.toString(), style: const TextStyle(color: Colors.red))),
              ],
            )).toList()),
            const SizedBox(height: 8),
          ],
          const Text("Reasoning:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 4),
          Text(aiData['reasoning']?.toString() ?? "N/A", style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildRatioCard({
    required String title,
    required dynamic ratio,
    required String threshold,
    required String formula,
    required String numeratorLabel,
    required dynamic numeratorValue,
    required String denominatorLabel,
    required dynamic denominatorValue,
  }) {
    if (ratio == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text("Insufficient Data to calculate this ratio."),
        ),
      );
    }

    final double ratioValue = double.tryParse(ratio.toString()) ?? 0;
    
    return InkWell(
      onTap: () {
        _showCalculationModal(
          title,
          ratioValue,
          threshold,
          formula,
          numeratorLabel,
          numeratorValue,
          denominatorLabel,
          denominatorValue,
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text(
                  "Threshold: $threshold",
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
            Row(
              children: [
                Text(
                  "${ratioValue.toStringAsFixed(2)}%",
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCalculationModal(
    String title,
    double ratio,
    String threshold,
    String formula,
    String numLabel,
    dynamic numVal,
    String denLabel,
    dynamic denVal,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Calculation: $title", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              _buildDetailRow(numLabel, "₦${_formatNumber(numVal)}"),
              const SizedBox(height: 8),
              _buildDetailRow(denLabel, "₦${_formatNumber(denVal)}"),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              const Text("Formula", style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                child: Text(
                  formula,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "= ${ratio.toStringAsFixed(2)}%",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: context.primary),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  String _formatNumber(dynamic number) {
    if (number == null) return "0";
    final double? val = double.tryParse(number.toString());
    if (val == null) return "0";
    
    if (val > 1000000000) {
      return "${(val / 1000000000).toStringAsFixed(2)} Billion";
    } else if (val > 1000000) {
      return "${(val / 1000000).toStringAsFixed(2)} Million";
    }
    return val.toStringAsFixed(2);
  }

  Widget _buildEvidencePanel() {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        title: const Text("Evidence & Traceability", style: TextStyle(fontWeight: FontWeight.bold)),
        subtitle: const Text("View data sources and AI confidence"),
        leading: Icon(Icons.plagiarism_outlined, color: context.primary),
        tilePadding: EdgeInsets.zero,
        children: [
          _buildDetailRow("AI Confidence Score", "${_report!['business_reasoning']?['confidence_score'] ?? 'N/A'}%"),
          const SizedBox(height: 16),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text("News Sources Analyzed:", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 8),
          if (_report!['news_sources'] != null)
            ...((_report!['news_sources'] as List).map((news) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.article_outlined, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        news['title'] ?? 'Unknown Source',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              );
            }).toList()),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(flex: 2, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
        Expanded(flex: 3, child: Text(value, style: const TextStyle(fontSize: 13))),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.stock['symbol']} AAOIFI Report'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF8F9FA),
      body: _isLoading 
        ? _buildLoadingState() 
        : _error != null
          ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
          : _buildReportState(),
    );
  }
}
