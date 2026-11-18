import React, { useMemo, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Building2, TrendingUp, Percent, ShieldCheck,
  Save, Plus, Trash2
} from 'lucide-react';
import { computeFundValidation } from './institutionalFixtures';

const SUB_TABS = [
  { id: 'identity', label: '1. Identity & Parties', icon: Building2 },
  { id: 'pricing', label: '2. Pricing & Returns', icon: TrendingUp },
  { id: 'fees', label: "3. Fees, Risk & Shari'ah", icon: Percent },
  { id: 'checks', label: '4. Validation & Sign-Off', icon: ShieldCheck },
];

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.67rem',
  fontWeight: 800,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.45px',
  lineHeight: 1.35,
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-section)',
  color: 'var(--text-dark)',
  fontSize: '0.8rem',
  lineHeight: 1.4,
};

const FIELD_COL_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

export default function InstitutionalFundInputsDrawer({
  meta,
  onChangeMeta,
  holdings = [],
  summary = {},
  activePresetId = 'uploaded',
  isNorrenberger = false,
  isBalanced = false,
  onSaveMandate,
  isSaving = false,
  isAuthenticatedInstitution = false,
  smartBrief = null,
}) {
  const [subTab, setSubTab] = useState('identity');
  const [newLogSymbol, setNewLogSymbol] = useState('');
  const [newLogAction, setNewLogAction] = useState('Removed from Mandate');
  const [newLogDetail, setNewLogDetail] = useState('');

  const update = (key, value) => {
    onChangeMeta({ ...meta, [key]: value });
  };

  const updateParty = (key, value) => {
    onChangeMeta({
      ...meta,
      parties: { ...(meta.parties || {}), [key]: value },
    });
  };

  const updateDocLink = (key, val) => {
    onChangeMeta({
      ...meta,
      document_links: { ...(meta.document_links || {}), [key]: val },
    });
  };

  const handleAddComplianceEvent = () => {
    const sym = newLogSymbol.trim().toUpperCase();
    if (!sym) return;
    const prev = Array.isArray(meta.non_compliance_events) ? meta.non_compliance_events : [];
    onChangeMeta({
      ...meta,
      non_compliance_events: [
        {
          date: new Date().toISOString().slice(0, 10),
          symbol: sym,
          action: newLogAction.trim() || 'Reviewed',
          detail: newLogDetail.trim() || 'Logged by fund compliance officer.',
        },
        ...prev,
      ],
    });
    setNewLogSymbol('');
    setNewLogDetail('');
  };

  const handleDeleteComplianceEvent = (idx) => {
    const prev = Array.isArray(meta.non_compliance_events) ? meta.non_compliance_events : [];
    onChangeMeta({
      ...meta,
      non_compliance_events: prev.filter((_, i) => i !== idx),
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

  return (
    <div className="no-print" style={{
      background: 'var(--bg)',
      borderRadius: 16,
      padding: '20px 22px',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Clean Aligned Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Manager Fund Setup &amp; Reconciliation Inputs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Structured fields from Irshad Fact Sheet &amp; One-Page Summary specification. Calculated ratios update live.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: '0.73rem',
            fontWeight: 800,
            background: validation.passCount === validation.totalChecks ? 'var(--halal-bg)' : 'rgba(209, 165, 98, 0.16)',
            color: validation.passCount === validation.totalChecks ? 'var(--halal)' : '#8C6828',
          }}>
            {validation.passCount} / {validation.totalChecks} Automated Checks Passed
          </span>
        </div>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
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
                padding: '8px 13px', borderRadius: 9, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Institution / Fund Manager</label>
            <input type="text" value={meta.institution_name || ''} onChange={(e) => update('institution_name', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Fund / Mandate Name</label>
            <input type="text" value={meta.fund_name || ''} onChange={(e) => update('fund_name', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Ticker &amp; ISIN</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" value={meta.ticker || ''} onChange={(e) => update('ticker', e.target.value)} placeholder="Ticker" style={INPUT_STYLE} />
              <input type="text" value={meta.isin || ''} onChange={(e) => update('isin', e.target.value)} placeholder="ISIN" style={INPUT_STYLE} />
            </div>
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>As-Of Cut-Off Date</label>
            <input type="text" value={meta.factsheet_date || ''} onChange={(e) => update('factsheet_date', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>SEC Registration / Fund Type</label>
            <input type="text" value={meta.parties?.sec_status || ''} onChange={(e) => updateParty('sec_status', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Trustee</label>
            <input type="text" value={meta.parties?.trustee || ''} onChange={(e) => updateParty('trustee', e.target.value)} placeholder="e.g. STL Trustees" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Custodian</label>
            <input type="text" value={meta.parties?.custodian || ''} onChange={(e) => updateParty('custodian', e.target.value)} placeholder="e.g. Stanbic IBTC Nominees" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Auditor / Registrar</label>
            <input type="text" value={meta.parties?.auditor || ''} onChange={(e) => updateParty('auditor', e.target.value)} placeholder="External Fund Auditor" style={INPUT_STYLE} />
          </div>
          <div style={{ ...FIELD_COL_STYLE, gridColumn: '1 / -1' }}>
            <label style={LABEL_STYLE}>Mandate Objective</label>
            <textarea rows={3} value={meta.objective || ''} onChange={(e) => update('objective', e.target.value)} style={{ ...INPUT_STYLE, fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Prospectus URL</label>
            <input type="url" value={meta.document_links?.prospectus_url || ''} onChange={(e) => updateDocLink('prospectus_url', e.target.value)} placeholder="https://.../prospectus.pdf" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Trust Deed URL</label>
            <input type="url" value={meta.document_links?.trust_deed_url || ''} onChange={(e) => updateDocLink('trust_deed_url', e.target.value)} placeholder="https://.../trust-deed.pdf" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Audited Accounts URL</label>
            <input type="url" value={meta.document_links?.audited_accounts_url || ''} onChange={(e) => updateDocLink('audited_accounts_url', e.target.value)} placeholder="https://.../audited-accounts.pdf" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Shari&apos;ah Certificate URL</label>
            <input type="url" value={meta.document_links?.shariah_certificate_url || ''} onChange={(e) => updateDocLink('shariah_certificate_url', e.target.value)} placeholder="https://.../shariah-certificate.pdf" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {/* 2. Pricing, Returns & Distributions */}
      {subTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Fund Size (₦)</label>
            <input type="number" value={meta.fund_size_ngn || ''} onChange={(e) => update('fund_size_ngn', Number(e.target.value))} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>NAV / Unit Price (₦)</label>
            <input type="number" step="0.01" value={meta.nav_per_unit || ''} onChange={(e) => update('nav_per_unit', Number(e.target.value))} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>NGX Closing Price (₦, if listed)</label>
            <input type="number" step="0.01" value={meta.closing_price || ''} onChange={(e) => update('closing_price', Number(e.target.value))} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Units in Issue</label>
            <input type="number" value={meta.units_in_issue || ''} onChange={(e) => update('units_in_issue', Number(e.target.value))} placeholder="Auto-derived if 0" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Benchmark Index / Sukuk</label>
            <input type="text" value={meta.benchmark || ''} onChange={(e) => update('benchmark', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Last Distribution</label>
            <input type="text" value={meta.last_distribution || ''} onChange={(e) => update('last_distribution', e.target.value)} placeholder="e.g. ₦0.81/unit" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Purification Per Unit (₦)</label>
            <input type="number" step="0.01" value={meta.purification_per_unit_input ?? ''} onChange={(e) => update('purification_per_unit_input', e.target.value === '' ? null : Number(e.target.value))} placeholder="Auto from Irshad DB" style={INPUT_STYLE} />
          </div>
          <div style={FIELD_COL_STYLE}>
            <label style={LABEL_STYLE}>Indicative Zakat Per Unit (₦)</label>
            <input type="number" step="0.01" value={meta.zakat_per_unit_input ?? ''} onChange={(e) => update('zakat_per_unit_input', e.target.value === '' ? null : Number(e.target.value))} placeholder="Auto 2.5% if blank" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {/* 3. Fees, Risk & Shari'ah */}
      {subTab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Aligned Fee Breakdown & TER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 14, alignItems: 'end' }}>
            {(meta.fee_lines || []).map((f, idx) => (
              <div key={f.label} style={FIELD_COL_STYLE}>
                <label style={LABEL_STYLE}>{f.label} (%)</label>
                <input type="number" step="0.01" value={f.pct} onChange={(e) => updateFeeLine(idx, e.target.value)} style={INPUT_STYLE} />
              </div>
            ))}
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>Total Expense Ratio (%)</label>
              <input type="number" step="0.01" value={meta.expense_ratio_pct ?? ''} onChange={(e) => update('expense_ratio_pct', Number(e.target.value))} style={INPUT_STYLE} />
            </div>
          </div>

          {/* Row 2: Risk, Volatility, Holding Period & Wide Shariah Board Input */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 14, alignItems: 'end' }}>
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>SEC Risk Scale (1 to 7)</label>
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
                style={INPUT_STYLE}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n} of 7</option>
                ))}
              </select>
            </div>
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>3Y Annualized Volatility (%)</label>
              <input type="number" step="0.1" value={meta.volatility_3y_pct ?? ''} onChange={(e) => update('volatility_3y_pct', Number(e.target.value))} style={INPUT_STYLE} />
            </div>
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>Recommended Holding Period</label>
              <input type="text" value={meta.holding_period || ''} onChange={(e) => update('holding_period', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_COL_STYLE, gridColumn: 'span 2' }}>
              <label style={LABEL_STYLE}>Shari&apos;ah Advisory &amp; Certification</label>
              <input type="text" value={meta.shariah_board || meta.parties?.shariah_board || ''} onChange={(e) => update('shariah_board', e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>

          {/* Row 3: Generous Commentary Box */}
          <div>
            <label style={LABEL_STYLE}>Market / Shari&apos;ah Commentary &amp; Rebalancing Notes</label>
            <textarea
              rows={4}
              value={meta.commentary || ''}
              onChange={(e) => update('commentary', e.target.value)}
              style={{ ...INPUT_STYLE, minHeight: 88, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {/* Row 4: Non-Compliance Log (clean proportions without truncated placeholders) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <label style={LABEL_STYLE}>Non-Compliance Events &amp; Rebalancing Log</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(130px, 160px) minmax(175px, 215px) minmax(220px, 1fr) auto',
              gap: 10,
              marginBottom: 10,
            }} className="mobile-col">
              <input type="text" value={newLogSymbol} onChange={(e) => setNewLogSymbol(e.target.value)} placeholder="Ticker (e.g. NASCON)" style={INPUT_STYLE} />
              <input type="text" value={newLogAction} onChange={(e) => setNewLogAction(e.target.value)} placeholder="Action (e.g. Removed)" style={INPUT_STYLE} />
              <input type="text" value={newLogDetail} onChange={(e) => setNewLogDetail(e.target.value)} placeholder="Resolution note (e.g. Impure revenue > 5%)" style={INPUT_STYLE} />
              <button
                type="button"
                onClick={handleAddComplianceEvent}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 9, border: 'none', whiteSpace: 'nowrap',
                  background: '#1E4D40', color: '#fff', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Log Event
              </button>
            </div>
            {(meta.non_compliance_events || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(meta.non_compliance_events || []).map((ev, idx) => (
                  <div key={`${ev.symbol}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, fontSize: '0.75rem', padding: '8px 12px', borderRadius: 9, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                    <span>
                      <strong>{ev.date}</strong> · <strong>{ev.symbol}</strong> ({ev.action}) — {ev.detail}
                    </span>
                    <button type="button" onClick={() => handleDeleteComplianceEvent(idx)} aria-label="Remove log entry" style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Automated Reconciliation & Sign-Off Checks */}
      {subTab === 'checks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {validation.checks.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 13px', borderRadius: 10,
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
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>{c.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Pre-Publication Sign-Off Gate
            </div>
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>Shari&apos;ah Adviser / Board Sign-Off</label>
              <input type="text" value={meta.shariah_board || meta.parties?.shariah_board || ''} onChange={(e) => update('shariah_board', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div style={FIELD_COL_STYLE}>
              <label style={LABEL_STYLE}>Fund Manager Approver Name</label>
              <input type="text" value={meta.approved_by || ''} onChange={(e) => update('approved_by', e.target.value)} placeholder="e.g. Chief Investment Officer / Compliance Officer" style={INPUT_STYLE} />
            </div>
            {isAuthenticatedInstitution && onSaveMandate && holdings.length > 0 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={onSaveMandate}
                style={{
                  marginTop: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 14px', borderRadius: 9, border: 'none',
                  background: '#1E4D40', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                <Save size={14} /> {isSaving ? 'Saving Mandate...' : 'Save Mandate & Sign-Off'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
