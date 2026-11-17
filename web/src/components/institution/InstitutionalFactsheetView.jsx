import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Printer, ShieldCheck, CheckCircle2, SlidersHorizontal, FileText, LayoutGrid
} from 'lucide-react';
import {
  LOTUS_FALLBACK_DATA,
  NORRENBERGER_FALLBACK_DATA,
  BALANCED_FALLBACK_DATA,
  formatNaira,
  computeFundValidation,
} from './institutionalFixtures';
import InstitutionalFundInputsDrawer from './InstitutionalFundInputsDrawer';

// Official Irshad Brand Palette (Deep Forest Teal, Irshad Teal, Irshad Mint, Antique Gold)
const IRSHAD = {
  forest: '#1E4D40',
  forestDark: '#13372D',
  teal: '#297D66',
  mint: '#45A58A',
  mintSoft: '#74C6A9',
  gold: '#D1A562',
  goldDark: '#856527',
  goldBg: '#F9F5EB',
  canvas: '#F7FCF9',
  border: '#DCECE4',
  slate: '#64748B',
};

const IRSHAD_CHART_PALETTE = [
  '#1E4D40',
  '#297D66',
  '#45A58A',
  '#74C6A9',
  '#D1A562',
  '#856527',
  '#64748B',
];

function AaoifiGaugeBar({ label, value, threshold, suffix = '%' }) {
  const numericVal = value === null || value === undefined ? null : Number(value);
  const pctFill = numericVal === null ? 0 : Math.min(100, (numericVal / threshold) * 100);
  const isBreach = numericVal !== null && numericVal >= threshold;
  const isNear = numericVal !== null && !isBreach && numericVal >= threshold * 0.8;
  const barColor = isBreach ? '#B91C1C' : isNear ? IRSHAD.goldDark : IRSHAD.teal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem' }}>
        <span style={{ color: '#334155', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 800, color: numericVal === null ? IRSHAD.slate : barColor }}>
          {numericVal === null ? 'N/A' : `${numericVal.toFixed(2)}${suffix}`}{' '}
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>/ &lt;{threshold}{suffix}</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
        <div style={{
          width: `${pctFill}%`,
          height: '100%',
          borderRadius: 999,
          background: barColor,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function RiskScaleSeven({ level = 4, max = 7 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 4 }}>
      {Array.from({ length: max }, (_, idx) => idx + 1).map((step) => (
        <div
          key={step}
          style={{
            height: 10,
            borderRadius: 2,
            background: step <= level
              ? (step >= 5 ? IRSHAD.goldDark : IRSHAD.teal)
              : '#E2E8F0',
          }}
        />
      ))}
    </div>
  );
}

function ShariahComplianceBanner({
  guidanceText,
  screensLabel,
  screensDetail,
  purificationAmount,
  purificationNote,
  zakatAmount,
  zakatNote,
  footerRuleText,
}) {
  return (
    <section style={{
      background: `linear-gradient(135deg, ${IRSHAD.forestDark} 0%, ${IRSHAD.forest} 55%, ${IRSHAD.teal} 100%)`,
      color: '#FFFFFF',
      borderRadius: 12,
      padding: '18px 22px',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: IRSHAD.mintSoft, marginBottom: 12 }}>
        SHARI&apos;AH COMPLIANCE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 18 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: IRSHAD.mintSoft, fontWeight: 700, marginBottom: 4 }}>Guidance</div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>
            {guidanceText}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: IRSHAD.mintSoft, fontWeight: 700, marginBottom: 4 }}>{screensLabel}</div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>
            {screensDetail}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: IRSHAD.mintSoft, fontWeight: 700, marginBottom: 4 }}>Purification</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.15 }}>
            {purificationAmount} <span style={{ fontSize: '0.74rem', fontWeight: 600, opacity: 0.9 }}>per unit</span>
          </div>
          <div style={{ fontSize: '0.71rem', lineHeight: 1.45, opacity: 0.85, marginTop: 4 }}>{purificationNote}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: IRSHAD.mintSoft, fontWeight: 700, marginBottom: 4 }}>Zakat (Indicative)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.15, color: '#FDE68A' }}>
            {zakatAmount} <span style={{ fontSize: '0.74rem', fontWeight: 600, opacity: 0.9 }}>per unit</span>
          </div>
          <div style={{ fontSize: '0.71rem', lineHeight: 1.45, opacity: 0.85, marginTop: 4 }}>{zakatNote}</div>
        </div>
      </div>
      {footerRuleText && (
        <div style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.45,
        }}>
          {footerRuleText}
        </div>
      )}
    </section>
  );
}

export default function InstitutionalFactsheetView({
  lotusData,
  norrenbergerData,
  balancedData,
  screened,
  activePresetId,
  customFundName,
  institutionName,
  factsheetMeta,
  onChangeFactsheetMeta,
  allowedTemplates = ['lotus', 'norrenberger', 'custom'],
}) {
  void allowedTemplates;
  const [viewMode, setViewMode] = useState('summary'); // 'summary' (One-Page Summary) | 'full' (7-Section Fact Sheet)
  const [showInputsDrawer, setShowInputsDrawer] = useState(false);

  const isLotus = activePresetId === 'lotus_etf';
  const isNorrenberger = activePresetId === 'norrenberger_fund';
  const isBalanced = activePresetId === 'balanced_fund';
  const isFixedOrBalanced = isNorrenberger || isBalanced;

  const lotus = useMemo(() => ({ ...LOTUS_FALLBACK_DATA, ...(lotusData || {}) }), [lotusData]);
  const norren = useMemo(() => ({ ...NORRENBERGER_FALLBACK_DATA, ...(norrenbergerData || {}) }), [norrenbergerData]);
  const balanced = useMemo(() => ({ ...BALANCED_FALLBACK_DATA, ...(balancedData || {}) }), [balancedData]);

  const holdings = useMemo(() => {
    if (isLotus) return lotusData?.screening_result?.holdings || screened?.holdings || [];
    if (isBalanced) return balancedData?.screening_result?.holdings || screened?.holdings || [];
    return screened?.holdings || [];
  }, [isLotus, isBalanced, lotusData?.screening_result?.holdings, balancedData?.screening_result?.holdings, screened?.holdings]);

  const summary = useMemo(() => {
    if (isLotus) return lotusData?.screening_result?.summary || screened?.summary || {};
    if (isBalanced) return balancedData?.screening_result?.summary || screened?.summary || {};
    return screened?.summary || {};
  }, [isLotus, isBalanced, lotusData?.screening_result?.summary, balancedData?.screening_result?.summary, screened?.summary]);

  const sectors = useMemo(() => {
    if (isLotus) return lotus.sector_allocation || screened?.sector_allocation || [];
    return screened?.sector_allocation || [];
  }, [isLotus, lotus.sector_allocation, screened?.sector_allocation]);

  const healthMetrics = useMemo(() => {
    if (summary?.weighted_debt_ratio !== undefined || summary?.weighted_impure_ratio !== undefined) {
      return {
        debt: summary.weighted_debt_ratio ?? null,
        cash: summary.weighted_cash_ratio ?? null,
        impure: summary.weighted_impure_ratio ?? 0,
        nearCount: summary.near_threshold_count ?? holdings.filter((h) => h.is_near_threshold).length,
      };
    }
    let totalMv = 0;
    let debtSum = 0;
    let debtW = 0;
    let cashSum = 0;
    let cashW = 0;
    let impureSum = 0;
    let near = 0;
    holdings.forEach((h) => {
      const mv = Number(h.market_value || 0);
      totalMv += mv;
      if (h.is_near_threshold) near++;
      if (h.debt_ratio !== null && h.debt_ratio !== undefined && mv > 0) {
        debtW += mv;
        debtSum += mv * Number(h.debt_ratio);
      }
      if (h.cash_ratio !== null && h.cash_ratio !== undefined && mv > 0) {
        cashW += mv;
        cashSum += mv * Number(h.cash_ratio);
      }
      if (mv > 0) impureSum += mv * Number(h.impure_ratio || 0);
    });
    return {
      debt: debtW > 0 ? debtSum / debtW : null,
      cash: cashW > 0 ? cashSum / cashW : null,
      impure: totalMv > 0 ? impureSum / totalMv : 0,
      nearCount: near,
    };
  }, [holdings, summary]);

  const defaults = useMemo(() => {
    if (isLotus) {
      return {
        institution_name: lotus.institution_name,
        fund_name: lotus.fund_name,
        subtitle: "Shari'ah-compliant equity exchange traded fund tracking the NGX Lotus Islamic Index",
        mandate_type: 'Shariah Equity ETF',
        ticker: lotus.ticker,
        bloomberg_ticker: lotus.bloomberg_ticker,
        isin: lotus.isin,
        factsheet_date: lotus.factsheet_date,
        currency: lotus.currency,
        fund_size_ngn: lotus.fund_size_ngn,
        nav_per_unit: lotus.nav_per_unit,
        closing_price: lotus.closing_price,
        units_in_issue: lotus.units_in_issue,
        expense_ratio_pct: lotus.expense_ratio_pct,
        management_fee: lotus.management_fee,
        bid_offer_spread_pct: lotus.bid_offer_spread_pct,
        replication: lotus.replication,
        holding_period: lotus.holding_period,
        last_distribution: lotus.last_distribution,
        benchmark: lotus.benchmark_index,
        rebalancing_frequency: lotus.rebalancing_frequency,
        risk_level: lotus.risk_rating || 6,
        risk_label: lotus.risk_label || '6 of 7',
        volatility_3y_pct: lotus.volatility_3y_pct || 24.5,
        purification_per_unit_input: lotus.purification_per_unit_fy25,
        zakat_per_unit_input: lotus.zakat_per_unit,
        parties: lotus.parties,
        fee_lines: lotus.fee_lines,
        objective: lotus.overview,
        commentary: lotus.index_commentary,
        investor_profile: lotus.investor_profile,
        benefits: lotus.benefits,
        contact: lotus.contact,
        disclaimer: lotus.disclaimer,
        shariah_board: lotus.parties?.shariah_board,
        approved_by: 'Lotus Investment & Shariah Committee',
      };
    }

    if (isBalanced) {
      return {
        institution_name: balanced.institution_name,
        fund_name: balanced.fund_name,
        subtitle: balanced.subtitle,
        mandate_type: 'Balanced Islamic Fund (60/40)',
        ticker: 'IRSH-BAL6040',
        isin: 'NGIRSHBAL6040',
        factsheet_date: balanced.factsheet_date,
        currency: 'Naira (NGN)',
        fund_size_ngn: balanced.fund_size_ngn,
        nav_per_unit: balanced.unit_price,
        closing_price: null,
        units_in_issue: balanced.units_in_issue,
        expense_ratio_pct: balanced.expense_ratio_pct,
        management_fee: balanced.management_fee,
        holding_period: balanced.holding_period,
        last_distribution: `Q3 2026: ₦3.05/unit (TTM: ₦${balanced.trailing_12m_distribution})`,
        benchmark: balanced.benchmark,
        rebalancing_frequency: 'Monthly / Quarterly',
        risk_level: balanced.risk_rating,
        risk_label: balanced.risk_label,
        volatility_3y_pct: balanced.volatility_3y_pct,
        purification_per_unit_input: balanced.purification_per_unit_fy25,
        zakat_per_unit_input: balanced.zakat_per_unit,
        parties: balanced.parties,
        fee_lines: balanced.fee_lines,
        allocation_list: balanced.allocation,
        objective: balanced.objective,
        commentary: 'Blended 40% screened NGX equity sleeve with 60% FGN Sukuk, Corporate Sukuk, Mudarabah, and Murabaha placements. Equity purification applies solely to the 40% equity sleeve.',
        investor_profile: 'Built for institutions, endowments, and retail ethical investors seeking both equity upside and regular quarterly non-interest distributions.',
        benefits: ['60% certified Sukuk & Mudarabah income floor', '40% live AAOIFI-screened NGX equity growth', 'Quarterly cash distributions', 'Daily liquidity within 3 business days'],
        contact: 'Buy through the fund manager platform or authorised distributor · iirshad.com',
        disclaimer: 'Figures blend the 3 July 2026 screened NGX equity weights scaled to 40% with October 2026 Islamic fixed-income market context. Indicative simulation for institutional reporting.',
        shariah_board: balanced.parties?.shariah_board,
        approved_by: 'Irshad Institutional Compliance',
      };
    }

    if (isNorrenberger) {
      return {
        institution_name: norren.institution_name,
        fund_name: norren.fund_name,
        subtitle: "Open-ended Shari'ah-compliant fixed-income fund investing in investment-grade Sukuk and non-interest placements",
        mandate_type: 'Islamic Fixed Income Fund',
        ticker: 'NORR-ISLAMIC',
        isin: 'NGNORRENIS01',
        factsheet_date: norren.factsheet_date,
        currency: 'Naira (NGN)',
        fund_size_ngn: 6810000000,
        nav_per_unit: 108.27,
        closing_price: null,
        units_in_issue: 62900000,
        expense_ratio_pct: 1.90,
        management_fee: '1.50% p.a.',
        holding_period: 'Minimum 90–180 days recommended',
        last_distribution: 'Q3 2026: ₦3.05/unit',
        benchmark: norren.benchmark,
        rebalancing_frequency: 'Monthly',
        risk_level: 2,
        risk_label: 'Conservative, 2 of 7',
        volatility_3y_pct: 3.4,
        purification_per_unit_input: 0.00,
        zakat_per_unit_input: 2.71,
        parties: {
          fund_manager: norren.institution_name,
          sec_status: 'SEC Nigeria Licensed & Regulated',
          shariah_board: 'Irshad Tech Ltd & Certified Sukuk Shariah Panel',
        },
        fee_lines: [
          { label: 'Management Fee', pct: 1.50 },
          { label: 'Custody, Trustee & Audit', pct: 0.40 },
        ],
        allocation_list: norren.allocation,
        objective: norren.objective,
        commentary: norren.commentary,
        investor_profile: 'Suitable for institutional treasuries, Takaful operators, and investors seeking steady non-interest liquidity.',
        benefits: ['Capital preservation in Sukuk & Mudarabah contracts', 'Quarterly distribution payouts', 'SEC Nigeria & Shariah supervision', 'Benchmark outperformance (+99 bps YTD)'],
        contact: norren.footer_note,
        disclaimer: norren.disclaimer,
        shariah_board: 'Irshad Tech Ltd & Fund Shariah Panel',
        approved_by: 'Norrenberger Asset Management',
      };
    }

    const totalAum = Number(summary.total_aum || 0);
    return {
      institution_name: institutionName || 'Irshad Institutional Shariah Desk',
      fund_name: customFundName || 'Institutional Screened Equity Mandate',
      subtitle: "Live AAOIFI Standard No. 21 screened institutional equity portfolio & purification schedule",
      mandate_type: 'Screened Equity Mandate',
      ticker: 'IRSHAD-MANDATE',
      isin: 'NG-INST-SCREEN',
      factsheet_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      currency: 'Naira (NGN)',
      fund_size_ngn: totalAum,
      nav_per_unit: null,
      closing_price: null,
      units_in_issue: null,
      expense_ratio_pct: 0.75,
      management_fee: '0.75%',
      holding_period: 'Three years or more',
      last_distribution: 'Per corporate dividend calendar',
      benchmark: 'NGX Lotus Islamic Index (NGXLII)',
      rebalancing_frequency: 'Continuous / Pre-Trade',
      risk_level: 4,
      risk_label: 'Balanced Equity, 4 of 7',
      volatility_3y_pct: 18.2,
      purification_per_unit_input: null,
      zakat_per_unit_input: null,
      parties: {
        fund_manager: institutionName || 'Institutional Desk',
        sec_status: 'Institutional Compliance Mandate',
        shariah_board: 'Irshad Tech Ltd (AAOIFI Standard No. 21 Automated Engine)',
      },
      fee_lines: [
        { label: 'Management Fee', pct: 0.55 },
        { label: 'Custody & Shariah Compliance', pct: 0.20 },
      ],
      objective: 'Achieve long-term ethical capital appreciation strictly within AAOIFI Standard No. 21 boundaries (<30% debt, <30% interest-bearing cash, <5% impermissible revenue) with automated dividend purification.',
      commentary: Number(summary.non_compliant_count || 0) > 0
        ? `Irshad detected ${summary.non_compliant_count} non-compliant position(s) totaling ${Number(summary.non_compliant_pct || 0).toFixed(1)}% of AUM. Remediation replacements have been identified.`
        : 'All portfolio holdings satisfy AAOIFI qualitative business screens and quantitative debt, cash, and impermissible income thresholds.',
      investor_profile: 'Built for Pension Fund Administrators (PFAs), Islamic asset managers, trustees, and institutional brokerage compliance desks.',
      benefits: ['Live AAOIFI screening tied to NGX filings', 'Per-unit & total purification liability tracking', 'Indicative 2.5% zakat computation', 'Drift Watch alerts for threshold proximity'],
      contact: `${institutionName || 'Irshad Institutional'} · Powered by Irshad Tech Ltd (iirshad.com)`,
      disclaimer: 'Ratios, verdicts, and purification figures reflect live NGX corporate disclosures evaluated under AAOIFI Standard No. 21 via Irshad Tech Ltd.',
      shariah_board: 'Irshad Tech Ltd Automated AAOIFI Audit',
      approved_by: '',
    };
  }, [isLotus, isBalanced, isNorrenberger, lotus, balanced, norren, institutionName, customFundName, summary]);

  const meta = useMemo(() => ({ ...defaults, ...(factsheetMeta || {}) }), [defaults, factsheetMeta]);

  const navVal = Number(meta.nav_per_unit || 0);
  const priceVal = Number(meta.closing_price || 0);
  const premiumPct = navVal > 0 && priceVal > 0 ? ((priceVal / navVal) - 1) * 100 : null;
  const fundSizeVal = Number(meta.fund_size_ngn || summary.total_aum || 0);
  const unitsVal = Number(meta.units_in_issue || (navVal > 0 && fundSizeVal > 0 ? Math.round(fundSizeVal / navVal) : 0));

  const purificationPerUnit = meta.purification_per_unit_input !== null && meta.purification_per_unit_input !== undefined
    ? Number(meta.purification_per_unit_input)
    : Number(summary.weighted_purification_per_unit || 0);

  const zakatPerUnit = meta.zakat_per_unit_input !== null && meta.zakat_per_unit_input !== undefined
    ? Number(meta.zakat_per_unit_input)
    : (Number(summary.indicative_zakat_per_unit || 0) > 0
      ? Number(summary.indicative_zakat_per_unit)
      : (navVal > 0 ? navVal * 0.025 : 0));

  const top5Pct = isLotus
    ? (lotus.top_5_concentration_pct || 66.5)
    : Number(summary.top_5_concentration_pct || holdings.slice(0, 5).reduce((s, h) => s + Number(h.weight_pct || 0), 0));

  const topHoldingsBars = useMemo(() => {
    if (holdings.length === 0) return [];
    const top6 = holdings.slice(0, 6).map((h) => ({
      name: h.name || h.symbol,
      symbol: h.symbol,
      weight: Number(h.weight_pct || 0),
      isOther: false,
    }));
    const restWeight = holdings.slice(6).reduce((acc, h) => acc + Number(h.weight_pct || 0), 0);
    if (holdings.length > 6 && restWeight > 0) {
      top6.push({
        name: `Other ${holdings.length - 6} holdings`,
        symbol: 'OTHER',
        weight: Number(restWeight.toFixed(2)),
        isOther: true,
      });
    }
    return top6;
  }, [holdings]);

  const validation = useMemo(
    () => computeFundValidation(meta, holdings, summary, isNorrenberger, isBalanced),
    [meta, holdings, summary, isNorrenberger, isBalanced]
  );

  // Build uniform 5 Hero KPI Cards matching 1.b & 2.b
  const heroKpis = useMemo(() => {
    if (isFixedOrBalanced) {
      return [
        { label: 'UNIT PRICE', value: navVal > 0 ? `₦${navVal.toFixed(2)}` : '₦108.27', highlight: false },
        { label: 'YIELD, YEAR TO DATE', value: `${isBalanced ? balanced.ytd_yield : norren.ytd_yield}%`, highlight: false },
        { label: 'FUND SIZE', value: fundSizeVal > 0 ? formatNaira(fundSizeVal, true) : '₦6.81bn', highlight: false },
        { label: 'TOTAL EXPENSE RATIO', value: `${Number(meta.expense_ratio_pct || 1.60).toFixed(2)}%`, highlight: false },
        { label: 'RISK RATING', value: meta.risk_label || `${meta.risk_level} of 7`, highlight: true },
      ];
    }
    if (navVal > 0 && priceVal > 0) {
      return [
        { label: 'NAV PER UNIT', value: `₦${navVal.toFixed(2)}`, highlight: false },
        { label: 'NGX PRICE', value: `₦${priceVal.toFixed(2)}`, highlight: false },
        {
          label: premiumPct >= 0 ? 'PREMIUM TO NAV' : 'DISCOUNT TO NAV',
          value: `${premiumPct >= 0 ? '+' : ''}${premiumPct.toFixed(1)}%`,
          highlight: true,
        },
        { label: 'FUND SIZE', value: formatNaira(fundSizeVal, true), highlight: false },
        { label: 'EXPENSE RATIO', value: `${Number(meta.expense_ratio_pct || 0.95).toFixed(2)}%`, highlight: false },
      ];
    }
    return [
      { label: 'SCREENED AUM', value: formatNaira(summary.total_aum || 0, true), highlight: false },
      { label: 'SHARIAH PASS RATE', value: `${Number(summary.compliant_pct || 0).toFixed(1)}%`, highlight: false },
      {
        label: 'TOP 5 CONCENTRATION',
        value: `${top5Pct.toFixed(1)}%`,
        highlight: Number(summary.non_compliant_count || 0) > 0,
      },
      { label: 'TOTAL PURIFICATION DUE', value: formatNaira(summary.total_purification_due || 0), highlight: false },
      { label: 'RISK RATING', value: meta.risk_label || `${meta.risk_level} of 7`, highlight: true },
    ];
  }, [isFixedOrBalanced, isBalanced, balanced.ytd_yield, norren.ytd_yield, navVal, priceVal, premiumPct, fundSizeVal, meta, summary, top5Pct]);

  const activeAllocationList = useMemo(() => {
    if (isBalanced) return balanced.allocation;
    if (isNorrenberger) return norren.allocation;
    return [];
  }, [isBalanced, isNorrenberger, balanced.allocation, norren.allocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Executive Control Toolbar */}
      <div className="no-print" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, padding: '12px 18px', borderRadius: 14,
        background: 'var(--bg)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setViewMode('summary')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 13px', borderRadius: 10, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              border: `1.5px solid ${viewMode === 'summary' ? IRSHAD.teal : 'var(--border)'}`,
              background: viewMode === 'summary' ? 'rgba(69, 165, 138, 0.12)' : 'var(--bg-section)',
              color: viewMode === 'summary' ? IRSHAD.forest : 'var(--text-muted)',
            }}
          >
            <LayoutGrid size={14} /> One-Page Summary
          </button>
          <button
            type="button"
            onClick={() => setViewMode('full')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 13px', borderRadius: 10, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              border: `1.5px solid ${viewMode === 'full' ? IRSHAD.teal : 'var(--border)'}`,
              background: viewMode === 'full' ? 'rgba(69, 165, 138, 0.12)' : 'var(--bg-section)',
              color: viewMode === 'full' ? IRSHAD.forest : 'var(--text-muted)',
            }}
          >
            <FileText size={14} /> Full 7-Section Fact Sheet
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            padding: '6px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800,
            background: validation.passCount === validation.totalChecks ? 'var(--halal-bg)' : IRSHAD.goldBg,
            color: validation.passCount === validation.totalChecks ? IRSHAD.teal : IRSHAD.goldDark,
          }}>
            {validation.passCount}/{validation.totalChecks} Checks Verified
          </span>
          <button
            type="button"
            onClick={() => setShowInputsDrawer((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: showInputsDrawer ? 'var(--primary-50)' : 'var(--bg-section)',
              color: showInputsDrawer ? IRSHAD.forest : 'var(--text-dark)',
              border: `1px solid ${showInputsDrawer ? IRSHAD.teal : 'var(--border-strong)'}`,
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={14} /> {showInputsDrawer ? 'Hide Manager Inputs' : 'Fund Setup & Checks'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 10,
              background: IRSHAD.forest, color: '#fff',
              border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Collapsible 10-Group Manager Inputs & Validation Gate */}
      {showInputsDrawer && (
        <InstitutionalFundInputsDrawer
          meta={meta}
          onChangeMeta={onChangeFactsheetMeta}
          holdings={holdings}
          summary={summary}
          isNorrenberger={isNorrenberger}
          isBalanced={isBalanced}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* IRSHAD UNIFORM DOCUMENT CANVAS (ONE-PAGE SUMMARY & FULL FACT SHEET)  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <article className="institutional-factsheet-sheet" style={{
        background: IRSHAD.canvas,
        color: '#111827',
        borderRadius: 16,
        border: `1px solid ${IRSHAD.border}`,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        fontFamily: 'var(--sans)',
      }}>
        {/* SIGNATURE IRSHAD DEEP FOREST MASTHEAD */}
        <header style={{
          background: `linear-gradient(135deg, ${IRSHAD.forestDark} 0%, ${IRSHAD.forest} 60%, ${IRSHAD.teal} 100%)`,
          color: '#FFFFFF',
          padding: '22px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: IRSHAD.mintSoft, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              {meta.institution_name} · {meta.mandate_type}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
              {meta.fund_name}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.86)' }}>
              {meta.subtitle}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1.2px', color: IRSHAD.mintSoft, textTransform: 'uppercase' }}>
              {viewMode === 'summary' ? 'ONE-PAGE SUMMARY' : 'INSTITUTIONAL FACT SHEET'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, marginTop: 2 }}>{meta.factsheet_date}</div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>
              NGX / Ref: <strong>{meta.ticker}</strong>
            </div>
          </div>
        </header>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 5 HERO KPI TILES (Matching 1.b & 2.b) */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
          }}>
            {heroKpis.map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: kpi.highlight
                    ? `linear-gradient(135deg, ${IRSHAD.goldDark} 0%, #6D511E 100%)`
                    : '#FFFFFF',
                  color: kpi.highlight ? '#FFFFFF' : '#111827',
                  border: kpi.highlight ? 'none' : `1px solid ${IRSHAD.border}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <div style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: kpi.highlight ? 'rgba(255,255,255,0.85)' : IRSHAD.slate,
                }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '1.38rem', fontWeight: 900, marginTop: 5, lineHeight: 1.15 }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </section>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* MODE 1: ONE-PAGE SUMMARY (1.b & 2.b Architecture)               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {viewMode === 'summary' && (
            <>
              {isFixedOrBalanced ? (
                <>
                  {/* Balanced / Fixed-Income Row 1: Monthly Yield Chart + Fund Allocation Donut */}
                  <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                        Monthly Yield Against Benchmark, 2026, %
                      </div>
                      <div style={{ height: 195 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={isBalanced ? balanced.monthly_yield_2026 : norren.monthly_performance_2026}
                            margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 21]} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="yield" name="Fund yield" fill={IRSHAD.forest} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="benchmark" name={isBalanced ? 'Blended benchmark' : 'Benchmark'} fill={IRSHAD.gold} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, marginTop: 8 }}>
                        Yield is the annualised income yield on NAV. Scale runs to 20%+.
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                        Fund Allocation
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '165px 1fr', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative', height: 170 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={activeAllocationList} dataKey="current" nameKey="security" innerRadius={48} outerRadius={76} paddingAngle={1.5}>
                                {activeAllocationList.map((entry, i) => (
                                  <Cell key={entry.security} fill={IRSHAD_CHART_PALETTE[i % IRSHAD_CHART_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center',
                          }}>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: IRSHAD.forest }}>
                              {isBalanced ? '60/40' : '100%'}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: IRSHAD.slate, fontWeight: 700, lineHeight: 1.2 }}>
                              {isBalanced ? 'fixed / equity' : 'Islamic FI'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {activeAllocationList.map((row, idx) => (
                            <div key={row.security} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontWeight: 600 }}>
                                <span style={{ width: 9, height: 9, borderRadius: 2, background: IRSHAD_CHART_PALETTE[idx % IRSHAD_CHART_PALETTE.length], display: 'inline-block' }} />
                                {row.security}
                              </span>
                              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{row.current.toFixed(2)}%</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Balanced / Fixed-Income Row 2: Maturity Profile + Distributions */}
                  <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                        Maturity Profile, % of Fund
                      </div>
                      <div style={{ height: 170 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={isBalanced ? balanced.maturity_profile : norren.maturity_profile}
                            margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Bar dataKey="pct" name="% Share" radius={[4, 4, 0, 0]}>
                              {(isBalanced ? balanced.maturity_profile : norren.maturity_profile).map((entry) => (
                                <Cell key={entry.bucket} fill={entry.bucket === 'Equity' ? IRSHAD.forest : IRSHAD.gold} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, marginTop: 6 }}>
                        {isBalanced
                          ? 'Fixed income is 60% of the fund, spread across three maturity bands. Equity has no maturity.'
                          : 'Majority of Sukuk & Murabaha paper matures inside 12 months for daily liquidity.'}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                          Distribution Per Unit (₦)
                        </div>
                        <div style={{ height: 155 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={isBalanced ? balanced.distribution_per_unit : norren.distribution_per_unit}
                              margin={{ top: 8, right: 10, left: -14, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                              <YAxis domain={[2.5, 4.8]} tick={{ fontSize: 10 }} />
                              <Tooltip formatter={(v) => `₦${v}`} />
                              <Line type="monotone" dataKey="amount" name="Distribution (₦)" stroke={IRSHAD.forest} strokeWidth={2.6} dot={{ r: 4, fill: IRSHAD.forest }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${IRSHAD.border}`, paddingTop: 10, fontSize: '0.78rem' }}>
                        <span style={{ color: IRSHAD.slate, fontWeight: 600 }}>Trailing 12 months</span>
                        <strong style={{ fontSize: '0.92rem', color: IRSHAD.forest }}>
                          {isBalanced ? `₦${balanced.trailing_12m_distribution.toFixed(2)} per unit` : '₦14.81 per unit'}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* Balanced / Fixed-Income Row 3: Performance Strip + Risk Profile */}
                  <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 12 }}>
                        Performance, % Return
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        {(isBalanced
                          ? balanced.performance_metrics
                          : norren.historical_performance.map((h) => ({ label: h.period, value: `${h.yield}%` }))
                        ).map((pm) => (
                          <div key={pm.label}>
                            <div style={{ fontSize: '0.63rem', fontWeight: 800, color: IRSHAD.slate, textTransform: 'uppercase' }}>{pm.label}</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111827', marginTop: 3 }}>{pm.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, marginTop: 12 }}>
                        {isBalanced
                          ? `Blended benchmark: 33.10 YTD, 38.70 for 1Y. Tracking difference: ${balanced.tracking_difference_ytd} YTD.`
                          : `FGN 3-Year Sukuk benchmark outperformed by +99 bps YTD (17.72% vs 16.73%).`}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                          Risk Profile ({meta.risk_label})
                        </div>
                        <RiskScaleSeven level={Number(meta.risk_level || 4)} max={7} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: IRSHAD.slate, marginTop: 6 }}>
                          <span>Lower risk</span>
                          <span>Higher risk</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: IRSHAD.slate, marginTop: 12 }}>
                        Volatility <strong>{meta.volatility_3y_pct}%</strong> a year over three years. Recommended holding period: {meta.holding_period}.
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  {/* EQUITY ONE-PAGE SUMMARY ROW 1: Performance Grouped Bars + Price Against NAV */}
                  <section style={{ display: 'grid', gridTemplateColumns: isLotus || (navVal > 0 && priceVal > 0) ? '1.35fr 1fr' : '1fr', gap: 16 }} className="mobile-col">
                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest }}>
                          {isLotus ? 'Performance, % Return' : 'Top Holdings Weight (%) & AAOIFI Impermissible Ratio (%)'}
                        </span>
                      </div>
                      <div style={{ height: 195 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {isLotus ? (
                            <BarChart data={lotus.multi_period_returns} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip formatter={(v) => `${v}%`} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar dataKey="fund" name="Fund NAV" fill={IRSHAD.forest} radius={[3, 3, 0, 0]} />
                              <Bar dataKey="benchmark" name="Islamic index" fill={IRSHAD.gold} radius={[3, 3, 0, 0]} />
                              <Bar dataKey="all_share" name="All-Share" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          ) : (
                            <BarChart data={holdings.slice(0, 8)} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar dataKey="weight_pct" name="Portfolio Weight %" fill={IRSHAD.forest} radius={[3, 3, 0, 0]} />
                              <Bar dataKey="impure_ratio" name="Impure Rev %" fill={IRSHAD.gold} radius={[3, 3, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, marginTop: 8 }}>
                        {isLotus
                          ? `NAV trails index by ${Math.abs(lotus.tracking_difference_ytd_pct)} pts YTD. 3-year tracking error: ${lotus.tracking_error_3y_pct}%. Returns net of costs.`
                          : `Top 5 holding concentration: ${top5Pct.toFixed(1)}% · Portfolio weighted impure income: ${Number(healthMetrics.impure || 0).toFixed(2)}% (<5.0% limit).`}
                      </div>
                    </div>

                    {(isLotus || (navVal > 0 && priceVal > 0)) && (
                      <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                            Price Against NAV
                          </div>
                          <div style={{ height: 175 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { label: 'NAV', amount: navVal },
                                  { label: 'Market', amount: priceVal },
                                ]}
                                margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => `₦${Number(v).toFixed(2)}`} />
                                <Bar dataKey="amount" name="₦ per Unit" radius={[4, 4, 0, 0]} barSize={58}>
                                  <Cell fill={IRSHAD.forest} />
                                  <Cell fill={IRSHAD.gold} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.45, borderTop: `1px solid ${IRSHAD.border}`, paddingTop: 8 }}>
                          {premiumPct > 0 ? (
                            <>A buyer at market price pays <strong>{premiumPct.toFixed(1)}% more</strong> than the underlying shares are worth. Compare price with NAV before trading.</>
                          ) : (
                            <>Market price trades at <strong>{Math.abs(premiumPct || 0).toFixed(1)}% discount</strong> relative to underlying equity NAV.</>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* EQUITY ONE-PAGE SUMMARY ROW 2: Sector Allocation Donut + Largest Holdings Horizontal Bars */}
                  <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                          Sector Allocation
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '165px 1fr', gap: 12, alignItems: 'center' }}>
                          <div style={{ position: 'relative', height: 170 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={sectors} dataKey="weight_pct" nameKey="sector" innerRadius={48} outerRadius={76} paddingAngle={1.5}>
                                  {sectors.map((s, idx) => (
                                    <Cell key={s.sector} fill={IRSHAD_CHART_PALETTE[idx % IRSHAD_CHART_PALETTE.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                            }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: IRSHAD.forest }}>{holdings.length}</span>
                              <span style={{ fontSize: '0.65rem', color: IRSHAD.slate, fontWeight: 700 }}>holdings</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sectors.slice(0, 7).map((s, idx) => (
                              <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontWeight: 600 }}>
                                  <span style={{ width: 9, height: 9, borderRadius: 2, background: IRSHAD_CHART_PALETTE[idx % IRSHAD_CHART_PALETTE.length], display: 'inline-block' }} />
                                  {s.sector}
                                </span>
                                <strong>{Number(s.weight_pct).toFixed(2)}%</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, borderTop: `1px solid ${IRSHAD.border}`, paddingTop: 8, marginTop: 10 }}>
                        {isLotus
                          ? `Index rebalanced ${lotus.rebalancing_frequency.toLowerCase()}. Last: ${lotus.last_rebalancing}. Next: ${lotus.next_rebalancing}.`
                          : 'Exposures derived live from evaluated holdings and NGX sector classifications.'}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 12 }}>
                          Largest Holdings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {topHoldingsBars.map((item) => (
                            <div key={item.symbol} style={{ display: 'grid', gridTemplateColumns: '125px 1fr 48px', alignItems: 'center', gap: 8, fontSize: '0.73rem' }}>
                              <span style={{ color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </span>
                              <div style={{ height: 10, borderRadius: 3, background: '#EDF2EF', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(100, (item.weight / 35) * 100)}%`,
                                  height: '100%',
                                  background: item.isOther ? '#94A3B8' : IRSHAD.teal,
                                  borderRadius: 3,
                                }} />
                              </div>
                              <span style={{ textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                                {item.weight.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, borderTop: `1px solid ${IRSHAD.border}`, paddingTop: 12, marginTop: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: IRSHAD.slate }}>TOP 5</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900 }}>{top5Pct.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: IRSHAD.slate }}>VOLATILITY</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900 }}>{Number(meta.volatility_3y_pct || 24.5).toFixed(1)}%</div>
                        </div>
                        <div style={{ flex: '1 1 130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontWeight: 800, color: IRSHAD.slate, marginBottom: 4 }}>
                            <span>RISK RATING</span>
                            <span>{meta.risk_level} of 7</span>
                          </div>
                          <RiskScaleSeven level={Number(meta.risk_level || 6)} max={7} />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* FULL-WIDTH SHARI'AH COMPLIANCE BANNER (Matching 1.b & 2.b) */}
              <ShariahComplianceBanner
                guidanceText={meta.shariah_board || meta.parties?.shariah_board}
                screensLabel={isNorrenberger ? 'Fixed income' : 'Screens'}
                screensDetail={isNorrenberger
                  ? 'Certified FGN & Corporate Sukuk and non-interest bank Mudarabah/Murabaha placements only. No conventional interest bonds.'
                  : `AAOIFI thresholds: debt (<30%: ${healthMetrics.debt !== null ? `${healthMetrics.debt.toFixed(1)}%` : 'OK'}), cash (<30%: ${healthMetrics.cash !== null ? `${healthMetrics.cash.toFixed(1)}%` : 'OK'}), impure income (<5%: ${Number(healthMetrics.impure || 0).toFixed(2)}%).`}
                purificationAmount={`₦${purificationPerUnit.toFixed(2)}`}
                purificationNote={isBalanced
                  ? 'Derived from the 40% equity sleeve only; donated to approved charities.'
                  : 'Deducted/quantified under AAOIFI rules for disbursement to approved charities.'}
                zakatAmount={`₦${zakatPerUnit.toFixed(2)}`}
                zakatNote="Indicative zakatable amount (2.5% basis). Each investor pays their own."
                footerRuleText={isNorrenberger
                  ? 'Strict compliance with SEC Nigeria non-interest fund rules and certified Islamic contracts.'
                  : 'Excludes conventional banking and insurance, alcohol, gambling, pork, tobacco, weapons and adult entertainment. Jaiz Bank is a non-interest bank, the only one listed on NGX.'}
              />

              {/* BOTTOM 2 CARDS: FUND FACTS & HOW TO INVEST */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 10 }}>
                    Fund Facts
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px', fontSize: '0.75rem' }}>
                    {[
                      ['Launched', isLotus ? lotus.launch_date : (isBalanced ? balanced.launch_date : (isNorrenberger ? norren.launch_date : meta.factsheet_date))],
                      ['Management fee', meta.management_fee],
                      ['Units in issue', unitsVal > 0 ? `${(unitsVal / 1e6).toFixed(1)} million` : `${holdings.length} positions`],
                      ['Last distribution', meta.last_distribution],
                      [isLotus ? 'Replication' : 'SEC Status', isLotus ? meta.replication : meta.parties?.sec_status],
                      ['Benchmark', meta.benchmark],
                      [isLotus ? 'Bid / offer spread' : 'ISIN / Ref', isLotus ? `${meta.bid_offer_spread_pct}%` : meta.isin],
                      ['Holding period', meta.holding_period],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>{k}</span>
                        <strong style={{ color: '#111827', textAlign: 'right' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: IRSHAD.forest, marginBottom: 8 }}>
                      How to Invest &amp; Contact
                    </div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: '#334155', lineHeight: 1.55 }}>
                      {meta.investor_profile}
                    </p>
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${IRSHAD.border}`, fontSize: '0.74rem', fontWeight: 700, color: IRSHAD.teal }}>
                    {meta.contact}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* MODE 2: FULL 7-SECTION FACT SHEET (Field Map Sections 1–7)      */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {viewMode === 'full' && (
            <>
              {/* Objective */}
              <section style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
                  Objective · Benchmark: {meta.benchmark}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>{meta.objective}</p>
              </section>

              {/* Sections 1, 2, 4 Grid */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                {/* 1. Fund Facts & Parties */}
                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                    1. Fund Facts &amp; Governance Parties
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.74rem' }}>
                    {[
                      ['Fund Manager', meta.parties?.fund_manager || meta.institution_name],
                      ['SEC Registration', meta.parties?.sec_status || 'SEC Nigeria Supervised'],
                      ['Trustee', meta.parties?.trustee || 'Registered Institutional Trustee'],
                      ['Custodian', meta.parties?.custodian || 'Licensed Custodian'],
                      ['Registrar / Auditor', `${meta.parties?.registrar || 'Approved'} / ${meta.parties?.auditor || 'External'}`],
                      ['Ticker / ISIN', `${meta.ticker} / ${meta.isin}`],
                      ['Rebalancing Cycle', meta.rebalancing_frequency],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4, gap: 8 }}>
                        <span style={{ color: IRSHAD.slate }}>{k}</span>
                        <strong style={{ textAlign: 'right' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Pricing, Valuation & Liquidity */}
                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                    2. Pricing, Valuation &amp; Liquidity
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.74rem' }}>
                    {[
                      ['Fund Size (AUM)', formatNaira(fundSizeVal)],
                      ['NAV / Unit Price', navVal > 0 ? `₦${navVal.toFixed(2)}` : 'Computed from equity holdings'],
                      ['NGX Closing Price', priceVal > 0 ? `₦${priceVal.toFixed(2)}` : 'N/A (Open-ended / Private book)'],
                      ['Premium / Discount to NAV', premiumPct !== null ? `${premiumPct >= 0 ? '+' : ''}${premiumPct.toFixed(2)}%` : 'N/A'],
                      ['Derived Units in Issue', unitsVal > 0 ? unitsVal.toLocaleString() : `${holdings.length} holdings`],
                      ['Last Distribution', meta.last_distribution],
                      ['Holding Period', meta.holding_period],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4, gap: 8 }}>
                        <span style={{ color: IRSHAD.slate }}>{k}</span>
                        <strong style={{ textAlign: 'right' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Fees, Portfolio Health & Risk */}
                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                      4. Fees &amp; Portfolio Risk Controls
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.74rem', marginBottom: 12 }}>
                      {(meta.fee_lines || []).map((fl) => (
                        <div key={fl.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                          <span style={{ color: IRSHAD.slate }}>{fl.label}</span>
                          <strong>{Number(fl.pct || 0).toFixed(2)}%</strong>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2, color: IRSHAD.forest }}>
                        <strong>Total Expense Ratio (TER)</strong>
                        <strong>{Number(meta.expense_ratio_pct || 0).toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>
                  {!isNorrenberger && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <AaoifiGaugeBar label="Weighted Debt / Cap" value={healthMetrics.debt} threshold={30} />
                      <AaoifiGaugeBar label="Weighted Cash & Int." value={healthMetrics.cash} threshold={30} />
                      <AaoifiGaugeBar label="Weighted Impure Rev." value={healthMetrics.impure} threshold={5} />
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Performance, Tracking & Benchmark Analysis + Mandate Contract Sleeves */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                    3. Performance &amp; Benchmark Tracking
                  </div>
                  {isLotus ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                      <thead>
                        <tr style={{ background: IRSHAD.forest, color: '#FFFFFF' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Metric</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>7D</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>30D</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>YTD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotus.performance_table.map((row) => (
                          <tr key={row.metric} style={{ borderBottom: `1px solid ${IRSHAD.border}` }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{row.metric}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: row.d7.startsWith('-') ? '#B91C1C' : IRSHAD.teal, fontWeight: 700 }}>{row.d7}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: row.d30.startsWith('-') ? '#B91C1C' : IRSHAD.teal, fontWeight: 700 }}>{row.d30}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: IRSHAD.forest, fontWeight: 800 }}>{row.ytd}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : isFixedOrBalanced ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {(isBalanced
                        ? balanced.performance_metrics
                        : norren.historical_performance.map((h) => ({ label: `${h.period} Yield`, value: `${h.yield}% (Bmk ${h.benchmark}%)` }))
                      ).map((row) => (
                        <div key={row.label} style={{ background: IRSHAD.canvas, border: `1px solid ${IRSHAD.border}`, borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: IRSHAD.slate, textTransform: 'uppercase' }}>{row.label}</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: IRSHAD.forest, marginTop: 2 }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>Benchmark Index</span>
                        <strong>{meta.benchmark}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>3Y Annualized Volatility</span>
                        <strong>{Number(meta.volatility_3y_pct || 18.2).toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: IRSHAD.slate }}>SEC Risk Classification</span>
                        <strong>{meta.risk_label}</strong>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: IRSHAD.slate, marginTop: 10, lineHeight: 1.45 }}>
                    {isLotus
                      ? `Last Rebalancing: ${lotus.last_rebalancing} · Next: ${lotus.next_rebalancing} · 3Y Tracking Error: ${lotus.tracking_error_3y_pct}%`
                      : `Rebalancing Frequency: ${meta.rebalancing_frequency} · Portfolio Commentary: ${meta.commentary}`}
                  </div>
                </div>

                {activeAllocationList.length > 0 ? (
                  <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                      5. Contract &amp; Sleeve Mandate Compliance
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                      <thead>
                        <tr style={{ background: IRSHAD.forest, color: '#FFFFFF' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Instrument / Contract</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Current</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Target Band</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Check</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAllocationList.map((row) => {
                          const outOfBand = row.current < row.target_min || row.current > row.target_max;
                          return (
                            <tr key={row.security} style={{ borderBottom: `1px solid ${IRSHAD.border}` }}>
                              <td style={{ padding: '6px 8px' }}>
                                <strong>{row.security}</strong> <span style={{ color: IRSHAD.slate }}>({row.shariah_contract})</span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{row.current.toFixed(2)}%</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: IRSHAD.slate }}>{row.target_label}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 7px', borderRadius: 999, fontSize: '0.64rem', fontWeight: 800,
                                  background: outOfBand ? IRSHAD.goldBg : 'rgba(69,165,138,0.12)',
                                  color: outOfBand ? IRSHAD.goldDark : IRSHAD.forest,
                                }}>
                                  {outOfBand ? 'Below Band' : 'Compliant'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase', marginBottom: 10 }}>
                      5. Portfolio Risk, Concentration &amp; Zakat Metrics
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>Top 5 Holding Concentration</span>
                        <strong>{top5Pct.toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>3Y Annualized Volatility</span>
                        <strong>{Number(meta.volatility_3y_pct || 24.5).toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F0', paddingBottom: 4 }}>
                        <span style={{ color: IRSHAD.slate }}>Indicative Zakatable Amount / Unit</span>
                        <strong style={{ color: IRSHAD.goldDark }}>₦{zakatPerUnit.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                        <span style={{ color: IRSHAD.slate }}>SEC Risk Scale ({meta.risk_level} of 7)</span>
                        <div style={{ width: 130 }}><RiskScaleSeven level={Number(meta.risk_level || 4)} max={7} /></div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 5 & 6. Full Constituent Screening & Purification Schedule */}
              {holdings.length > 0 && (
                <section style={{ background: '#FFFFFF', border: `1px solid ${IRSHAD.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: IRSHAD.forest, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      5 &amp; 6. Constituent Screening, AAOIFI Ratios &amp; Purification Schedule ({holdings.length})
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: IRSHAD.slate }}>
                      Top 5 Concentration: {top5Pct.toFixed(1)}% · Compliant AUM: {formatNaira(summary.compliant_aum || 0, true)}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto', border: `1px solid ${IRSHAD.border}`, borderRadius: 8 }}>
                    <table style={{ width: '100%', minWidth: 740, borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <thead>
                        <tr style={{ background: IRSHAD.forest, color: '#FFFFFF' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'center', width: 32 }}>#</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Security</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Units</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Market Value</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Weight</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Verdict</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Debt / Cash / Impure</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purify / Unit</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purification Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h, i) => {
                          const ok = h.status === 'halal';
                          return (
                            <tr key={h.symbol} style={{ borderBottom: `1px solid ${IRSHAD.border}`, background: i % 2 === 1 ? '#F9FCFA' : '#FFFFFF' }}>
                              <td style={{ padding: '7px 10px', textAlign: 'center', color: IRSHAD.slate, fontWeight: 700 }}>{i + 1}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <div style={{ fontWeight: 800 }}>{h.symbol}</div>
                                <div style={{ fontSize: '0.67rem', color: IRSHAD.slate }}>{h.name} · {h.sector}</div>
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>{Number(h.shares || 0).toLocaleString()}</td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{formatNaira(h.market_value)}</td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{Number(h.weight_pct || 0).toFixed(2)}%</td>
                              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800,
                                  background: ok ? 'rgba(69, 165, 138, 0.14)' : '#FEF2F2',
                                  color: ok ? IRSHAD.forest : '#B91C1C',
                                }}>
                                  {ok ? 'COMPLIANT' : String(h.status || 'NON-COMPLIANT').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569' }}>
                                {h.debt_ratio ?? '—'}% / {h.cash_ratio ?? '—'}% / {Number(h.impure_ratio || 0).toFixed(2)}%
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', color: IRSHAD.slate }}>
                                ₦{Number(h.purification_per_unit || 0).toFixed(4)}
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: IRSHAD.goldDark }}>
                                {formatNaira(h.purification_due)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#EFF7F3', fontWeight: 800, borderTop: `2px solid ${IRSHAD.border}` }}>
                          <td colSpan={3} style={{ padding: '8px 10px', color: IRSHAD.forest }}>TOTAL BOOK AUDIT</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatNaira(summary.total_aum)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>100.00%</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: IRSHAD.teal }}>{Number(summary.compliant_pct || 0).toFixed(1)}% Pass</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {healthMetrics.debt !== null ? `${healthMetrics.debt.toFixed(1)}%` : '—'} / {healthMetrics.cash !== null ? `${healthMetrics.cash.toFixed(1)}%` : '—'} / {Number(healthMetrics.impure || 0).toFixed(2)}%
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: IRSHAD.goldDark }}>₦{purificationPerUnit.toFixed(4)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: IRSHAD.goldDark }}>{formatNaira(summary.total_purification_due)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              )}

              {/* 7. How to Invest, Documents & Sign-Off Audit Trail */}
              <section style={{
                background: '#FFFFFF',
                border: `1px solid ${IRSHAD.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: IRSHAD.forest, textTransform: 'uppercase' }}>
                  7. How to Invest, Published Documents &amp; Contacts
                </div>
                <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.55 }}>
                  {meta.investor_profile} <strong>Contact / Source:</strong> {meta.contact}
                </div>
                <div style={{ fontSize: '0.71rem', color: IRSHAD.slate }}>
                  Official Reference Pack: Prospectus · Trust Deed · Audited Financial Statements · Shari&apos;ah Compliance Certificate
                </div>
                <div style={{
                  paddingTop: 10,
                  borderTop: `1px solid ${IRSHAD.border}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.74rem',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: IRSHAD.forest }}>
                    <ShieldCheck size={15} /> Shariah Board: {meta.shariah_board}
                  </span>
                  <span style={{ color: IRSHAD.slate }}>
                    <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: 4, color: IRSHAD.teal }} />
                    Cut-Off: <strong>{meta.factsheet_date}</strong> · Approver: <strong>{meta.approved_by || 'Pending Final Sign-Off'}</strong>
                  </span>
                </div>
              </section>
            </>
          )}

          {/* REGULATORY DISCLAIMER FOOTER */}
          <footer style={{
            paddingTop: 12,
            borderTop: `1px solid ${IRSHAD.border}`,
            fontSize: '0.68rem',
            color: IRSHAD.slate,
            lineHeight: 1.55,
          }}>
            {meta.disclaimer}
          </footer>
        </div>
      </article>
    </div>
  );
}
