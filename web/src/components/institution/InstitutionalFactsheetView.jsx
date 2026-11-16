import React, { useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Printer, ShieldCheck, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { LOTUS_FALLBACK_DATA, NORRENBERGER_FALLBACK_DATA, formatNaira } from './institutionalFixtures';

const PALETTE = ['#991B1B', '#DC2626', '#45A58A', '#D1A562', '#1E3A8A', '#0F766E', '#6B7280'];

const CUSTOM_THEMES = {
  emerald: { label: 'Irshad Emerald', primary: '#297D66', grad: 'linear-gradient(135deg, #297D66 0%, #45A58A 100%)', light: '#ECFDF5', border: '#A7F3D0' },
  lotus: { label: 'Lotus Burgundy', primary: '#991B1B', grad: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)', light: '#FEF2F2', border: '#FECACA' },
  norrenberger: { label: 'Norrenberger Crimson', primary: '#DC2626', grad: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)', light: '#FEF2F2', border: '#FECACA' },
};

export default function InstitutionalFactsheetView({
  lotusData,
  norrenbergerData,
  screened,
  activePresetId,
  customFundName,
  institutionName,
  factsheetMeta,
  onChangeFactsheetMeta,
}) {
  const initialTemplate =
    activePresetId === 'norrenberger_fund'
      ? 'norrenberger'
      : activePresetId === 'lotus_etf'
      ? 'lotus'
      : 'custom';

  const [template, setTemplate] = useState(initialTemplate);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const meta = {
    theme: 'emerald',
    institution_name: institutionName || 'Irshad Institutional Shariah Screening',
    fund_name: customFundName || 'Uploaded Institutional Portfolio Factsheet',
    ticker: 'IRSHAD-MANDATE',
    benchmark: 'NGX Lotus Islamic Index (NGXLII)',
    management_fee: '0.75% p.a.',
    objective: 'To achieve long-term capital preservation and ethical returns by investing strictly in AAOIFI-screened Nigerian equities with automated dividend purification.',
    commentary: 'Portfolio holdings are continuously screened against AAOIFI Shariah Standard No. 21 (<30% debt, <30% cash/interest securities, <5% impermissible revenue).',
    ...(factsheetMeta || {}),
  };

  const updateMeta = (key, val) => {
    if (onChangeFactsheetMeta) {
      onChangeFactsheetMeta({ ...meta, [key]: val });
    }
  };

  const activeTheme = CUSTOM_THEMES[meta.theme] || CUSTOM_THEMES.emerald;

  const lotus = { ...LOTUS_FALLBACK_DATA, ...(lotusData || {}) };
  const norren = { ...NORRENBERGER_FALLBACK_DATA, ...(norrenbergerData || {}) };
  const lotusHoldings = lotusData?.screening_result?.holdings || screened?.holdings || [];
  const removedNascon = lotusData?.rebalance_removed || null;

  const customHoldings = screened?.holdings || [];
  const customSummary = screened?.summary || {};
  const customSectors = screened?.sector_allocation || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Controls Bar (hidden on print) */}
      <div className="no-print" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, padding: '14px 18px', borderRadius: 16,
        background: 'var(--bg)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginRight: 4 }}>
            Factsheet Template:
          </span>
          {[
            { id: 'lotus', label: 'Lotus Halal Equity ETF (LOTUSHAL15)' },
            { id: 'norrenberger', label: 'Norrenberger Islamic Fund' },
            { id: 'custom', label: `Uploaded / Live Portfolio (${customHoldings.length})` },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTemplate(opt.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1.5px solid ${template === opt.id ? 'var(--primary)' : 'var(--border)'}`,
                background: template === opt.id ? 'var(--primary-50)' : 'var(--bg-section)',
                color: template === opt.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {template === 'custom' && (
            <button
              type="button"
              onClick={() => setShowCustomizer((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 14px', borderRadius: 12,
                background: showCustomizer ? 'var(--primary-50)' : 'var(--bg-section)',
                color: showCustomizer ? 'var(--primary)' : 'var(--text-dark)',
                border: `1px solid ${showCustomizer ? 'var(--primary)' : 'var(--border-strong)'}`,
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={14} /> {showCustomizer ? 'Hide Branding Editor' : 'Customize Factsheet'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: '#111827', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            <Printer size={15} /> Print / Save Factsheet PDF
          </button>
        </div>
      </div>

      {/* Collapsible Branding & Copy Customizer for Template C */}
      {template === 'custom' && showCustomizer && (
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
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>INSTITUTION NAME</label>
            <input type="text" value={meta.institution_name} onChange={(e) => updateMeta('institution_name', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>FUND / MANDATE NAME</label>
            <input type="text" value={meta.fund_name} onChange={(e) => updateMeta('fund_name', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>TICKER / CODE</label>
            <input type="text" value={meta.ticker} onChange={(e) => updateMeta('ticker', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>BENCHMARK &amp; MGMT FEE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 6 }}>
              <input type="text" value={meta.benchmark} onChange={(e) => updateMeta('benchmark', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
              <input type="text" value={meta.management_fee} onChange={(e) => updateMeta('management_fee', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>BRAND PALETTE</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(CUSTOM_THEMES).map(([k, th]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => updateMeta('theme', k)}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
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
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>FUND OBJECTIVE</label>
              <textarea rows={2} value={meta.objective} onChange={(e) => updateMeta('objective', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>PORTFOLIO MANAGER COMMENTARY</label>
              <textarea rows={2} value={meta.commentary} onChange={(e) => updateMeta('commentary', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.78rem', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE A: LOTUS HALAL EQUITY ETF FACTSHEET                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {template === 'lotus' && (
        <article className="institutional-factsheet-sheet" style={{
          background: '#FFFFFF',
          color: '#1F2937',
          borderRadius: 18,
          border: '1px solid #E5E7EB',
          boxShadow: 'var(--shadow-md)',
          padding: '28px 32px',
          fontFamily: 'var(--sans)',
        }}>
          {/* Masthead */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, paddingBottom: 16, borderBottom: '2px solid #991B1B', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#991B1B', letterSpacing: '-0.3px' }}>
                Fact Sheet
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 4, fontSize: '0.92rem', color: '#374151', fontWeight: 600 }}>
                <span>{lotus.fund_name}</span>
                <span style={{ color: '#6B7280' }}>{lotus.factsheet_date}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#7F1D1D', letterSpacing: '0.4px' }}>LOTUS CAPITAL</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6B7280', letterSpacing: '1px' }}>HALAL INVESTMENTS</div>
              </div>
              <div style={{
                padding: '6px 10px', borderRadius: 8, background: 'rgba(69, 165, 138, 0.12)',
                border: '1px solid rgba(69, 165, 138, 0.35)', color: '#065F46',
                fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <ShieldCheck size={13} /> Verified on Irshad
              </div>
            </div>
          </div>

          {/* 2-Column Factsheet Body */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Left Column: Fund Facts + Sector Donut + Component Stocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Fund Facts Table */}
              <div style={{ border: '1px solid #B91C1C', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ background: '#991B1B', color: '#FFFFFF', padding: '7px 12px', fontWeight: 800, fontSize: '0.88rem' }}>
                  Fund Facts
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <tbody>
                    {[
                      ['Fund Launch Date', lotus.launch_date],
                      ['Listing Date', lotus.listing_date],
                      ['Listing Exchange', lotus.listing_exchange],
                      ['NGX Ticker', lotus.ticker],
                      ['Bloomberg Ticker', lotus.bloomberg_ticker],
                      ['ISIN', lotus.isin],
                      ['Currency', lotus.currency],
                      ['Fund Size', lotus.fund_size_label],
                      ['NAV Per Unit', `₦${lotus.nav_per_unit.toFixed(2)}`],
                      ['Closing Price (NGX)', `₦${lotus.closing_price.toFixed(2)}`],
                      ['Purification Per Unit for FY\'2025', `₦${lotus.purification_per_unit_fy25.toFixed(2)}`],
                      ['Last Distribution', lotus.last_distribution],
                      ['Management Fee', lotus.management_fee],
                      ['Re-balancing Frequency', lotus.rebalancing_frequency],
                      ['Date of Last Rebalancing', lotus.last_rebalancing],
                      ['Benchmark Index', lotus.benchmark_index],
                      ['No. of Holdings', String(lotus.holdings_count)],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #FCA5A5' }}>
                        <td style={{ padding: '5px 10px', fontWeight: 700, color: '#1F2937', borderRight: '1px solid #FCA5A5', width: '54%' }}>{k}</td>
                        <td style={{ padding: '5px 10px', color: '#111827', fontWeight: k.includes('Purification') ? 800 : 500 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sector Allocation Donut */}
              <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: 12 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#374151', marginBottom: 8 }}>
                  Sector Allocation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'center' }}>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={lotus.sector_allocation}
                          dataKey="weight_pct"
                          nameKey="sector"
                          innerRadius={44}
                          outerRadius={76}
                          paddingAngle={2}
                        >
                          {lotus.sector_allocation.map((entry, idx) => (
                            <Cell key={entry.sector} fill={entry.color || PALETTE[idx % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {lotus.sector_allocation.map((s) => (
                      <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 600 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                          {s.sector}
                        </span>
                        <span style={{ fontWeight: 800, color: '#111827' }}>{s.weight_pct.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Component Stocks (Enriched with Live Irshad AAOIFI Verdict) */}
              <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#374151' }}>Component Stocks (13)</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669' }}>Live Irshad AAOIFI Status</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.76rem' }}>
                  {(lotusHoldings.length > 0 ? lotusHoldings : [
                    { symbol: 'ARADEL', name: 'Aradel Holdings PLC', status: 'halal', impure_ratio: 1.11 },
                    { symbol: 'BUACEMENT', name: 'BUA Cement PLC', status: 'halal', impure_ratio: 2.44 },
                    { symbol: 'BUAFOODS', name: 'BUA Foods PLC', status: 'halal', impure_ratio: 0.06 },
                    { symbol: 'CADBURY', name: 'Cadbury Nigeria Plc', status: 'halal', impure_ratio: 0.19 },
                    { symbol: 'CAP', name: 'Chemical and Allied Products PLC', status: 'halal', impure_ratio: 3.11 },
                    { symbol: 'DANGCEM', name: 'Dangote Cement PLC', status: 'halal', impure_ratio: 0.63 },
                    { symbol: 'JAIZBANK', name: 'Jaiz Bank PLC', status: 'halal', impure_ratio: 0.00 },
                    { symbol: 'HBMNG', name: 'Lafarge Africa PLC', status: 'halal', impure_ratio: 3.63 },
                    { symbol: 'MTNN', name: 'MTN Nigeria Communications PLC', status: 'halal', impure_ratio: 1.79 },
                    { symbol: 'NESTLE', name: 'Nestlé Nigeria Plc', status: 'halal', impure_ratio: 0.18 },
                    { symbol: 'NAHCO', name: 'Nigerian Aviation Handling Company PLC', status: 'halal', impure_ratio: 1.50 },
                    { symbol: 'OKOMUOIL', name: 'Okomu Oil PLC', status: 'halal', impure_ratio: 0.42 },
                    { symbol: 'PRESCO', name: 'Presco PLC', status: 'halal', impure_ratio: 4.54 },
                  ]).map((h) => (
                    <li key={h.symbol} style={{ color: '#1F2937' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{h.name}</span>
                        <span style={{
                          fontSize: '0.66rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999,
                          background: h.status === 'halal' ? '#ECFDF5' : '#FEF2F2',
                          color: h.status === 'halal' ? '#047857' : '#B91C1C',
                          whiteSpace: 'nowrap',
                        }}>
                          {h.symbol} · {h.status === 'halal' ? `Halal (${Number(h.impure_ratio || 0).toFixed(2)}% imp)` : 'Flagged'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right Column: Narrative, Benefits, Line Chart, Performance Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ background: '#991B1B', color: '#fff', padding: '6px 12px', fontWeight: 800, fontSize: '0.84rem', marginBottom: 8 }}>
                  The Lotus Halal Equity Exchange Traded Fund
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', lineHeight: 1.6, color: '#374151' }}>{lotus.overview}</p>
              </div>

              <div>
                <div style={{ background: '#991B1B', color: '#fff', padding: '6px 12px', fontWeight: 800, fontSize: '0.84rem', marginBottom: 8 }}>
                  The NGX Lotus Islamic Index
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', lineHeight: 1.6, color: '#374151' }}>{lotus.index_commentary}</p>
                {removedNascon && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    fontSize: '0.74rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Irshad Live Audit Confirmation:</strong> Removed constituent <strong>{removedNascon.symbol}</strong> fails AAOIFI Impermissible Income (&lt;5%) at <strong>{Number(removedNascon.impure_ratio).toFixed(2)}%</strong>.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ background: '#D1D5DB', color: '#1F2937', padding: '5px 12px', fontWeight: 800, fontSize: '0.82rem', marginBottom: 8 }}>
                  Investor Profile
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', lineHeight: 1.6, color: '#374151' }}>{lotus.investor_profile}</p>
              </div>

              <div style={{ background: '#991B1B', color: '#FFFFFF', borderRadius: 6, padding: '14px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 10 }}>Benefit to Investors</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', fontSize: '0.76rem' }}>
                  {lotus.benefits.map((b) => (
                    <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span>•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ETF vs Benchmark Line Chart */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 12px' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#4B5563', marginBottom: 8 }}>
                  LOTUS HALAL EQUITY ETF VS NGXLII (NORMALIZED NAV / BENCHMARK)
                </div>
                <div style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lotus.nav_vs_benchmark_series} margin={{ top: 5, right: 12, left: -12, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="etf" name="LHE ETF NAV/Unit" stroke="#1F2937" strokeWidth={2.2} dot={false} />
                      <Line type="monotone" dataKey="benchmark" name="NGXLII (Benchmark Index)" stroke="#991B1B" strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', border: '1px solid #D1D5DB' }}>
                <thead>
                  <tr style={{ background: '#991B1B', color: '#FFFFFF' }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left' }}>Performance</th>
                    <th style={{ padding: '7px 10px', textAlign: 'right' }}>Last 7 Days</th>
                    <th style={{ padding: '7px 10px', textAlign: 'right' }}>Last 30 days</th>
                    <th style={{ padding: '7px 10px', textAlign: 'right' }}>Year to Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lotus.performance_table.map((row) => (
                    <tr key={row.metric} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#111827' }}>{row.metric}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: row.d7.startsWith('-') ? '#B91C1C' : '#047857', fontWeight: 700 }}>{row.d7}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: row.d30.startsWith('-') ? '#B91C1C' : '#047857', fontWeight: 700 }}>{row.d30}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#047857', fontWeight: 800 }}>{row.ytd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: '0.7rem', color: '#6B7280', lineHeight: 1.5 }}>
            <div style={{ color: '#991B1B', fontWeight: 700, marginBottom: 4 }}>{lotus.contact}</div>
            <div><strong>Disclaimer:</strong> {lotus.disclaimer}</div>
          </div>
        </article>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE B: NORRENBERGER ISLAMIC FUND FACTSHEET                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {template === 'norrenberger' && (
        <article className="institutional-factsheet-sheet" style={{
          background: '#FFFFFF',
          color: '#1F2937',
          borderRadius: 18,
          border: '1px solid #E5E7EB',
          boxShadow: 'var(--shadow-md)',
          padding: '28px 32px',
          fontFamily: 'var(--sans)',
        }}>
          {/* Top Branding Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #FDE68A, #D97706)',
                boxShadow: '0 2px 10px rgba(217,119,6,0.35)',
              }} />
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#DC2626', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  nörrenberger
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#4B5563', letterSpacing: '0.8px', marginTop: 2 }}>
                  INVESTMENTS | OPPORTUNITIES | WEALTH
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '0.3px' }}>
                {norren.fund_name}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>
                Factsheet | {norren.factsheet_date}
              </div>
            </div>
          </div>

          {/* Signature Red KPI Banner */}
          <div style={{
            background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
            borderRadius: 12,
            padding: '18px 24px',
            color: '#FFFFFF',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            marginBottom: 22,
          }}>
            {norren.kpis.map((kpi, idx) => (
              <div key={kpi.label} style={{
                borderRight: idx < norren.kpis.length - 1 ? '1px solid rgba(255,255,255,0.28)' : 'none',
                paddingRight: 12,
              }}>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.1 }}>{kpi.value}</div>
                <div style={{ fontSize: '0.74rem', opacity: 0.9, marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Main 2-Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 310px) 1fr', gap: 22, alignItems: 'start' }} className="mobile-col">
            {/* Left Sidebar Card */}
            <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                  FUND OBJECTIVE
                </div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#374151', lineHeight: 1.6 }}>
                  {norren.objective}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                  KEY FACTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {norren.key_facts.map((kf) => (
                    <div key={kf.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', paddingBottom: 5, borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#6B7280' }}>{kf.label}</span>
                      <span style={{ fontWeight: 800, color: '#111827' }}>{kf.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 6 }}>
                  BENCHMARK
                </div>
                <div style={{ fontSize: '0.76rem', color: '#374151', fontWeight: 600 }}>{norren.benchmark}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                  RISK PROFILE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} style={{
                      height: 14, borderRadius: 2,
                      background: step <= norren.risk_profile.level ? '#DC2626' : '#E5E7EB',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#B91C1C' }}>{norren.risk_profile.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#6B7280', marginTop: 2 }}>
                  <span>Lower risk</span>
                  <span>Higher risk</span>
                </div>
              </div>
            </div>

            {/* Right Visuals & Allocation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 2026 Monthly Performance */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                  2026 PERFORMANCE (YIELD % VS BENCHMARK %)
                </div>
                <div style={{ height: 185 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={norren.monthly_performance_2026} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[12, 20]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="yield" name="Yield %" fill="#DC2626" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="benchmark" name="Benchmark %" fill="#9CA3AF" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Historical Performance + Asset Allocation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                    HISTORICAL PERFORMANCE
                  </div>
                  <div style={{ height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={norren.historical_performance} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="yield" name="YTD Yield %" fill="#DC2626" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="benchmark" name="Benchmark %" fill="#9CA3AF" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px' }}>
                      ASSET ALLOCATION &amp; IRSHAD MANDATE CHECK
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', border: '1px solid #E5E7EB' }}>
                    <thead>
                      <tr style={{ background: '#1F2937', color: '#FFFFFF' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Securities</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Current</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Target</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Mandate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {norren.allocation.map((row) => {
                        const outOfBand = row.current < row.target_min || row.current > row.target_max;
                        return (
                          <tr key={row.security} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                              <div>{row.security}</div>
                              <div style={{ fontSize: '0.64rem', color: '#6B7280' }}>{row.shariah_contract}</div>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{row.current.toFixed(2)}%</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#4B5563' }}>{row.target_label}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px', borderRadius: 999, fontSize: '0.63rem', fontWeight: 800,
                                background: outOfBand ? '#FEF3C7' : '#ECFDF5',
                                color: outOfBand ? '#B45309' : '#047857',
                                whiteSpace: 'nowrap',
                              }}>
                                {outOfBand ? 'Rebalance' : 'Halal OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maturity Profile & Distribution Per Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                    FUND MATURITY PROFILE
                  </div>
                  <div style={{ height: 155 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={norren.maturity_profile} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="pct" name="Share %" fill="#DC2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                    DISTRIBUTION PER UNIT (₦)
                  </div>
                  <div style={{ height: 155 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={norren.distribution_per_unit} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="quarter" tick={{ fontSize: 9 }} />
                        <YAxis domain={[2.5, 4.8]} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `₦${v}`} />
                        <Line type="monotone" dataKey="amount" name="Distribution (₦)" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3.5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Commentary & Market Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }} className="mobile-col">
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                    MARKET COMMENTARY
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#374151', lineHeight: 1.65 }}>
                    {norren.commentary}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', letterSpacing: '1px', marginBottom: 8 }}>
                    MARKET INDICATORS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {norren.market_indicators.map((ind) => (
                      <div key={ind.title} style={{ background: '#F3F4F6', borderRadius: 8, padding: '10px' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#B91C1C' }}>{ind.value}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827', marginTop: 2 }}>{ind.title}</div>
                        <div style={{ fontSize: '0.64rem', color: '#6B7280', marginTop: 2, lineHeight: 1.3 }}>{ind.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: '0.68rem', color: '#6B7280', lineHeight: 1.5 }}>
            <div>{norren.disclaimer}</div>
            <div style={{ textAlign: 'center', fontWeight: 700, color: '#374151', marginTop: 8 }}>{norren.footer_note}</div>
          </div>
        </article>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE C: DYNAMIC IRSHAD SCREENED PORTFOLIO FACTSHEET          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {template === 'custom' && (
        <article className="institutional-factsheet-sheet" style={{
          background: '#FFFFFF',
          color: '#1F2937',
          borderRadius: 18,
          border: '1px solid #E5E7EB',
          boxShadow: 'var(--shadow-md)',
          padding: '28px 32px',
          fontFamily: 'var(--sans)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingBottom: 14, borderBottom: `2px solid ${activeTheme.primary}`, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: activeTheme.primary, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                {meta.institution_name} · {meta.ticker}
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#111827' }}>
                {meta.fund_name}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>
                Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • Benchmark: {meta.benchmark} • Fee: {meta.management_fee}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: activeTheme.light, border: `1px solid ${activeTheme.border}`, color: activeTheme.primary, fontWeight: 800, fontSize: '0.76rem' }}>
              <CheckCircle2 size={16} /> Irshad Screened &amp; Audited
            </div>
          </div>

          {/* KPI Strip */}
          <div style={{
            background: activeTheme.grad,
            borderRadius: 12,
            padding: '18px 22px',
            color: '#fff',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 14,
            marginBottom: 18,
          }}>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>{formatNaira(customSummary.total_aum, true)}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Screened Portfolio AUM</div>
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>{Number(customSummary.compliant_pct || 0).toFixed(1)}%</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Shariah Compliance Ratio</div>
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>{customSummary.compliant_count || 0} / {customSummary.holdings_count || 0}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Compliant Constituents</div>
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>{formatNaira(customSummary.total_purification_due)}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Total Purification Required</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 18, padding: 14, borderRadius: 12, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: activeTheme.primary, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Fund Objective</div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#374151', lineHeight: 1.55 }}>{meta.objective}</p>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: activeTheme.primary, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Manager &amp; Shariah Commentary</div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#374151', lineHeight: 1.55 }}>{meta.commentary}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22, marginBottom: 22 }}>
            {/* Sector Allocation */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#111827', marginBottom: 10 }}>Sector Exposure Breakdown</div>
              {customSectors.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10, alignItems: 'center' }}>
                  <div style={{ height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={customSectors} dataKey="weight_pct" nameKey="sector" innerRadius={42} outerRadius={72} paddingAngle={2}>
                          {customSectors.map((s, idx) => (
                            <Cell key={s.sector} fill={PALETTE[idx % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {customSectors.slice(0, 7).map((s, idx) => (
                      <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[idx % PALETTE.length], display: 'inline-block' }} />
                          {s.sector}
                        </span>
                        <strong>{Number(s.weight_pct).toFixed(2)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Upload or select a portfolio to generate sector allocation.</div>
              )}
            </div>

            {/* Governance & Purification Summary */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, background: '#F9FAFB' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#111827', marginBottom: 10 }}>Shariah Governance &amp; Rebalancing Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                  <span style={{ color: '#6B7280' }}>Compliant Equity Value</span>
                  <strong style={{ color: '#047857' }}>{formatNaira(customSummary.compliant_aum)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                  <span style={{ color: '#6B7280' }}>Non-Compliant Exposure</span>
                  <strong style={{ color: '#B91C1C' }}>{formatNaira(customSummary.non_compliant_aum)} ({Number(customSummary.non_compliant_pct || 0).toFixed(2)}%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                  <span style={{ color: '#6B7280' }}>Weighted Purification / Unit</span>
                  <strong style={{ color: '#B45309' }}>₦{Number(customSummary.weighted_purification_per_unit || 0).toFixed(4)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Screening Standard</span>
                  <strong>AAOIFI Standard No. 21</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', border: '1px solid #E5E7EB' }}>
            <thead>
              <tr style={{ background: '#111827', color: '#FFFFFF' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ticker</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Security</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Weight</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Market Value</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Verdict</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Debt / Cash / Impure</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purification</th>
              </tr>
            </thead>
            <tbody>
              {customHoldings.map((h) => (
                <tr key={h.symbol} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 800 }}>{h.symbol}</td>
                  <td style={{ padding: '7px 10px' }}>{h.name}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{Number(h.weight_pct || 0).toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{formatNaira(h.market_value)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: h.status === 'halal' ? '#047857' : '#B91C1C' }}>
                    {h.status === 'halal' ? 'COMPLIANT' : h.status.toUpperCase()}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: '#4B5563' }}>
                    {h.debt_ratio ?? '—'}% / {h.cash_ratio ?? '—'}% / {Number(h.impure_ratio || 0).toFixed(2)}%
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#B45309' }}>
                    {formatNaira(h.purification_due)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16, fontSize: '0.68rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>Generated automatically by Irshad Institutional Shariah Infrastructure (iirshad.com).</span>
            <span>Screening Criteria: Debt &lt; 30%, Cash &amp; Interest Securities &lt; 30%, Impermissible Income &lt; 5%.</span>
          </div>
        </article>
      )}
    </div>
  );
}
