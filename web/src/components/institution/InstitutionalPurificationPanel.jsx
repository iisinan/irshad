import React, { useMemo, useState } from 'react';
import { Droplet, Download, CheckCircle2, Building2, Calculator, Sparkles, ArrowRight } from 'lucide-react';
import { LOTUS_FALLBACK_DATA, BALANCED_FALLBACK_DATA, formatNaira } from './institutionalFixtures';

export default function InstitutionalPurificationPanel({
  screened,
  activePresetId,
  fundName,
}) {
  const [distributionMode, setDistributionMode] = useState('fund'); // 'fund' | 'investor'
  const [simulatedUnits, setSimulatedUnits] = useState(100000);
  const holdings = useMemo(() => screened?.holdings || [], [screened?.holdings]);
  const summary = screened?.summary || {};

  const purifiableHoldings = useMemo(
    () => holdings.filter((h) => h.status === 'halal' && (h.purification_required || Number(h.impure_ratio) > 0 || Number(h.purification_due) > 0)),
    [holdings]
  );

  const isLotus = activePresetId === 'lotus_etf';
  const isBalanced = activePresetId === 'balanced_fund';
  const totalUnitsHeld = useMemo(
    () => holdings.reduce((acc, h) => acc + Number(h.shares || 0), 0),
    [holdings]
  );

  const fundLevelTotalPurification = Number(summary.total_purification_due || 0);
  const etfPublishedPerUnit = isLotus
    ? LOTUS_FALLBACK_DATA.purification_per_unit_fy25
    : (isBalanced ? BALANCED_FALLBACK_DATA.purification_per_unit_fy25 : Number(summary.weighted_purification_per_unit || 0));
  const zakatPerUnit = isLotus
    ? LOTUS_FALLBACK_DATA.zakat_per_unit
    : (isBalanced ? BALANCED_FALLBACK_DATA.zakat_per_unit : Number(summary.indicative_zakat_per_unit || 0));
  const simulatedLiability = simulatedUnits * etfPublishedPerUnit;
  const simulatedZakat = simulatedUnits * zakatPerUnit;

  const exportCsv = () => {
    const header = ['Symbol', 'Company', 'Units', 'Trailing Dividend/Share (NGN)', 'Total Dividends (NGN)', 'Impure Income Ratio (%)', 'Purification/Unit (NGN)', 'Total Purification Due (NGN)'];
    const lines = [header.join(',')];
    purifiableHoldings.forEach((h) => {
      lines.push([
        h.symbol,
        `"${String(h.name || '').replace(/"/g, '""')}"`,
        h.shares,
        Number(h.trailing_dividend_per_share || 0).toFixed(4),
        Number(h.total_dividends || 0).toFixed(2),
        Number(h.impure_ratio || 0).toFixed(2),
        Number(h.purification_per_unit || 0).toFixed(4),
        Number(h.purification_due || 0).toFixed(2),
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fundName || 'irshad-institutional').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-purification-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner — AAOIFI Methodology + Fund vs Investor Action */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--gold-50)', color: '#92400e', fontSize: '0.7rem', fontWeight: 800, marginBottom: 8 }}>
              <Sparkles size={12} /> AAOIFI SHARIAH STANDARD NO. 21 PURIFICATION ENGINE
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              Institutional Dividend &amp; Fund-Level Purification
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: 700, lineHeight: 1.55 }}>
              Irshad isolates non-permissible revenue (interest earned on bank deposits &amp; conventional securities) from each portfolio company&apos;s audited Q2/Q3 filings and computes both <strong>Fund-Level Deductions</strong> and <strong>Per-Unit Unitholder Disclosure Rates</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            <Download size={15} /> Export Purification CSV
          </button>
        </div>

        {/* Toggle: Fund-Level vs Investor-Level */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <button
            type="button"
            onClick={() => setDistributionMode('fund')}
            style={{
              textAlign: 'left',
              padding: 18,
              borderRadius: 16,
              cursor: 'pointer',
              border: `2px solid ${distributionMode === 'fund' ? 'var(--primary)' : 'var(--border)'}`,
              background: distributionMode === 'fund' ? 'var(--primary-50)' : 'var(--bg-section)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} color="var(--primary)" /> Fund-Level Deduction Mode
              </span>
              {distributionMode === 'fund' && <CheckCircle2 size={16} color="var(--primary)" />}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Fund manager deducts &amp; disburses total impure income directly to accredited Shariah charities before distributing net halal yield to unitholders.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDistributionMode('investor')}
            style={{
              textAlign: 'left',
              padding: 18,
              borderRadius: 16,
              cursor: 'pointer',
              border: `2px solid ${distributionMode === 'investor' ? 'var(--primary)' : 'var(--border)'}`,
              background: distributionMode === 'investor' ? 'var(--primary-50)' : 'var(--bg-section)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calculator size={16} color="var(--primary)" /> Investor-Level Per-Unit Disclosure
              </span>
              {distributionMode === 'investor' && <CheckCircle2 size={16} color="var(--primary)" />}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Publishes an audited annual <strong>per-unit purification rate</strong> (e.g. Lotus Halal Equity ETF: <strong>₦0.46/unit</strong> for FY&apos;2025) on the Factsheet &amp; Irshad portal so investors cleanse their own distributions.
            </p>
          </button>
        </div>
      </div>

      {/* Summary KPI + Interactive Unitholder Calculator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Constituents Requiring Purification
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: 6 }}>
            {purifiableHoldings.length} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {holdings.length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Halal equities with &gt;0% interest income ratio
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Aggregate Portfolio Purification Due
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#b45309', marginTop: 6 }}>
            {formatNaira(fundLevelTotalPurification)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Across {totalUnitsHeld.toLocaleString()} underlying constituent shares
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            {isLotus ? 'Published ETF Purification Rate (FY25)' : 'Weighted Portfolio Purification / Unit'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: 6 }}>
            ₦{Number(etfPublishedPerUnit).toFixed(4)}
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}> / unit</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {isLotus ? 'Official Lotus Halal Equity ETF FY2025 figure' : 'Computed live from trailing 12M dividends'}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(69,165,138,0.1) 0%, rgba(209,165,98,0.12) 100%)', borderRadius: 18, padding: 20, border: '1px solid var(--primary-100)' }}>
          <label htmlFor="sim-units-input" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Unitholder / Mandate Simulator
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              id="sim-units-input"
              type="number"
              min={0}
              step={1000}
              value={simulatedUnits}
              onChange={(e) => setSimulatedUnits(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                border: '1px solid var(--border-strong)', background: 'var(--bg)',
                color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.85rem',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>units</span>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowRight size={13} /> Charity Due: {formatNaira(simulatedLiability)}
          </div>
          {zakatPerUnit > 0 && (
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
              Indicative Zakat (2.5%): {formatNaira(simulatedZakat)}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Underlying Constituent Purification Breakdown */}
      <div style={{ background: 'var(--bg)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Constituent-Level Purification Formula Breakdown
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Formula: (Shares × Trailing 12M Dividend/Share) × (Impermissible Interest Income ÷ Total Revenue)
            </p>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)' }}>
            Mode: {distributionMode === 'fund' ? 'Fund-Level Pre-Distribution Deduction' : 'Investor-Level Annual Notice'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border-strong)' }}>
                {['Ticker', 'Shares Held', 'Div/Share', 'Gross Dividends', 'Impure Ratio', 'Purify / Share', 'Total Purification'].map((col, i) => (
                  <th key={col} style={{ padding: '10px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purifiableHoldings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    No compliant holdings with positive purification ratios in this selection.
                  </td>
                </tr>
              ) : purifiableHoldings.map((h) => (
                <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--text-dark)' }}>{h.symbol}</div>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{h.name}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(h.shares || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    ₦{Number(h.trailing_dividend_per_share || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    {formatNaira(h.total_dividends)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '0.8rem', color: '#b45309', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(h.impure_ratio || 0).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    ₦{Number(h.purification_per_unit || 0).toFixed(4)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, fontSize: '0.84rem', color: '#b45309', fontVariantNumeric: 'tabular-nums' }}>
                    {formatNaira(h.purification_due)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Purification Schedule (Lotus ETF Reference from Image 3 / PDF) */}
      {isLotus && (
        <div style={{ background: 'var(--bg)', borderRadius: 20, padding: 20, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplet size={16} color="#b45309" /> Lotus Halal Equity ETF — Historical Published Purification Schedule
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {LOTUS_FALLBACK_DATA.purification_history.map((item) => (
              <div key={item.year} style={{ padding: 14, borderRadius: 14, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>FY {item.year}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', margin: '4px 0' }}>₦{item.per_unit.toFixed(2)}<span style={{ fontSize: '0.72rem', fontWeight: 600 }}>/unit</span></div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
