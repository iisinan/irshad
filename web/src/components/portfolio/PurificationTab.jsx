import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ArrowRight, Heart, CheckCircle, Sparkles, X, ChevronRight, Calculator, Loader2 } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';

const fmt = (n, d = 2) => `₦${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

const CHARITIES = [
  {
    id: 1,
    name: "Voice of Bazawara",
    bank: "Gt Bank: 0869251235",
    contact: "Whatsapp- 08145201878",
    ig: "https://www.instagram.com/voice_of_bazawara/?utm_source=ig_web_button_share_sheet"
  },
  {
    id: 2,
    name: "Sadqa Drive Foundation",
    bank: "Zenith bank: 1221960210",
    ig: "https://www.instagram.com/sadaqahdrivefoundation_?igsh=MTcycnU1MmJvMGpwOQ=="
  },
  {
    id: 3,
    name: "Domin Marayu Charity Org",
    bank: "Zenith Bank: 1213408773",
    contact: "Whatsapp-08032896206",
    ig: "https://www.instagram.com/dominmarayucharityfoundation?utm_source=ig_web_button_share_sheet&igsh=ZDNiZDc0MzlxNw=="
  },
  {
    id: 4,
    name: "Protect the Needy Foundation",
    bank: "Premium Trust Bank: 0040249382",
    contact: "Whatsapp- 08030754510, 08034530100"
  },
  {
    id: 5,
    name: "Al-Maheer Int'l qur'anic Science Academy",
    bank: "Taj Bank: 0009931326",
    contact: "Whatsapp- 09121526431"
  },
  {
    id: 6,
    name: "Ummahatul Yateem Foundation",
    bank: "Providus/Unity: 0023098745",
    contact: "Whatsapp- 07057323225"
  },
  {
    id: 7,
    name: "JADAFIA (Jamaatud Da'awah -Fou'ad Labadidi)",
    bank: "Jaiz: 1000239373",
    contact: "Whatsapp- 08033334393"
  },
  {
    id: 8,
    name: "Sunnah TV Programmes Sponsorship (Sunnah Global Media Ltd)",
    bank: "Stanbic IBTC: 0006740998"
  },
  {
    id: 9,
    name: "Al-Ansar Educational Welfare and First Aid",
    bank: "Jaiz Bank: 0001046218"
  }
];

function CharitiesModal({ onClose, onConfirm, amountDue, isSubmitting }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConfirm();
    }, 1200);
  };

  return createPortal(
    <div className="animate-fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.25)', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>Verifiable Charities</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Donate your purification amount of {fmt(amountDue)} directly.</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-section)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Warning Banner */}
        <div style={{ padding: '16px 28px', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start', flexShrink: 0 }}>
          <ShieldAlert size={18} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#B45309', lineHeight: 1.5, fontWeight: 500 }}>
            <strong style={{ fontWeight: 800 }}>Note:</strong> We are not affiliated with any of these charities and organisations. Please do your own verification.
          </p>
        </div>

        {/* List */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {CHARITIES.map((c) => (
              <div key={c.id} style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '28px', height: '28px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {c.id}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>{c.name}</h4>
                </div>
                
                <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>Bank:</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>{c.bank}</span>
                  </div>
                  {c.contact && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>Contact:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>{c.contact}</span>
                    </div>
                  )}
                  {c.ig && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>Instagram:</span>
                      <a href={c.ig} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>View Profile ↗</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '0 0 28px 28px' }}>
          <button 
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            {isSubmitting ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
            {isSubmitting ? 'Recording...' : 'Mark as Purified'}
          </button>
        </div>
        
      </div>
    </div>,
    document.body
  );
}

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
    onPurify(h);
    onClose();
  };

  const Section = ({ title, rows, accent }) => (
    <div style={{ marginBottom: '16px', borderRadius: '16px', border: `1px solid ${accent || 'var(--border)'}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: accent ? `${accent}12` : 'var(--bg-section)', borderBottom: `1px solid ${accent || 'var(--border)'}` }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: accent || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{title}</div>
      </div>
      <div style={{ background: 'var(--bg)' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: row.highlight ? 'var(--primary-50)' : 'transparent' }}>
            <span style={{ fontSize: '0.78rem', color: row.highlight ? 'var(--text-dark)' : 'var(--text-muted)', fontWeight: row.highlight ? 700 : 500, flex: 1, minWidth: '120px' }}>{row.label}</span>
            <span style={{ fontSize: row.highlight ? '0.92rem' : '0.82rem', fontWeight: row.highlight ? 900 : 700, color: row.highlight ? 'var(--primary)' : 'var(--text-dark)' }}>{row.value}</span>
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
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 10 }}>
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
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(due)}</div>
            </div>
          </div>

          {/* Impure progress bar */}
          <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Impure portion of dividends</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--gold)' }}>{duePct.toFixed(2)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(1, duePct)}%`, background: 'var(--gold)', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 12px rgba(255,215,0,0.6)' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <Section
            title="Purification Calculation"
            accent="var(--primary)"
            rows={[
              { label: 'Total dividends received (12M)', value: fmt(dividends) },
              { label: 'Impure revenue ratio', value: `${ratio.toFixed(4)}%` },
              { label: 'Amount to purify (donate)', value: fmt(due), highlight: true },
            ]}
          />

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handlePurify}
              style={{ width: '100%', padding: '17px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 28px rgba(91,41,113,0.35)', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(91,41,113,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(91,41,113,0.35)'; }}
            >
              <Heart size={17} fill="rgba(255,255,255,0.35)" /> Donate {fmt(due)} Securely
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

/* ─── Stat Detail Calculation Modal ──────────────────────────── */
function StatDetailModal({ holding: h, statKey, onClose, onOpenPurification }) {
  if (!h || !statKey) return null;

  const ratio        = Number(h.non_compliant_ratio || 0);
  const dividends    = Number(h.total_dividends || 0);
  const due          = Number(h.purification_due || 0);
  const totalValue   = Number(h.total_value || 0);
  const shares       = Number(h.shares || 0);
  const avgPrice     = Number(h.average_buy_price || 0);
  const currentPrice = Number(h.current_price || 0);

  const latestDiv = h.latest_dividend;
  let divPerShare = 0;
  let dividendLabel = 'Last Paid Dividend';
  let dividendDate = 'N/A';
  if (latestDiv) {
    const isUpcoming = latestDiv.status !== 'paid' && new Date(latestDiv.pay_date) > new Date();
    dividendLabel = isUpcoming ? 'Upcoming Dividend' : 'Last Paid Dividend';
    divPerShare = Number(latestDiv.amount);
    if (latestDiv.pay_date) {
      dividendDate = new Date(latestDiv.pay_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  let config = {};
  if (statKey === 'dividends') {
    const divPerShare = dividends / (shares || 1);
    config = {
      title: 'Dividends Received (12M)',
      formulaText: 'Shares Held × Trailing 12M Dividend Per Share',
      formulaCalc: `${shares.toLocaleString()} shares × ${fmt(divPerShare)} = ${fmt(dividends)}`,
      accent: 'var(--primary)',
      rows: [
        { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
        { label: 'Dividend per share (trailing 12M)', value: fmt(divPerShare) },
        { label: 'Total dividends received (12M)', value: fmt(dividends), highlight: true },
      ]
    };
  } else if (statKey === 'last_dividend') {
    config = {
      title: `${dividendLabel} Calculation`,
      formulaText: 'Declared Dividend Per Share × Shares Held',
      formulaCalc: `${fmt(divPerShare)} per share × ${shares.toLocaleString()} shares = ${fmt(divPerShare * shares)}`,
      accent: '#2563EB',
      rows: [
        { label: 'Pay date', value: dividendDate },
        { label: 'Dividend per share declared', value: fmt(divPerShare) },
        { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
        { label: 'Total dividend payout entitlement', value: fmt(divPerShare * shares), highlight: true },
      ]
    };
  } else if (statKey === 'impure_ratio') {
    config = {
      title: 'AAOIFI Impure Income Ratio',
      formulaText: 'Non-Compliant Revenue ÷ Total Revenue × 100',
      formulaCalc: `Impure Income Ratio = ${ratio.toFixed(4)}%`,
      accent: '#7C3AED',
      rows: [
        { label: "Company's non-compliant income (interest, etc.)", value: `${ratio.toFixed(4)}%` },
        { label: 'AAOIFI permissible threshold', value: '≤ 5.00%' },
        { label: 'Shariah compliance status', value: ratio <= 5 ? '✅ Passes' : '❌ Fails' },
        { label: 'Impure ratio applied to dividends', value: `${ratio.toFixed(4)}%`, highlight: true },
      ]
    };
  } else if (statKey === 'portfolio_value') {
    config = {
      title: 'Portfolio Value Calculation',
      formulaText: 'Shares Held × Current Market Price',
      formulaCalc: `${shares.toLocaleString()} shares × ${fmt(currentPrice)} = ${fmt(totalValue)}`,
      accent: '#059669',
      rows: [
        { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
        { label: 'Current market price per share', value: fmt(currentPrice) },
        { label: 'Average buy price per share', value: fmt(avgPrice) },
        { label: 'Unrealised P&L', value: `${currentPrice >= avgPrice ? '+' : ''}${fmt(totalValue - shares * avgPrice)}` },
        { label: 'Total portfolio market value', value: fmt(totalValue), highlight: true },
      ]
    };
  }

  return createPortal(
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', border: '1px solid var(--border)', animation: 'slideUpFade 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CompanyLogo symbol={h.symbol} logoUrl={h.logo_url} size={40} radius={10} />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h.symbol} Calculation</div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>{config.title}</h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Formula & Rows */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px', borderRadius: '16px', border: `1px solid ${config.accent}30`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: `${config.accent}12`, borderBottom: `1px solid ${config.accent}30` }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: config.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Formula & Calculation</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{config.formulaText}</div>
            </div>
            <div style={{ background: 'var(--bg)' }}>
              {config.rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: row.highlight ? 'var(--primary-50)' : 'transparent' }}>
                  <span style={{ fontSize: '0.8rem', color: row.highlight ? 'var(--text-dark)' : 'var(--text-muted)', fontWeight: row.highlight ? 800 : 500 }}>{row.label}</span>
                  <span style={{ fontSize: row.highlight ? '0.96rem' : '0.84rem', fontWeight: row.highlight ? 900 : 700, color: row.highlight ? 'var(--primary)' : 'var(--text-dark)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { onClose(); onOpenPurification(h); }}
              style={{ flex: 1, padding: '13px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(91,41,113,0.3)' }}
            >
              <Calculator size={15} /> View Purification Breakdown
            </button>
            <button
              onClick={onClose}
              style={{ padding: '13px 20px', borderRadius: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
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
function PurificationCard({ h, onPurify, onStatClick }) {
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

  const statItems = [
    { key: 'portfolio_value', label: 'Portfolio Value', value: fmt(totalValue), sub: 'Current' },
    { key: 'dividends', label: 'Dividends', value: fmt(dividends), sub: 'Total received' },
    latestDiv ? { key: 'last_dividend', label: dividendLabel, value: dividendVal, sub: dividendDate } : null,
  ].filter(Boolean);

  return (
    <div
      onClick={() => onPurify(h)}
      className="hover-lift"
      style={{ borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}
    >
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--primary), var(--primary-hover), var(--primary-100))' }} />
      <div style={{ padding: '16px 20px' }}>
        {/* Top row: logo + name + amount to purify + action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          
          {/* Left: Logo & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CompanyLogo symbol={h.symbol} logoUrl={h.logo_url} size={36} radius={10} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>{h.symbol}</div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                {shares.toLocaleString()} shs · {fmt(h.average_buy_price)} avg
              </div>
            </div>
          </div>

          {/* Right: Amount & Purify Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '2px' }}>Amount to Purify</div>
               <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>{fmt(due)}</div>
            </div>

            <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.70rem', fontWeight: 800, boxShadow: '0 4px 12px var(--primary-50)' }}>
              Purify <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Stats row - super compact horizontal scroll */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
          {statItems.map((s, i) => (
             <div
              key={i}
              onClick={(e) => { e.stopPropagation(); onStatClick(h, s.key); }}
              style={{
                flexShrink: 0,
                background: 'var(--bg-section)',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: '2px',
                minWidth: '120px'
              }}
              className="hover-lift"
             >
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                  {s.label} <span style={{ opacity: 0.5, color: 'var(--primary)' }}>↗</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>{s.value}</div>
             </div>
          ))}
          
          <div
             onClick={(e) => { e.stopPropagation(); onPurify(h); }}
             style={{
               flexShrink: 0,
               background: 'var(--primary-50)',
               borderRadius: '10px',
               padding: '8px 12px',
               border: '1px dashed var(--primary-100)',
               cursor: 'pointer',
               display: 'flex', flexDirection: 'column', gap: '4px',
               alignItems: 'center', justifyContent: 'center'
             }}
             className="hover-lift"
          >
            <Calculator size={14} color="var(--primary)" />
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>View Calc</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurificationTab({ data, initialSymbol, refreshData, onClearInitialSymbol }) {
  const [purifiedSymbols, setPurifiedSymbols] = useState([]);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [activeStatTarget, setActiveStatTarget] = useState(null);
  const [charityModalTarget, setCharityModalTarget] = useState(null);

  useEffect(() => {
    if (initialSymbol && data?.holdings) {
      const target = data.holdings.find(h => h.symbol === initialSymbol);
      if (target) setSelectedHolding(target);
    }
  }, [initialSymbol, data?.holdings]);

  const holdings = data?.holdings || [];
  const needsPurification = holdings.filter(h => h.purification_due > 0 && !purifiedSymbols.includes(h.symbol));
  const purificationDue = needsPurification.reduce((acc, h) => acc + Number(h.purification_due), 0);
  const totalDivs = needsPurification.reduce((acc, h) => acc + Number(h.total_dividends || 0), 0);

  const handleSuccess = (symbol) => {
    setPurifiedSymbols(prev => [...prev, symbol]);
    setSelectedHolding(null);
  };

  const handleDonateAll = () => {
    setCharityModalTarget({ type: 'all', amount: purificationDue });
  };

  const handleCloseCalcModal = () => {
    setSelectedHolding(null);
    if (onClearInitialSymbol) onClearInitialSymbol();
  };

  const [isPurifying, setIsPurifying] = useState(false);

  const handleConfirmPurify = async () => {
    setIsPurifying(true);
    try {
      if (charityModalTarget?.type === 'all') {
        await api.post('/portfolio/purify', { all: true });
        setPurifiedSymbols(prev => [...prev, ...needsPurification.map(h => h.symbol)]);
      } else if (charityModalTarget?.type === 'single') {
        await api.post('/portfolio/purify', { symbol: charityModalTarget.symbol });
        setPurifiedSymbols(prev => [...prev, charityModalTarget.symbol]);
      }
      toastSuccess('Purification recorded successfully');
      setCharityModalTarget(null);
      if (refreshData) {
        refreshData();
      }
    } catch (err) {
      console.error('Error purifying:', err);
      toastError('Failed to record purification. Please try again.');
    } finally {
      setIsPurifying(false);
    }
  };

  return (
    <div className="animate-fade-in stagger-1 purification-tab-outer">
      {charityModalTarget && (
        <CharitiesModal 
          amountDue={charityModalTarget.amount} 
          onClose={() => setCharityModalTarget(null)} 
          onConfirm={handleConfirmPurify} 
          isSubmitting={isPurifying}
        />
      )}

      {selectedHolding && (
        <CalcModal
          h={selectedHolding}
          onClose={handleCloseCalcModal}
          onPurify={(h) => { setCharityModalTarget({ type: 'single', symbol: h.symbol, amount: h.purification_due }); }}
        />
      )}

      {activeStatTarget && (
        <StatDetailModal
          holding={activeStatTarget.holding}
          statKey={activeStatTarget.statKey}
          onClose={() => setActiveStatTarget(null)}
          onOpenPurification={(h) => setSelectedHolding(h)}
        />
      )}

      {/* ─ Header Banner ─ */}
      <div style={{ 
        background: 'linear-gradient(to right, var(--bg) 40%, var(--primary-50) 100%)', 
        borderRadius: '24px', 
        border: '1px solid var(--border)', 
        padding: '28px 32px', 
        marginBottom: '24px', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%) rotate(-5deg)', opacity: 0.08, pointerEvents: 'none' }}>
           <ShieldAlert size={180} strokeWidth={1} color="var(--primary)" />
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(138, 76, 158, 0.12)' }}>
              {purificationDue > 0 ? <ShieldAlert size={26} strokeWidth={2.5} color="var(--primary)" /> : <CheckCircle size={26} strokeWidth={2.5} color="#34D399" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', marginBottom: '4px', margin: 0 }}>Dividend Purification</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>Cleanse your portfolio of non-compliant income</p>
            </div>
          </div>

          {purificationDue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ background: 'var(--body-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Total Due</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)' }}>₦{purificationDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: 'var(--body-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Dividends</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)' }}>₦{totalDivs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
              
              <button
                onClick={handleDonateAll}
                style={{ padding: '14px 20px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', height: '100%' }}
                className="hover-lift"
              >
                <Heart size={16} fill="currentColor" /> Donate All
              </button>
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
              <PurificationCard
                key={h.id}
                h={h}
                onPurify={setSelectedHolding}
                onStatClick={(holding, statKey) => setActiveStatTarget({ holding, statKey })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
