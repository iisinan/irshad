import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Printer, ShieldCheck, CheckCircle2, SlidersHorizontal,
  Layers, Activity, Droplet, Info
} from 'lucide-react';
import { LOTUS_FALLBACK_DATA, NORRENBERGER_FALLBACK_DATA, formatNaira } from './institutionalFixtures';

const SECTOR_PALETTE = ['#297D66', '#45A58A', '#D1A562', '#1E4D40', '#74C6A9', '#0F766E', '#64748B'];

const FACTSHEET_THEMES = {
  emerald: {
    label: 'Irshad Teal',
    primary: '#297D66',
    accent: '#D1A562',
    dark: '#1E4D40',
    grad: 'linear-gradient(135deg, #1E5E4D 0%, #297D66 55%, #45A58A 100%)',
    light: '#F2F9F5',
    border: 'rgba(69, 165, 138, 0.35)',
    railBg: '#F7FCF9',
    tableHeader: '#1E4D40',
  },
  navy: {
    label: 'Executive Navy',
    primary: '#1E3A8A',
    accent: '#D1A562',
    dark: '#0F172A',
    grad: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 65%, #1D4ED8 100%)',
    light: '#EFF6FF',
    border: '#BFDBFE',
    railBg: '#F8FAFC',
    tableHeader: '#0F172A',
  },
  lotus: {
    label: 'Burgundy',
    primary: '#991B1B',
    accent: '#D1A562',
    dark: '#450A0A',
    grad: 'linear-gradient(135deg, #450A0A 0%, #991B1B 65%, #B91C1C 100%)',
    light: '#FEF2F2',
    border: '#FECACA',
    railBg: '#FEF9F9',
    tableHeader: '#450A0A',
  },
};

function AaoifiGaugeBar({ label, value, threshold, suffix = '%' }) {
  const numericVal = value === null || value === undefined ? null : Number(value);
  const pctFill = numericVal === null ? 0 : Math.min(100, (numericVal / threshold) * 100);
  const isBreach = numericVal !== null && numericVal >= threshold;
  const isNear = numericVal !== null && !isBreach && numericVal >= threshold * 0.8;
  const barColor = isBreach ? '#DC2626' : isNear ? '#D97706' : '#059669';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem' }}>
        <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 800, color: numericVal === null ? '#64748B' : barColor }}>
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

export default function InstitutionalFactsheetView({
  lotusData,
  norrenbergerData,
  screened,
  activePresetId,
  customFundName,
  institutionName,
  factsheetMeta,
  onChangeFactsheetMeta,
  allowedTemplates = ['lotus', 'norrenberger', 'custom'],
}) {
  const [showCustomizer, setShowCustomizer] = useState(false);

  const isLotus = activePresetId === 'lotus_etf';
  const isNorrenberger = activePresetId === 'norrenberger_fund';
  const lotus = useMemo(() => ({ ...LOTUS_FALLBACK_DATA, ...(lotusData || {}) }), [lotusData]);
  const norren = useMemo(() => ({ ...NORRENBERGER_FALLBACK_DATA, ...(norrenbergerData || {}) }), [norrenbergerData]);
  void allowedTemplates;

  const defaultThemeKey = 'emerald';

  const holdings = useMemo(() => {
    if (isLotus) return lotusData?.screening_result?.holdings || screened?.holdings || [];
    return screened?.holdings || [];
  }, [isLotus, lotusData?.screening_result?.holdings, screened?.holdings]);

  const summary = useMemo(() => {
    if (isLotus) return lotusData?.screening_result?.summary || screened?.summary || {};
    return screened?.summary || {};
  }, [isLotus, lotusData?.screening_result?.summary, screened?.summary]);

  const sectors = useMemo(() => {
    if (isLotus) return lotus.sector_allocation || screened?.sector_allocation || [];
    return screened?.sector_allocation || [];
  }, [isLotus, lotus.sector_allocation, screened?.sector_allocation]);

  // Compute fallback weighted AAOIFI health ratios cleanly from holdings if summary lacks them
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
      if (mv > 0) {
        impureSum += mv * Number(h.impure_ratio || 0);
      }
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
        theme: defaultThemeKey,
        institution_name: lotus.institution_name,
        fund_name: lotus.fund_name,
        mandate_type: 'Shariah Equity Exchange Traded Fund',
        ticker: lotus.ticker,
        isin: lotus.isin,
        factsheet_date: lotus.factsheet_date,
        currency: lotus.currency,
        benchmark: lotus.benchmark_index,
        management_fee: lotus.management_fee,
        rebalancing_frequency: lotus.rebalancing_frequency,
        risk_level: 3,
        risk_label: 'Moderate Growth',
        objective: lotus.overview,
        commentary: lotus.index_commentary,
        investor_profile: lotus.investor_profile,
        benefits: lotus.benefits,
        contact: lotus.contact,
        disclaimer: lotus.disclaimer,
      };
    }
    if (isNorrenberger) {
      return {
        theme: defaultThemeKey,
        institution_name: norren.institution_name,
        fund_name: norren.fund_name,
        mandate_type: 'Islamic Fixed Income Mutual Fund',
        ticker: 'NORR-ISLAMIC',
        isin: 'NGNORRENIS01',
        factsheet_date: norren.factsheet_date,
        currency: 'Naira (NGN)',
        benchmark: norren.benchmark,
        management_fee: '1.50% p.a. (1.90% TER)',
        rebalancing_frequency: 'Quarterly Review',
        risk_level: norren.risk_profile?.level || 1,
        risk_label: norren.risk_profile?.label || 'Conservative',
        objective: norren.objective,
        commentary: norren.commentary,
        investor_profile: 'Suitable for institutional treasuries, Takaful operators, endowments, and capital-preservation mandates requiring non-interest Sukuk and Mudarabah liquidity.',
        benefits: [
          'Capital preservation in Sukuk & Mudarabah contracts',
          'Quarterly distribution payouts',
          'Full SEC Nigeria & AAOIFI Shariah supervision',
          'Competitive yield vs 3-Year FGN Sukuk Benchmark',
        ],
        contact: norren.footer_note || 'Norrenberger Asset Management Limited | SEC Nigeria Regulated',
        disclaimer: norren.disclaimer,
      };
    }

    return {
      theme: defaultThemeKey,
      institution_name: institutionName || 'Irshad Institutional Shariah Desk',
      fund_name: customFundName || 'Institutional Screened Equity Mandate',
      mandate_type: 'AAOIFI Screened Equity Mandate',
      ticker: 'IRSHAD-MANDATE',
      isin: 'NG-INST-SCREEN',
      factsheet_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      currency: 'Naira (NGN)',
      benchmark: 'NGX Lotus Islamic Index (NGXLII)',
      management_fee: '0.75% p.a.',
      rebalancing_frequency: 'Continuous / Pre-Trade',
      risk_level: 3,
      risk_label: 'Balanced Equity',
      objective: 'Deliver institutional capital appreciation while maintaining strict compliance with AAOIFI Shariah Standard No. 21 (<30% debt, <30% interest-bearing cash, <5% impermissible revenue) and automated dividend purification.',
      commentary: Number(summary.non_compliant_count || 0) > 0
        ? `Irshad detected ${summary.non_compliant_count} non-compliant holding(s) representing ${Number(summary.non_compliant_pct || 0).toFixed(1)}% of portfolio AUM. Divestment and replacement with verified Halal sector peers are itemized in this audit schedule.`
        : 'All evaluated constituents currently satisfy AAOIFI qualitative business screening and quantitative financial ratios. Portfolio purification liability has been computed down to the per-unit level.',
      investor_profile: 'Designed for Pension Fund Administrators (PFAs), Islamic asset managers, ethical endowments, and institutional brokerage desks.',
      benefits: [
        'Automated AAOIFI Standard No. 21 screening on NGX filings',
        'Per-unit & total charity purification schedule included',
        'Proactive Drift Watch monitoring near threshold limits',
        'Pre-trade & post-trade compliance audit trail',
      ],
      contact: `${institutionName || 'Irshad Institutional'} · Powered by Irshad Shariah Infrastructure (iirshad.com)`,
      disclaimer: 'All Shariah ratios and purification figures are derived from latest NGX audited financial statements and corporate disclosures under AAOIFI Standard No. 21. This factsheet is an institutional compliance & reporting instrument and does not constitute investment advice.',
    };
  }, [isLotus, isNorrenberger, defaultThemeKey, lotus, norren, institutionName, customFundName, summary]);

  const meta = useMemo(() => ({ ...defaults, ...(factsheetMeta || {}) }), [defaults, factsheetMeta]);
  const theme = FACTSHEET_THEMES[meta.theme] || FACTSHEET_THEMES.emerald;

  const updateMeta = (key, val) => {
    if (onChangeFactsheetMeta) {
      onChangeFactsheetMeta({ ...meta, [key]: val });
    }
  };

  // Unified 4 Hero KPIs tailored cleanly to mandate type
  const heroKpis = useMemo(() => {
    if (isLotus) {
      return [
        { label: 'Fund Size (AUM)', value: lotus.fund_size_label || formatNaira(summary.total_aum, true), sub: `${lotus.holdings_count || holdings.length} NGX Constituents` },
        { label: 'NAV / NGX Price', value: `₦${Number(lotus.nav_per_unit || 95.17).toFixed(2)}`, sub: `Close: ₦${Number(lotus.closing_price || 127.90).toFixed(2)}` },
        { label: 'Shariah Compliance', value: `${Number(summary.compliant_pct ?? 100).toFixed(1)}%`, sub: `YTD Return: +54.17%` },
        { label: 'Purification (FY25)', value: `₦${Number(lotus.purification_per_unit_fy25 || 0.46).toFixed(2)} / unit`, sub: lotus.last_distribution || 'Annual Audit Rate' },
      ];
    }
    if (isNorrenberger) {
      return [
        { label: 'Fund Size (AUM)', value: '₦6.81bn', sub: 'Open Ended · Fixed Income' },
        { label: 'Unit Price', value: '₦108.27', sub: 'Min: 50 Units initial' },
        { label: 'YTD Yield / Shariah', value: '17.72%', sub: '100.0% Islamic Contracts' },
        { label: 'Expense Ratio', value: '1.90%', sub: 'Q3 2026 Dist: ₦3.05/unit' },
      ];
    }
    return [
      { label: 'Screened Portfolio AUM', value: formatNaira(summary.total_aum, true), sub: `${summary.holdings_count || holdings.length} Holdings · ${sectors.length} Sectors` },
      { label: 'Shariah Compliance Rate', value: `${Number(summary.compliant_pct || 0).toFixed(1)}%`, sub: `${summary.compliant_count || 0} Pass · ${summary.non_compliant_count || 0} Flagged` },
      { label: 'Non-Compliant Exposure', value: formatNaira(summary.non_compliant_aum || 0, true), sub: `${Number(summary.non_compliant_pct || 0).toFixed(2)}% of total book` },
      { label: 'Total Purification Due', value: formatNaira(summary.total_purification_due || 0), sub: `₦${Number(summary.weighted_purification_per_unit || 0).toFixed(4)} / unit avg` },
    ];
  }, [isLotus, isNorrenberger, lotus, summary, holdings.length, sectors.length]);

  const removedNascon = lotusData?.rebalance_removed || null;
  const topHoldingsChartData = useMemo(
    () => holdings.slice(0, 8).map((h) => ({
      symbol: h.symbol,
      weight: Number(h.weight_pct || 0),
      impure: Number(h.impure_ratio || 0),
    })),
    [holdings]
  );

  const keyFactsRows = useMemo(() => {
    const base = [
      ['Institution', meta.institution_name],
      ['Mandate Code', meta.ticker],
      ['ISIN / Ref', meta.isin],
      ['Base Currency', meta.currency],
      ['Benchmark', meta.benchmark],
      ['Management Fee', meta.management_fee],
      ['Rebalancing Cycle', meta.rebalancing_frequency],
      ['Shariah Standard', 'AAOIFI Standard No. 21'],
      ['As-Of Date', meta.factsheet_date],
    ];
    if (isLotus) {
      base.splice(3, 0, ['Launch / Listing', `${lotus.launch_date} / ${lotus.listing_date}`]);
      base.splice(7, 0, ['Last Rebalance', lotus.last_rebalancing]);
    }
    if (isNorrenberger) {
      base.splice(3, 0, ['Launch Date', 'May 2021 (NGX Listed)']);
      base.splice(7, 0, ['Initial / Addl', '50 Units / 10 Units']);
    }
    return base;
  }, [meta, isLotus, isNorrenberger, lotus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Executive Control Toolbar (hidden on print) */}
      <div className="no-print" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, padding: '12px 18px', borderRadius: 14,
        background: 'var(--bg)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: theme.light, color: theme.primary, border: `1px solid ${theme.border}`,
            fontSize: '0.72rem', fontWeight: 800,
          }}>
            <ShieldCheck size={13} /> Irshad Uniform Factsheet
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Standardized AAOIFI executive format for <strong style={{ color: 'var(--text-dark)' }}>{meta.fund_name}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowCustomizer((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 14px', borderRadius: 10,
              background: showCustomizer ? 'var(--primary-50)' : 'var(--bg-section)',
              color: showCustomizer ? 'var(--primary)' : 'var(--text-dark)',
              border: `1px solid ${showCustomizer ? 'var(--primary)' : 'var(--border-strong)'}`,
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={14} /> {showCustomizer ? 'Close Editor' : 'Customize Sheet'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10,
              background: theme.tableHeader, color: '#fff',
              border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Collapsible Branding & Copy Editor */}
      {showCustomizer && (
        <div className="no-print" style={{
          background: 'var(--bg)',
          borderRadius: 16,
          padding: 18,
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 12,
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>INSTITUTION NAME</label>
            <input type="text" value={meta.institution_name} onChange={(e) => updateMeta('institution_name', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>FUND / MANDATE TITLE</label>
            <input type="text" value={meta.fund_name} onChange={(e) => updateMeta('fund_name', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>TICKER &amp; ISIN</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input type="text" value={meta.ticker} onChange={(e) => updateMeta('ticker', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
              <input type="text" value={meta.isin} onChange={(e) => updateMeta('isin', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>BENCHMARK &amp; FEE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 6 }}>
              <input type="text" value={meta.benchmark} onChange={(e) => updateMeta('benchmark', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
              <input type="text" value={meta.management_fee} onChange={(e) => updateMeta('management_fee', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>RISK LEVEL (1–5)</label>
            <select
              value={meta.risk_level}
              onChange={(e) => {
                const lvl = Number(e.target.value);
                const labels = { 1: 'Conservative', 2: 'Moderate Conservative', 3: 'Balanced Growth', 4: 'Growth', 5: 'Aggressive Equity' };
                onChangeFactsheetMeta?.({ ...meta, risk_level: lvl, risk_label: labels[lvl] });
              }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }}
            >
              <option value={1}>1 - Conservative</option>
              <option value={2}>2 - Moderate Conservative</option>
              <option value={3}>3 - Balanced Growth</option>
              <option value={4}>4 - Growth</option>
              <option value={5}>5 - Aggressive Equity</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>INSTITUTIONAL ACCENT</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(FACTSHEET_THEMES).map(([k, th]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => updateMeta('theme', k)}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800,
                    border: `2px solid ${meta.theme === k ? th.primary : 'var(--border)'}`,
                    background: meta.theme === k ? th.light : 'var(--bg-section)',
                    color: th.primary,
                  }}
                >
                  {th.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>MANDATE OBJECTIVE</label>
              <textarea rows={2} value={meta.objective} onChange={(e) => updateMeta('objective', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>MANAGER &amp; SHARIAH COMMENTARY</label>
              <textarea rows={2} value={meta.commentary} onChange={(e) => updateMeta('commentary', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* UNIFORM IRSHAD INSTITUTIONAL FACTSHEET                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <article className="institutional-factsheet-sheet" style={{
        background: '#FFFFFF',
        color: '#0F172A',
        borderRadius: 18,
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-md)',
        padding: '30px 34px',
        fontFamily: 'var(--sans)',
      }}>
        {/* 1. Executive Masthead */}
        <header style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 16, paddingBottom: 16, borderBottom: `2.5px solid ${theme.primary}`, marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: theme.grad, color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.5px', flexShrink: 0,
            }}>
              {(meta.institution_name || 'IR').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {meta.institution_name}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#F1F5F9', color: '#475569' }}>
                  {meta.mandate_type}
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.48rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.4px' }}>
                {meta.fund_name}
              </h1>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4, fontWeight: 600 }}>
                Fact Sheet · As of <strong style={{ color: '#334155' }}>{meta.factsheet_date}</strong> · Ticker: <strong>{meta.ticker}</strong> · Currency: <strong>{meta.currency}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 13px', borderRadius: 10,
              background: theme.light, border: `1px solid ${theme.border}`,
              color: theme.primary, fontSize: '0.74rem', fontWeight: 800,
            }}>
              <ShieldCheck size={15} />
              <span>IRSHAD SHARIAH VERIFIED · AAOIFI STD. 21</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
              Benchmark: {meta.benchmark}
            </div>
          </div>
        </header>

        {/* 2. Signature 4-Metric KPI Ribbon */}
        <section style={{
          background: theme.grad,
          borderRadius: 14,
          padding: '18px 22px',
          color: '#FFFFFF',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 18,
          marginBottom: 22,
        }}>
          {heroKpis.map((kpi, idx) => (
            <div
              key={kpi.label}
              style={{
                borderRight: idx < heroKpis.length - 1 ? '1px solid rgba(255,255,255,0.22)' : 'none',
                paddingRight: 10,
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.85 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '1.52rem', fontWeight: 900, lineHeight: 1.15, marginTop: 4 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.88, marginTop: 4 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </section>

        {/* 3. Main 2-Column Editorial Layout (Left Dossier Rail + Right Analytical Body) */}
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(265px, 315px) 1fr', gap: 22, alignItems: 'start', marginBottom: 24 }} className="mobile-col">
          {/* Left Rail */}
          <aside style={{
            background: theme.railBg || '#F7FCF9',
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            {/* Mandate Objective */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>
                Investment Objective
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#334155', lineHeight: 1.6 }}>
                {meta.objective}
              </p>
            </div>

            {/* Key Facts Ledger */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 8 }}>
                Key Mandate Facts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {keyFactsRows.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, fontSize: '0.73rem', paddingBottom: 5, borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', flexShrink: 0 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: '#0F172A', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Irshad AAOIFI Quantitative Health Check */}
            {!isNorrenberger && (
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.71rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    Portfolio AAOIFI Ratios
                  </span>
                  {healthMetrics.nearCount > 0 && (
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 6px', borderRadius: 999, background: '#FEF3C7', color: '#B45309' }}>
                      {healthMetrics.nearCount} Drift Watch
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <AaoifiGaugeBar label="Weighted Debt / Cap" value={healthMetrics.debt} threshold={30} />
                  <AaoifiGaugeBar label="Weighted Cash & Int." value={healthMetrics.cash} threshold={30} />
                  <AaoifiGaugeBar label="Weighted Impure Rev." value={healthMetrics.impure} threshold={5} />
                </div>
              </div>
            )}

            {/* Risk Profile Meter */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 7 }}>
                Risk Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 5 }}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    style={{
                      height: 11,
                      borderRadius: 3,
                      background: step <= Number(meta.risk_level || 3) ? theme.primary : '#E2E8F0',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{meta.risk_label}</span>
                <span style={{ fontSize: '0.67rem', color: '#64748B' }}>Lower ↔ Higher Risk</span>
              </div>
            </div>

            {/* Investor Suitability & Benefits */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>
                Investor Suitability &amp; Benefits
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '0.73rem', color: '#475569', lineHeight: 1.55 }}>
                {meta.investor_profile}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(meta.benefits || []).map((b) => (
                  <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.72rem', color: '#1E293B', fontWeight: 600 }}>
                    <CheckCircle2 size={13} color={theme.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Analytical Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Row A: Fixed-Income Allocation vs Equity Sector Allocation */}
            {isNorrenberger ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                    Shariah Contract Allocation vs Mandate Band
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                    <thead>
                      <tr style={{ background: theme.tableHeader, color: '#FFFFFF' }}>
                        <th style={{ padding: '7px 8px', textAlign: 'left' }}>Instrument Class</th>
                        <th style={{ padding: '7px 8px', textAlign: 'right' }}>Current</th>
                        <th style={{ padding: '7px 8px', textAlign: 'right' }}>Target Band</th>
                        <th style={{ padding: '7px 8px', textAlign: 'center' }}>Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {norren.allocation.map((row) => {
                        const outOfBand = row.current < row.target_min || row.current > row.target_max;
                        return (
                          <tr key={row.security} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '7px 8px' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.security}</div>
                              <div style={{ fontSize: '0.64rem', color: '#64748B' }}>{row.shariah_contract}</div>
                            </td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800 }}>{row.current.toFixed(2)}%</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748B' }}>{row.target_label}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 7px', borderRadius: 999, fontSize: '0.64rem', fontWeight: 800,
                                background: outOfBand ? '#FEF3C7' : '#ECFDF5',
                                color: outOfBand ? '#B45309' : '#047857',
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

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                    Fund Maturity Profile
                  </div>
                  <div style={{ height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={norren.maturity_profile} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="pct" name="Share %" fill={theme.primary} radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))', gap: 16 }}>
                {/* Sector Allocation Donut */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                    <Layers size={14} color={theme.primary} /> Sector Exposure Breakdown
                  </div>
                  {sectors.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr', gap: 10, alignItems: 'center' }}>
                      <div style={{ height: 165 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={sectors} dataKey="weight_pct" nameKey="sector" innerRadius={40} outerRadius={68} paddingAngle={2}>
                              {sectors.map((s, idx) => (
                                <Cell key={s.sector} fill={SECTOR_PALETTE[idx % SECTOR_PALETTE.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sectors.slice(0, 7).map((s, idx) => (
                          <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontWeight: 600 }}>
                              <span style={{ width: 9, height: 9, borderRadius: 2, background: SECTOR_PALETTE[idx % SECTOR_PALETTE.length], display: 'inline-block' }} />
                              {s.sector}
                            </span>
                            <strong style={{ color: '#0F172A' }}>{Number(s.weight_pct).toFixed(2)}%</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748B', fontSize: '0.78rem' }}>Upload or select a mandate to generate sector breakdown.</div>
                  )}
                </div>

                {/* Purification & Shariah Audit Snapshot */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                    <Droplet size={14} color="#D97706" /> Shariah Audit &amp; Purification Ledger
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                      <span style={{ color: '#64748B' }}>Compliant Equity AUM</span>
                      <strong style={{ color: '#047857' }}>{formatNaira(summary.compliant_aum || 0)} ({Number(summary.compliant_pct || 0).toFixed(1)}%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                      <span style={{ color: '#64748B' }}>Flagged Non-Compliant AUM</span>
                      <strong style={{ color: Number(summary.non_compliant_aum || 0) > 0 ? '#B91C1C' : '#047857' }}>
                        {formatNaira(summary.non_compliant_aum || 0)} ({Number(summary.non_compliant_pct || 0).toFixed(2)}%)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                      <span style={{ color: '#64748B' }}>Positions Requiring Purification</span>
                      <strong style={{ color: '#0F172A' }}>{summary.purify_required_count || 0} of {summary.holdings_count || holdings.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                      <span style={{ color: '#64748B' }}>Weighted Purification / Unit</span>
                      <strong style={{ color: '#B45309' }}>₦{Number(summary.weighted_purification_per_unit || 0).toFixed(4)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Total Book Purification Due</span>
                      <strong style={{ color: '#B45309', fontSize: '0.84rem' }}>{formatNaira(summary.total_purification_due || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Row B: Performance / Top Position Concentration */}
            {isLotus && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))', gap: 16 }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                    LHE ETF NAV vs NGXLII Benchmark
                  </div>
                  <div style={{ height: 185 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lotus.nav_vs_benchmark_series} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="etf" name="LHE ETF NAV/Unit" stroke={theme.primary} strokeWidth={2.4} dot={false} />
                        <Line type="monotone" dataKey="benchmark" name="NGXLII Benchmark" stroke={theme.accent || '#D1A562'} strokeWidth={2.2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                      Trailing Performance Returns
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <thead>
                        <tr style={{ background: theme.tableHeader, color: '#FFFFFF' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Metric</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>7D</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>30D</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>YTD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotus.performance_table.map((row) => (
                          <tr key={row.metric} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{row.metric}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: row.d7.startsWith('-') ? '#B91C1C' : '#047857', fontWeight: 700 }}>{row.d7}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: row.d30.startsWith('-') ? '#B91C1C' : '#047857', fontWeight: 700 }}>{row.d30}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#047857', fontWeight: 800 }}>{row.ytd}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '0.7rem', color: '#92400E' }}>
                    <strong>Historical Purification / Unit:</strong>{' '}
                    {(lotus.purification_history || []).map((p) => `${p.year}: ₦${Number(p.per_unit).toFixed(2)}`).join(' · ')}
                  </div>
                </div>
              </div>
            )}

            {isNorrenberger && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                      2026 Monthly Yield vs Benchmark (%)
                    </div>
                    <div style={{ height: 175 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={norren.monthly_performance_2026} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis domain={[12, 20]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="yield" name="Yield %" fill={theme.primary} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="benchmark" name="Benchmark %" fill={theme.accent || '#D1A562'} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                      Quarterly Distribution Per Unit (₦)
                    </div>
                    <div style={{ height: 175 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={norren.distribution_per_unit} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="quarter" tick={{ fontSize: 9 }} />
                          <YAxis domain={[2.5, 4.8]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => `₦${v}`} />
                          <Line type="monotone" dataKey="amount" name="Distribution (₦)" stroke={theme.primary} strokeWidth={2.5} dot={{ r: 3.5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Historical Returns + Macro Indicators Strip */}
                {Array.isArray(norren.historical_performance) && norren.historical_performance.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    {norren.historical_performance.map((hp) => (
                      <div key={hp.period} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>{hp.period} Yield</span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 900, color: theme.primary }}>
                          {hp.yield}% <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>vs {hp.benchmark}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {norren.market_indicators.map((ind) => (
                    <div key={ind.title} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: theme.primary }}>{ind.value}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{ind.title}</div>
                      <div style={{ fontSize: '0.64rem', color: '#64748B', marginTop: 2 }}>{ind.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLotus && !isNorrenberger && topHoldingsChartData.length > 0 && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <Activity size={14} color={theme.primary} /> Top Constituents Weight (%) &amp; Impermissible Income (%)
                  </span>
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topHoldingsChartData} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="weight" name="Portfolio Weight %" fill={theme.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="impure" name="Impure Ratio %" fill="#D97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Row C: Investment Commentary + Shariah Governance Note */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                  Market &amp; Portfolio Commentary
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#334155', lineHeight: 1.6 }}>
                  {meta.commentary}
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                  <Info size={13} color={theme.primary} /> Irshad Shariah Governance Note
                </div>
                {removedNascon ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#991B1B', lineHeight: 1.6 }}>
                    <strong>Rebalance Confirmation:</strong> Removed ticker <strong>{removedNascon.symbol}</strong> fails AAOIFI Impermissible Income (&lt;5%) at <strong>{Number(removedNascon.impure_ratio || 0).toFixed(2)}%</strong>. All remaining 13 constituents pass screening.
                  </p>
                ) : Number(summary.non_compliant_count || 0) > 0 ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#991B1B', lineHeight: 1.6 }}>
                    <strong>Compliance Action Required:</strong> {summary.non_compliant_count} position(s) require divestment before issuing a Halal certification. Use the Rebalance panel on Portfolio &amp; Verdicts to swap into compliant peers.
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857', lineHeight: 1.6 }}>
                    <strong>Clean Audit Certificate:</strong> 100% of evaluated holdings conform to AAOIFI Shariah Standard No. 21 thresholds (&lt;30% debt, &lt;30% cash/interest securities, &lt;5% non-permissible income).
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Full-Width Constituent AAOIFI Screening & Purification Schedule */}
        {holdings.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                Constituent Holdings, AAOIFI Financial Ratios &amp; Purification Schedule ({holdings.length})
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>
                Thresholds: Debt &lt; 30% · Cash &lt; 30% · Impure &lt; 5%
              </span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: 10 }}>
              <table style={{ width: '100%', minWidth: 740, borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                <thead>
                  <tr style={{ background: theme.tableHeader, color: '#FFFFFF' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 34 }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Security</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Units</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Market Value</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Weight</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Shariah Verdict</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Debt / Cash / Impure</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purify / Unit</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purification Due</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const isHalal = h.status === 'halal';
                    return (
                      <tr key={h.symbol} style={{ borderBottom: '1px solid #E2E8F0', background: i % 2 === 1 ? '#F8FAFC' : '#FFFFFF' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{h.symbol}</div>
                          <div style={{ fontSize: '0.67rem', color: '#64748B' }}>{h.name} · {h.sector}</div>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#334155' }}>
                          {Number(h.shares || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                          {formatNaira(h.market_value)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>
                          {Number(h.weight_pct || 0).toFixed(2)}%
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 999, fontSize: '0.66rem', fontWeight: 800,
                            background: isHalal ? '#ECFDF5' : '#FEF2F2',
                            color: isHalal ? '#047857' : '#B91C1C',
                          }}>
                            {isHalal ? 'COMPLIANT' : String(h.status || 'NON-COMPLIANT').toUpperCase()}
                            {h.is_near_threshold ? ' · WATCH' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                          {h.debt_ratio ?? '—'}% / {h.cash_ratio ?? '—'}% / {Number(h.impure_ratio || 0).toFixed(2)}%
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B' }}>
                          ₦{Number(h.purification_per_unit || 0).toFixed(4)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#B45309' }}>
                          {formatNaira(h.purification_due)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F1F5F9', fontWeight: 800, borderTop: '2px solid #CBD5E1' }}>
                    <td colSpan={3} style={{ padding: '8px 10px', color: '#0F172A' }}>TOTAL PORTFOLIO AUDIT</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0F172A' }}>{formatNaira(summary.total_aum)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0F172A' }}>100.00%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#047857' }}>{Number(summary.compliant_pct || 0).toFixed(1)}% Pass</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                      {healthMetrics.debt !== null ? `${healthMetrics.debt.toFixed(1)}%` : '—'} / {healthMetrics.cash !== null ? `${healthMetrics.cash.toFixed(1)}%` : '—'} / {Number(healthMetrics.impure || 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#B45309' }}>₦{Number(summary.weighted_purification_per_unit || 0).toFixed(4)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#B45309' }}>{formatNaira(summary.total_purification_due)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* 5. Footer & Regulatory Disclosures */}
        <footer style={{
          paddingTop: 14,
          borderTop: '1px solid #CBD5E1',
          fontSize: '0.68rem',
          color: '#64748B',
          lineHeight: 1.55,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ fontWeight: 700, color: theme.primary }}>{meta.contact}</div>
          <div><strong>Disclosure &amp; Shariah Basis:</strong> {meta.disclaimer}</div>
        </footer>
      </article>
    </div>
  );
}
