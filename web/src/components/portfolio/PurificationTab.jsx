import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ArrowRight, Heart, CheckCircle, Sparkles, X, ChevronRight, Calculator } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';

const fmt = (n, d = 2) => `₦${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

/* ─── Calculation Detail Modal ──────────────────────────────── */
function CalcModal({ h, onClose, onPurify }) {
  const [payLoading, setPayLoading] = useState(false);

  const ratio       = Number(h.non_compliant_ratio || 0);
  const dividends   = Number(h.total_dividends || 0);
  const due         = Number(h.purification_due || 0);
  const totalValue  = Number(h.total_value || 0);
  const shares      = Number(h.shares || 0);
  const avgPrice    = Number(h.average_buy_price || 0);
  const currentPrice = Number(h.current_price || 0);
  const duePct      = dividends > 0 ? Math.min(100, (due / dividends) * 100) : 0;

  const latestDiv = h.latest_dividend;
  let divPerShare = 0;
  let dividendLabel = null;
  let dividendDate = null;
  if (latestDiv) {
    const isUpcoming = latestDiv.status !== 'paid' && new Date(latestDiv.pay_date) > new Date();
    dividendLabel = isUpcoming ? 'Upcoming Dividend' : 'Last Paid Dividend';
    divPerShare = Number(latestDiv.amount);
    if (latestDiv.pay_date) {
      dividendDate = new Date(latestDiv.pay_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  const handlePurify = () => {
    setPayLoading(true);
    setTimeout(() => {
      setPayLoading(false);
      onPurify(h);
      onClose();
    }, 1200);
  };

  const Section = ({ title, formula, rows, accent }) => (
    <div style={{ marginBottom: '16px', borderRadius: '16px', border: `1px solid ${accent || 'var(--border)'}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: accent ? `${accent}12` : 'var(--bg-section)', borderBottom: `1px solid ${accent || 'var(--border)'}` }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: accent || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{formula}</div>
      </div>
      <div style={{ background: 'var(--bg)' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: row.highlight ? 'linear-gradient(135deg, rgba(217,119,6,0.05), rgba(245,158,11,0.02))' : 'transparent' }}>
            <span style={{ fontSize: '0.78rem', color: row.highlight ? 'var(--text-dark)' : 'var(--text-muted)', fontWeight: row.highlight ? 700 : 500, flex: 1, minWidth: '120px' }}>{row.label}</span>
            <span style={{ fontSize: row.highlight ? '0.92rem' : '0.82rem', fontWeight: row.highlight ? 900 : 700, color: row.highlight ? '#D97706' : 'var(--text-dark)' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg)', borderRadius: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.25)', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(217,119,6,0.15)', borderRadius: '50%', pointerEvents: 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 1 }}>
            <X size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <CompanyLogo symbol={h.symbol} logoUrl={h.logo_url} size={48} radius={12} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Purification Calculation</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'white', letterSpacing: '-0.5px' }}>{h.symbol}</div>
              <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>{Number(h.shares).toLocaleString()} shares · {fmt(h.average_buy_price)} avg cost</div>
            </div>
            <div style={{ textAlign: 'right', flex: '1 1 100px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Amount Due</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(due)}</div>
            </div>
          </div>

          {/* Impure progress bar */}
          <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Impure portion of dividends</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F59E0B' }}>{duePct.toFixed(2)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(1, duePct)}%`, background: 'linear-gradient(90deg, #F59E0B, #D97706)', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 12px rgba(245,158,11,0.6)' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Step 1 — Dividends */}
          <Section
            title="Step 1 — Total Dividends Received (12M)"
            formula="Shares Held × Dividend Per Share"
            accent="#0F5257"
            rows={[
              { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
              { label: 'Dividend per share (trailing 12M)', value: fmt(dividends / (shares || 1)) },
              { label: 'Total dividends received', value: fmt(dividends), highlight: true },
            ]}
          />

          {/* Step 2 — Impure Ratio */}
          <Section
            title="Step 2 — AAOIFI Impure Income Ratio"
            formula="Non-Compliant Revenue ÷ Total Revenue × 100"
            accent="#7C3AED"
            rows={[
              { label: "Company's non-compliant income (interest, etc.)", value: `${ratio.toFixed(4)}%` },
              { label: 'AAOIFI permissible threshold', value: '≤ 5.00%' },
              { label: `Compliance status`, value: ratio <= 5 ? '✅ Passes' : '❌ Fails' },
              { label: 'Impure ratio applied', value: `${ratio.toFixed(4)}%`, highlight: true },
            ]}
          />

          {/* Step 3 — Purification Amount */}
          <Section
            title="Step 3 — Purification Amount"
            formula="Total Dividends × Impure Ratio ÷ 100"
            accent="#D97706"
            rows={[
              { label: 'Total dividends received (12M)', value: fmt(dividends) },
              { label: 'Multiplied by impure ratio', value: `${ratio.toFixed(4)}%` },
              { label: 'Amount to purify (donate)', value: fmt(due), highlight: true },
            ]}
          />

          {/* Step 4 — Portfolio snapshot */}
          <Section
            title="Portfolio Snapshot"
            formula="Shares × Current Price"
            rows={[
              { label: 'Current market price', value: fmt(currentPrice) },
              { label: 'Average buy price', value: fmt(avgPrice) },
              { label: 'Unrealised P&L', value: `${currentPrice >= avgPrice ? '+' : ''}${fmt(totalValue - shares * avgPrice)}` },
              { label: 'Total portfolio value', value: fmt(totalValue), highlight: true },
            ]}
          />

          {/* Last/Upcoming dividend if available */}
          {latestDiv && (
            <Section
              title={dividendLabel}
              formula="Declared Per Share × Shares Held"
              rows={[
                { label: 'Pay date', value: dividendDate },
                { label: 'Dividend per share', value: fmt(divPerShare) },
                { label: 'Your total entitlement', value: fmt(divPerShare * shares), highlight: true },
              ]}
            />
          )}

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handlePurify}
              disabled={payLoading}
              style={{ width: '100%', padding: '17px', borderRadius: '16px', background: 'linear-gradient(135deg, #D97706, #B45309)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: payLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 28px rgba(217,119,6,0.35)', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { if (!payLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(217,119,6,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(217,119,6,0.35)'; }}
            >
              {payLoading
                ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} />
                : <><Heart size={17} fill="rgba(255,255,255,0.35)" /> Donate {fmt(due)} Securely</>}
            </button>
            <button
              onClick={onClose}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Purification Card (compact, clickable) ────────────────── */
function PurificationCard({ h, onPurify }) {
  const ratio      = Number(h.non_compliant_ratio || 0);
  const dividends  = Number(h.total_dividends || 0);
  const due        = Number(h.purification_due || 0);
  const totalValue = Number(h.total_value || 0);
  const shares     = Number(h.shares || 0);
  const duePct     = dividends > 0 ? Math.min(100, (due / dividends) * 100) : 0;

  const latestDiv = h.latest_dividend;
  let dividendLabel = null;
  let dividendVal = null;
  let dividendDate = null;
  if (latestDiv) {
    const isUpcoming = latestDiv.status !== 'paid' && new Date(latestDiv.pay_date) > new Date();
    dividendLabel = isUpcoming ? 'Upcoming' : 'Last Dividend';
    dividendVal = `${fmt(latestDiv.amount)} /sh`;
    if (latestDiv.pay_date) {
      dividendDate = new Date(latestDiv.pay_date).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
    }
  }

  return (
    <div
      onClick={() => onPurify(h)}
      style={{ borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(217,119,6,0.4)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(217,119,6,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top amber accent bar */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #D97706, #F59E0B, rgba(245,158,11,0.3))' }} />

      <div style={{ padding: '20px 22px' }}>
        {/* Top row: logo + name + badge + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <CompanyLogo symbol={h.symbol} logoUrl={h.logo_url} size={44} radius={12} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>{h.symbol}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {shares.toLocaleString()} shares · {fmt(h.average_buy_price)} avg cost
            </div>
          </div>

          {/* Status pill */}
          <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '99px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706', boxShadow: '0 0 6px rgba(217,119,6,0.7)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Purify</span>
          </div>

          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '16px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
          {[
            { label: 'Dividends (12M)', value: fmt(dividends), sub: 'Total received' },
            latestDiv ? { label: dividendLabel, value: dividendVal, sub: dividendDate } : null,
            { label: 'Impure Ratio', value: `${ratio.toFixed(2)}%`, sub: '≤ 5% threshold', warn: ratio > 5 },
            { label: 'Portfolio Value', value: fmt(totalValue), sub: 'Current' },
          ].filter(Boolean).map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-section)', borderRadius: '12px', padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: s.warn ? '#D97706' : 'var(--text-dark)' }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Bottom row: progress bar + amount to purify */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Progress */}
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>Impure portion</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#D97706' }}>{duePct.toFixed(2)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--bg-section)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: '100%', width: `${Math.max(1, duePct)}%`, background: 'linear-gradient(90deg, #F59E0B, #D97706)', borderRadius: '99px', boxShadow: '0 0 8px rgba(217,119,6,0.5)', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>

          {/* Amount to purify + hint */}
          <div style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '12px', padding: '10px 16px', flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '1px' }}>Amount to Purify</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.5px' }}>{fmt(due)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, borderLeft: '1px solid rgba(217,119,6,0.15)', paddingLeft: '12px' }}>
              <Calculator size={12} />
              View calc
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Tab ──────────────────────────────────────────────── */
export default function PurificationTab({ data }) {
  const [purifiedSymbols, setPurifiedSymbols] = useState([]);
  const [selectedHolding, setSelectedHolding] = useState(null);

  const holdings = data?.holdings || [];
  const needsPurification = holdings.filter(h => h.purification_due > 0 && !purifiedSymbols.includes(h.symbol));
  const purificationDue = needsPurification.reduce((acc, h) => acc + Number(h.purification_due), 0);
  const totalDivs = needsPurification.reduce((acc, h) => acc + Number(h.total_dividends || 0), 0);

  const handleSuccess = (symbol) => {
    setPurifiedSymbols(prev => [...prev, symbol]);
    setSelectedHolding(null);
  };

  return (
    <div className="animate-fade-in stagger-1 purification-tab-outer">
      {selectedHolding && (
        <CalcModal
          h={selectedHolding}
          onClose={() => setSelectedHolding(null)}
          onPurify={(h) => { handleSuccess(h.symbol); }}
        />
      )}

      {/* ─ Header Banner ─ */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius: '24px', padding: '32px', boxShadow: '0 16px 40px rgba(13,27,42,0.18)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: 'rgba(201,168,76,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '140px', height: '140px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '58px', height: '58px', background: 'rgba(255,255,255,0.08)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
              {purificationDue > 0 ? <ShieldAlert size={28} color="#F59E0B" /> : <CheckCircle size={28} color="#34D399" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: '4px' }}>Dividend Purification</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.79rem' }}>Cleanse your portfolio of non-compliant income</p>
            </div>
          </div>

          {purificationDue > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Due</div>
                <div style={{ fontSize: '1.18rem', fontWeight: 900, color: '#F59E0B' }}>₦{purificationDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Dividends (12M)</div>
                <div style={{ fontSize: '1.18rem', fontWeight: 900, color: 'white' }}>₦{totalDivs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─ List ─ */}
      <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '28px 28px 32px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <h3 style={{ fontSize: '0.97rem', fontWeight: 800, color: 'var(--text-dark)' }}>Pending Purifications</h3>
          {needsPurification.length > 0 && (
            <span style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px' }}>
              {needsPurification.length} stock{needsPurification.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {needsPurification.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', borderRadius: '20px', border: '1px dashed #bbf7d0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid #86efac', boxShadow: '0 12px 32px rgba(34,197,94,0.15)' }}>
              <CheckCircle size={36} color="#16A34A" fill="rgba(34,197,94,0.2)" />
            </div>
            <div style={{ fontSize: '1.23rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '12px', letterSpacing: '-0.5px' }}>Your Portfolio is Clean!</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px', lineHeight: 1.6 }}>
              Alhamdulillah. All your dividend income is derived from Shariah-compliant sources. There are no pending purifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {needsPurification.map(h => (
              <PurificationCard key={h.id} h={h} onPurify={setSelectedHolding} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
