                  _buildCompanyInfo(),
                  
                  // AAOIFI Screening Breakdown
                  if ((_currentStock['financials'] ?? []).isNotEmpty) ...[
                    _buildSectionHeader('AAOIFI Screening Breakdown'),
                    const SizedBox(height: 12),
                    _buildAaoifiBreakdown(statusColor, badgeBg, statusLabel, reason, isHalal, isNonHalal),
                    const SizedBox(height: 32),
                  ],

                  // Financial Highlights
                  if (hasFinancialHighlights) ...[
                    _buildSectionHeader('Financial Highlights'),
                    const SizedBox(height: 12),
                    _buildFinancialHighlights(),
                    const SizedBox(height: 32),
                  ],

                  // Advanced Metrics (SWS)
                  _buildAdvancedMetrics(),
                  
                  // Analyst Rating
