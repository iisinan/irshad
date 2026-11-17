import React, { useMemo, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Building2, TrendingUp, Percent, ShieldCheck
} from 'lucide-react';
import { computeFundValidation } from './institutionalFixtures';

const SUB_TABS = [
  { id: 'identity', label: '1. Identity & Parties', icon: Building2 },
  { id: 'pricing', label: '2. Pricing & Returns', icon: TrendingUp },
  { id: 'fees', label: '3. Fees, Risk & Shari\'ah', icon: Percent },
  { id: 'checks', label: '4. Validation & Sign-Off', icon: ShieldCheck },
];

export default function InstitutionalFundInputsDrawer({
  meta,
  onChangeMeta,
  holdings = [],
  summary = {},
  isNorrenberger = false,
  isBalanced = false,
}) {
  const [subTab, setSubTab] = useState('identity');

  const update = (key, value) => {
    onChangeMeta({ ...meta, [key]: value });
  };

  const updateParty = (key, value) => {
    onChangeMeta({
      ...meta,
      parties: { ...(meta.parties || {}), [key]: value },
    });
  };

  const updateFeeLine = (idx, pct) => {
    const lines = [...(meta.fee_lines || [])];
    if (!lines[idx]) return;
    lines[idx] = { ...lines[idx], pct: Number(pct || 0) };
    const nextTer = lines.reduce((acc, f) => acc + Number(f.pct || 0), 0);
    onChangeMeta({
      ...meta,
      fee_lines: lines,
      expense_ratio_pct: Number(nextTer.toFixed(2)),
      management_fee: `${Number(lines[0]?.pct || 0).toFixed(2)}%`,
    });
  };

  const validation = useMemo(
    () => computeFundValidation(meta, holdings, summary, isNorrenberger, isBalanced),
    [meta, holdings, summary, isNorrenberger, isBalanced]
  );

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-section)',
    color: 'var(--text-dark)',
    fontSize: '0.79rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.67rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 4,
  };

  return (
    <div className="no-print" style={{
      background: 'var(--bg)',
      borderRadius: 16,
      padding: 18,
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Manager Fund Setup &amp; Reconciliation Inputs
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            Structured fields from Irshad Fact Sheet &amp; One-Page Summary specification. Calculated ratios (Premium/NAV, Concentration, Zakat, TER) update live.
          </div>
        </div>
        <span style={{
          padding: '5px 11px',
          borderRadius: 999,
          fontSize: '0.72rem',
          fontWeight: 800,
          background: validation.passCount === validation.totalChecks ? 'var(--halal-bg)' : 'rgba(209, 165, 98, 0.16)',
          color: validation.passCount === validation.totalChecks ? 'var(--halal)' : '#8C6828',
        }}>
          {validation.passCount} / {validation.totalChecks} Automated Checks Passed
        </span>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary-50)' : 'var(--bg-section)',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Identity & Parties */}
      {subTab === 'identity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Institution / Fund Manager</label>
            <input type="text" value={meta.institution_name || ''} onChange={(e) => update('institution_name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fund / Mandate Name</label>
            <input type="text" value={meta.fund_name || ''} onChange={(e) => update('fund_name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ticker &amp; ISIN</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input type="text" value={meta.ticker || ''} onChange={(e) => update('ticker', e.target.value)} placeholder="Ticker" style={inputStyle} />
              <input type="text" value={meta.isin || ''} onChange={(e) => update('isin', e.target.value)} placeholder="ISIN" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>As-Of Cut-Off Date</label>
            <input type="text" value={meta.factsheet_date || ''} onChange={(e) => update('factsheet_date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>SEC Registration / Fund Type</label>
            <input type="text" value={meta.parties?.sec_status || ''} onChange={(e) => updateParty('sec_status', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Trustee</label>
            <input type="text" value={meta.parties?.trustee || ''} onChange={(e) => updateParty('trustee', e.target.value)} placeholder="e.g. STL Trustees" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Custodian</label>
            <input type="text" value={meta.parties?.custodian || ''} onChange={(e) => updateParty('custodian', e.target.value)} placeholder="e.g. Stanbic IBTC Nominees" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Auditor / Registrar</label>
            <input type="text" value={meta.parties?.auditor || ''} onChange={(e) => updateParty('auditor', e.target.value)} placeholder="External Fund Auditor" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Mandate Objective</label>
              <textarea rows={2} value={meta.objective || ''} onChange={(e) => update('objective', e.target.value)} style={{ ...inputStyle, fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={labelStyle}>How to Invest / Manager Contact</label>
              <textarea rows={2} value={meta.contact || ''} onChange={(e) => update('contact', e.target.value)} style={{ ...inputStyle, fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Pricing, Returns & Distributions */}
      {subTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Fund Size (₦)</label>
            <input type="number" value={meta.fund_size_ngn || ''} onChange={(e) => update('fund_size_ngn', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>NAV / Unit Price (₦)</label>
            <input type="number" step="0.01" value={meta.nav_per_unit || ''} onChange={(e) => update('nav_per_unit', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>NGX Closing Price (₦, if listed)</label>
            <input type="number" step="0.01" value={meta.closing_price || ''} onChange={(e) => update('closing_price', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Units in Issue</label>
            <input type="number" value={meta.units_in_issue || ''} onChange={(e) => update('units_in_issue', Number(e.target.value))} placeholder="Auto-derived if 0" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Benchmark Index / Sukuk</label>
            <input type="text" value={meta.benchmark || ''} onChange={(e) => update('benchmark', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Distribution</label>
            <input type="text" value={meta.last_distribution || ''} onChange={(e) => update('last_distribution', e.target.value)} placeholder="e.g. ₦0.81/unit" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Purification Per Unit (₦)</label>
            <input type="number" step="0.01" value={meta.purification_per_unit_input ?? ''} onChange={(e) => update('purification_per_unit_input', e.target.value === '' ? null : Number(e.target.value))} placeholder="Auto from Irshad DB" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Indicative Zakat Per Unit (₦)</label>
            <input type="number" step="0.01" value={meta.zakat_per_unit_input ?? ''} onChange={(e) => update('zakat_per_unit_input', e.target.value === '' ? null : Number(e.target.value))} placeholder="Auto 2.5% if blank" style={inputStyle} />
          </div>
        </div>
      )}

      {/* 3. Fees, Risk & Shari'ah */}
      {subTab === 'fees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {(meta.fee_lines || []).map((f, idx) => (
            <div key={f.label}>
              <label style={labelStyle}>{f.label} (%)</label>
              <input type="number" step="0.01" value={f.pct} onChange={(e) => updateFeeLine(idx, e.target.value)} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Total Expense Ratio (%)</label>
            <input type="number" step="0.01" value={meta.expense_ratio_pct ?? ''} onChange={(e) => update('expense_ratio_pct', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>SEC Risk Scale (1 to 7)</label>
            <select
              value={meta.risk_level || 4}
              onChange={(e) => {
                const lvl = Number(e.target.value);
                const labels = {
                  1: 'Conservative, 1 of 7',
                  2: 'Low Risk, 2 of 7',
                  3: 'Moderate Low, 3 of 7',
                  4: 'Moderate, 4 of 7',
                  5: 'Moderate High, 5 of 7',
                  6: 'High Growth, 6 of 7',
                  7: 'Aggressive Equity, 7 of 7',
                };
                onChangeMeta({ ...meta, risk_level: lvl, risk_label: labels[lvl] });
              }}
              style={inputStyle}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} of 7</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>3Y Annualized Volatility (%)</label>
            <input type="number" step="0.1" value={meta.volatility_3y_pct ?? ''} onChange={(e) => update('volatility_3y_pct', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Shari&apos;ah Advisory &amp; Certification</label>
            <input type="text" value={meta.shariah_board || meta.parties?.shariah_board || ''} onChange={(e) => update('shariah_board', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Market / Shari&apos;ah Commentary &amp; Rebalancing Notes</label>
            <textarea rows={2} value={meta.commentary || ''} onChange={(e) => update('commentary', e.target.value)} style={{ ...inputStyle, fontFamily: 'inherit' }} />
          </div>
        </div>
      )}

      {/* 4. Automated Reconciliation & Sign-Off Checks */}
      {subTab === 'checks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {validation.checks.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: c.pass ? 'rgba(69, 165, 138, 0.08)' : 'rgba(209, 165, 98, 0.14)',
                  border: `1px solid ${c.pass ? 'rgba(69, 165, 138, 0.3)' : 'rgba(209, 165, 98, 0.45)'}`,
                }}
              >
                {c.pass ? (
                  <CheckCircle2 size={16} color="#297D66" style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={16} color="#9A7228" style={{ marginTop: 2, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '0.77rem', fontWeight: 800, color: 'var(--text-dark)' }}>{c.title}</div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Pre-Publication Sign-Off Gate
            </div>
            <div>
              <label style={labelStyle}>Shari&apos;ah Adviser / Board Sign-Off</label>
              <input type="text" value={meta.shariah_board || meta.parties?.shariah_board || ''} onChange={(e) => update('shariah_board', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fund Manager Approver Name</label>
              <input type="text" value={meta.approved_by || ''} onChange={(e) => update('approved_by', e.target.value)} placeholder="e.g. Chief Investment Officer / Compliance Officer" style={inputStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
