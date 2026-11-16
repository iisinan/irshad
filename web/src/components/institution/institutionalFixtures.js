// Institutional presentation datasets faithfully matching:
// 1) Lotus Halal Equity ETF Fact Sheet (3rd July, 2026)
// 2) Norrenberger Islamic Fund Factsheet (October 2026)

export const LOTUS_FALLBACK_DATA = {
  id: 'lotus_etf',
  institution_name: 'Lotus Capital Limited',
  fund_name: 'Lotus Halal Equity Exchange Traded Fund',
  short_name: 'LHE ETF',
  ticker: 'LOTUSHAL15',
  bloomberg_ticker: 'LOTCHLAL:NL',
  isin: 'NGLOTUSHAL13',
  currency: 'Naira (NGN)',
  factsheet_date: '3rd July, 2026',
  fund_size_label: '₦3.18billion',
  fund_size_ngn: 3180000000,
  nav_per_unit: 95.17,
  closing_price: 127.90,
  purification_per_unit_fy25: 0.46,
  last_distribution: 'December 2025: ₦0.81/unit',
  management_fee: '0.60%',
  rebalancing_frequency: 'Half-Yearly',
  last_rebalancing: '30th June, 2026',
  next_rebalancing: '31st December, 2026',
  benchmark_index: 'NGX Lotus Islamic Index',
  launch_date: 'Aug-14',
  listing_date: 'Nov-14',
  listing_exchange: 'Nigerian Exchange Limited',
  holdings_count: 13,
  overview:
    'The Lotus Halal Equity Exchange Traded Fund “LHE ETF” is an open-ended fund that tracks the performance of the NGX-Lotus Islamic Index (NGXLII). It is designed to enable investors obtain market exposure to the securities of the constituent companies of the NGX-Lotus Islamic Index and to replicate the performance of the index.',
  index_commentary:
    'The NGX Lotus Islamic Index tracks the performance of Shari’ah-compliant equities listed on the Nigerian Exchange. It currently comprises 13 screened equities. The Index is rebalanced semi-annually. During the last rebalancing on 30th June 2026, Nestlé Nigeria Plc and Cadbury Nigeria Plc were added to the index component and Nascon Allied Industries Plc removed. The index’s next rebalancing would be on 31st December 2026.',
  investor_profile:
    'The Lotus Halal Equity ETF is suitable for Individuals, Asset Managers, Financial Institutions and Corporates seeking exposure to Shari’ah-compliant stocks, competitive returns and long-term capital appreciation. Investors are advised to seek further guidance from their financial advisers.',
  benefits: [
    'Transparent holdings',
    'Ethical investments',
    'Potential for capital appreciation',
    'Lower expense compared to typical mutual funds',
    'Periodic dividend income',
    'Easy access to a basket of securities',
    'Portfolio diversification',
  ],
  sector_allocation: [
    { sector: 'Industrial Goods', weight_pct: 35.07, color: '#991B1B' },
    { sector: 'Oil & Gas', weight_pct: 18.68, color: '#DC2626' },
    { sector: 'Consumer Goods', weight_pct: 14.59, color: '#F87171' },
    { sector: 'Telecommunications', weight_pct: 14.39, color: '#B91C1C' },
    { sector: 'Agriculture', weight_pct: 13.69, color: '#FCA5A5' },
    { sector: 'Aviation', weight_pct: 2.32, color: '#7F1D1D' },
    { sector: 'Banking', weight_pct: 1.25, color: '#FECACA' },
  ],
  purification_history: [
    { year: 2025, per_unit: 0.46, note: 'Published on Lotus Capital Purification Page' },
    { year: 2024, per_unit: 0.10, note: 'Annual Audited Fund Report' },
    { year: 2023, per_unit: 0.08, note: 'Annual Audited Fund Report' },
    { year: 2022, per_unit: 0.05, note: 'Annual Audited Fund Report' },
    { year: 2021, per_unit: 0.04, note: 'Annual Audited Fund Report' },
  ],
  nav_vs_benchmark_series: [
    { date: '12/31/2025', etf: 6.17, benchmark: 6.17 },
    { date: '1/13/2026', etf: 6.80, benchmark: 6.95 },
    { date: '1/26/2026', etf: 7.45, benchmark: 7.60 },
    { date: '2/8/2026', etf: 8.10, benchmark: 8.35 },
    { date: '2/21/2026', etf: 8.85, benchmark: 9.20 },
    { date: '3/6/2026', etf: 9.70, benchmark: 10.10 },
    { date: '3/19/2026', etf: 10.60, benchmark: 11.05 },
    { date: '4/1/2026', etf: 11.40, benchmark: 11.80 },
    { date: '4/14/2026', etf: 11.85, benchmark: 12.25 },
    { date: '4/27/2026', etf: 12.10, benchmark: 12.40 },
    { date: '5/10/2026', etf: 11.65, benchmark: 11.95 },
    { date: '5/23/2026', etf: 11.20, benchmark: 11.45 },
    { date: '6/5/2026', etf: 10.75, benchmark: 11.10 },
    { date: '6/18/2026', etf: 10.15, benchmark: 10.65 },
    { date: '7/1/2026', etf: 9.52, benchmark: 10.29 },
  ],
  performance_table: [
    { metric: 'NAV/Unit', d7: '-6.00%', d30: '-17.39%', ytd: '54.17%' },
    { metric: 'NGX Price', d7: '3.48%', d30: '-1.62%', ytd: '57.90%' },
    { metric: 'NGXLII', d7: '-4.73%', d30: '-16.10%', ytd: '66.79%' },
    { metric: 'NGXASI', d7: '-1.21%', d30: '-7.07%', ytd: '47.31%' },
  ],
  contact: 'For more information, please contact us on +234 (908) 7058 407/408 and info@lotuscapitallimited.com, or visit www.lotuscapitallimited.com',
  disclaimer:
    'All financial investments involve an element of risk as such; the value of your investment in the Lotus Halal Equity ETF will vary from time to time in line with the value of the underlying assets. Past performance is no guarantee for future results. Current performance may be higher or lower than the data quoted here-in; information on the current value can be obtained at www.lotuscapitallimited.com OR www.ngxgroup.com',
};

export const NORRENBERGER_FALLBACK_DATA = {
  id: 'norrenberger_fund',
  institution_name: 'Norrenberger Asset Management Limited',
  fund_name: 'NORRENBERGER ISLAMIC FUND',
  factsheet_date: 'October 2026',
  kpis: [
    { label: 'YTD Yield', value: '17.72%' },
    { label: 'Unit Price', value: '₦108.27' },
    { label: 'Fund Size', value: '₦6.81bn' },
    { label: 'Expense Ratio', value: '1.90%' },
  ],
  objective:
    'The Norrenberger Islamic Fund aims to provide Shariah compliant minded investors with liquidity and competitive returns by investing in Shariah compliant instruments of good investment grade.',
  key_facts: [
    { label: 'Base currency', value: 'Naira' },
    { label: 'Launch date', value: 'May 2021' },
    { label: 'Status of fund', value: 'Open Ended' },
    { label: 'Bias', value: 'Fixed Income' },
    { label: 'Listed', value: 'NGX' },
    { label: 'Initial investment', value: '50 Units' },
    { label: 'Additional investment', value: '10 Units' },
    { label: 'Unit Price', value: '₦108.27' },
    { label: 'Fund size', value: '₦6.81bn' },
    { label: 'Management fee', value: '1.50% p.a.' },
  ],
  benchmark: '3-year FGN Sukuk (Moving Average)',
  risk_profile: { level: 1, max: 5, label: 'Conservative' },
  monthly_performance_2026: [
    { month: 'Jan-26', yield: 17.06, benchmark: 17.37 },
    { month: 'Feb-26', yield: 17.05, benchmark: 16.29 },
    { month: 'Mar-26', yield: 17.49, benchmark: 16.17 },
    { month: 'Apr-26', yield: 18.28, benchmark: 16.48 },
    { month: 'May-26', yield: 18.47, benchmark: 16.83 },
    { month: 'Jun-26', yield: 18.51, benchmark: 17.47 },
    { month: 'Jul-26', yield: 18.21, benchmark: 17.75 },
    { month: 'Aug-26', yield: 18.12, benchmark: 17.14 },
    { month: 'Sep-26', yield: 17.95, benchmark: 16.56 },
    { month: 'Oct-26', yield: 17.72, benchmark: 16.73 },
  ],
  historical_performance: [
    { period: 'YTD', yield: 17.72, benchmark: 16.73 },
    { period: '2025', yield: 15.56, benchmark: 16.57 },
    { period: '3Y', yield: 13.33, benchmark: 16.52 },
    { period: '5Y', yield: 11.48, benchmark: 14.36 },
  ],
  allocation: [
    { security: 'Federal Government Sukuk', current: 21.79, target_label: '30% - 100%', target_min: 30, target_max: 100, shariah_contract: 'Sukuk Al-Ijarah', status: 'Below Target Band' },
    { security: 'Mudarabah', current: 43.99, target_label: '0% - 70%', target_min: 0, target_max: 70, shariah_contract: 'Profit-Sharing', status: 'Within Mandate' },
    { security: 'Ijarah/Wakalah', current: 7.23, target_label: '0% - 50%', target_min: 0, target_max: 50, shariah_contract: 'Leasing / Agency', status: 'Within Mandate' },
    { security: 'Murabaha', current: 25.34, target_label: '0% - 50%', target_min: 0, target_max: 50, shariah_contract: 'Cost-Plus Trade', status: 'Within Mandate' },
    { security: 'Cash', current: 1.64, target_label: '0% - 15%', target_min: 0, target_max: 15, shariah_contract: 'Non-Interest Cash', status: 'Within Mandate' },
  ],
  maturity_profile: [
    { bucket: '> 3 Years', pct: 14.47 },
    { bucket: '1-3 Years', pct: 6.94 },
    { bucket: '< 1 Year', pct: 78.59 },
  ],
  distribution_per_unit: [
    { quarter: 'Q1 2025', amount: 3.28 },
    { quarter: 'Q2 2025', amount: 3.49 },
    { quarter: 'Q3 2025', amount: 3.97 },
    { quarter: 'Q4 2025', amount: 4.36 },
    { quarter: 'Q1 2026', amount: 3.91 },
    { quarter: 'Q2 2026', amount: 3.94 },
    { quarter: 'Q3 2026', amount: 3.05 },
  ],
  commentary:
    'In October, the Fixed Income market traded on a bearish note. The secondary market average benchmark yield in the bonds market rose to 16.23% (+54 bps), while at the October 2026 FGN Bond Primary Market auction, the 2034, 2036 and 2038 maturities printed at 16.99%, 17.29% (+50 bps) and 17.19% (+34 bps). In the Sukuk market, average FGN Sukuk benchmark yields halted their bullish run, increasing by 72 basis points from 16.07% to 16.79%.',
  market_indicators: [
    { value: '15.39%', title: 'Inflation (Aug)', sub: 'Down from 15.43% in July 2026' },
    { value: '23.00%', title: 'Monetary Policy Rate', sub: 'Cut 350bps at the 307th MPC, 21 Sept 2026' },
    { value: '$54.93bn', title: 'FX Reserves', sub: 'As at 30 Sept 2026, up from $53.81bn at end-August' },
    { value: '4.43%', title: 'Real GDP Growth (Q2)', sub: 'Q2 2026 year-on-year, up from 3.89% in Q1 2026' },
  ],
  disclaimer:
    'Whilst proper and reasonable care has been taken in preparation and accuracy of the facts and figures presented in this report, no responsibility or liability is accepted by Norrenberger Asset Management Limited or its employees for any error, omission or opinion expressed herein. This report is not an investment research or a research recommendation and should not be regarded as such.',
  footer_note: 'Norrenberger Islamic Fund | Licensed and Regulated by the Securities and Exchange Commission (SEC) Nigeria',
};

export const SAMPLE_UPLOAD_CSV = `Symbol,Name,Shares,Avg_Price
DANGCEM,Dangote Cement PLC,120000,1380.00
MTNN,MTN Nigeria Communications PLC,180000,790.00
ARADEL,Aradel Holdings PLC,95000,1180.00
BUAFOODS,BUA Foods PLC,140000,740.00
SEPLAT,Seplat Energy PLC,15000,15200.00
PRESCO,Presco PLC,65000,1490.00
JAIZBANK,Jaiz Bank PLC,2500000,6.50
NASCON,Nascon Allied Industries PLC,300000,155.00
ZENITHBANK,Zenith Bank PLC,850000,110.00
NB,Nigerian Breweries PLC,420000,68.00`;

export function formatNaira(amount, compact = false) {
  const num = Number(amount || 0);
  if (compact) {
    if (Math.abs(num) >= 1e12) return `₦${(num / 1e12).toFixed(2)}tn`;
    if (Math.abs(num) >= 1e9) return `₦${(num / 1e9).toFixed(2)}bn`;
    if (Math.abs(num) >= 1e6) return `₦${(num / 1e6).toFixed(2)}m`;
  }
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
