import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ArrowRight, Heart, CheckCircle, Sparkles, TrendingDown, X, FlaskConical } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';

/* ─── Formula Popup Modal ───────────────────────────────────── */
function FormulaModal({ info, onClose }) {
  if (!info) return null;
  return createPortal(
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200000, padding:'20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'var(--bg)', borderRadius:'24px', width:'100%', maxWidth:'440px', boxShadow:'0 32px 80px rgba(0,0,0,0.2)', overflow:'hidden', animation:'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)', position:'relative' }}
      >
        {/* Top accent */}
        <div style={{ height:'4px', background:'linear-gradient(90deg, var(--primary), var(--primary-light, #5EEAD4))' }} />

        <div style={{ padding:'32px' }}>
          {/* Close */}
          <button onClick={onClose} style={{ position:'absolute', top:'14px', right:'14px', background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
            <X size={15} />
          </button>

          {/* Title */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(var(--primary-rgb, 15,82,87),0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FlaskConical size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>How it's calculated</div>
              <div style={{ fontSize:'1.05rem', fontWeight:800, color:'var(--text-dark)', letterSpacing:'-0.3px' }}>{info.label}</div>
            </div>
          </div>

          {/* Formula box */}
          <div style={{ background:'var(--bg-section)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px 20px', margin:'20px 0', fontFamily:'monospace' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Formula</div>
            <div style={{ fontSize:'0.95rem', fontWeight:600, color:'var(--primary)', lineHeight:1.6 }}>{info.formula}</div>
          </div>

          {/* Steps */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
            {info.steps.map((step, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 14px', borderRadius:'10px', background: i === info.steps.length - 1 ? 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(245,158,11,0.04))' : 'transparent', border: i === info.steps.length - 1 ? '1px solid rgba(217,119,6,0.18)' : 'none' }}>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:500, flex:1 }}>{step.label}</span>
                <span style={{ fontSize:'0.85rem', fontWeight:800, color: i === info.steps.length - 1 ? '#D97706' : 'var(--text-dark)', marginLeft:'16px', whiteSpace:'nowrap' }}>{step.value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.65, background:'var(--bg-section)', padding:'12px 16px', borderRadius:'10px', border:'1px solid var(--border)', margin:0 }}>
            {info.description}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Purify Modal ─────────────────────────────────────────── */
function PurifyModal({ holding, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess(holding.symbol);
    }, 1500);
  };

  const ratio = Number(holding.non_compliant_ratio || 0).toFixed(2);
  const dividends = Number(holding.total_dividends || 0);

  return createPortal(
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'20px' }}>
      <div style={{ background: 'var(--bg)', borderRadius:'28px', width:'100%', maxWidth:'440px', boxShadow:'0 32px 80px rgba(0,0,0,0.18)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>

        {/* Modal top accent */}
        <div style={{ height:'5px', background:'linear-gradient(90deg, #D97706, #F59E0B, #FDE68A)' }} />

        <div style={{ padding:'36px' }}>
          {/* Close button */}
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--bg-section)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
            <X size={16} />
          </button>

          {/* Logo & Symbol */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <CompanyLogo symbol={holding.symbol} logoUrl={holding.logo_url} size={64} radius={18} />
          </div>

          <h3 style={{ fontSize:'1.35rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'8px', textAlign:'center', letterSpacing:'-0.5px' }}>
            Purify {holding.symbol}
          </h3>
          <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', lineHeight:1.65, marginBottom:'28px', textAlign:'center' }}>
            Donate <strong style={{ color:'var(--text-dark)' }}>₦{Number(holding.purification_due).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</strong> to charity to cleanse your dividend income from non-compliant sources.
          </p>

          {/* Breakdown */}
          <div style={{ background:'linear-gradient(135deg, rgba(217,119,6,0.04), rgba(245,158,11,0.02))', border:'1px solid rgba(217,119,6,0.15)', borderRadius:'16px', padding:'18px 20px', marginBottom:'24px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Dividends received (12M)</span>
              <span style={{ fontSize:'0.82rem', fontWeight:800, color:'var(--text-dark)' }}>₦{dividends.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Impure income ratio</span>
              <span style={{ fontSize:'0.82rem', fontWeight:800, color:'#D97706' }}>{ratio}%</span>
            </div>
            <div style={{ height:'1px', background:'rgba(217,119,6,0.12)' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.78rem', color:'var(--text-dark)', fontWeight:700 }}>Amount to purify</span>
              <span style={{ fontSize:'0.96rem', fontWeight:900, color:'#D97706' }}>₦{Number(holding.purification_due).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <button
              onClick={handlePay}
              disabled={loading}
              style={{ width:'100%', padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #D97706, #F59E0B)', border:'none', color:'white', fontWeight:800, fontSize:'0.9rem', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(217,119,6,0.3)', transition:'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {loading ? <div className="spinner" style={{ width:'18px', height:'18px', borderTopColor:'white'}}/> : <><Heart size={16} fill="rgba(255,255,255,0.4)" /> Donate Securely</>}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              style={{ width:'100%', padding:'14px', borderRadius:'14px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-muted)', fontWeight:600, fontSize:'0.84rem', cursor: loading ? 'not-allowed' : 'pointer', transition:'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-section)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Purification Card ─────────────────────────────────────── */
function PurificationCard({ h, onPurify }) {
  const ratio = Number(h.non_compliant_ratio || 0);
  const dividends = Number(h.total_dividends || 0);
  const due = Number(h.purification_due || 0);
  const totalValue = Number(h.total_value || 0);
  const shares = Number(h.shares || 0);
  const avgPrice = Number(h.average_buy_price || 0);
  const currentPrice = Number(h.current_price || 0);
  const duePct = dividends > 0 ? Math.min(100, (due / dividends) * 100) : 0;
  const [formulaInfo, setFormulaInfo] = useState(null);

  const latestDiv = h.latest_dividend;
  let dividendText = 'Recent Dividend';
  let dividendVal = '₦0.00 /sh';
  let dividendDate = null;
  let divPerShare = 0;
  
  if (latestDiv) {
    const isUpcoming = latestDiv.status !== 'paid' && new Date(latestDiv.pay_date) > new Date();
    dividendText = isUpcoming ? 'Upcoming Dividend' : 'Last Paid Dividend';
    divPerShare = Number(latestDiv.amount);
    dividendVal = `₦${divPerShare.toFixed(2)} /sh`;
    if (latestDiv.pay_date) {
        dividendDate = new Date(latestDiv.pay_date).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
    }
  }

  // Formula definitions for each stat
  const fmt = (n, d=2) => `₦${Number(n).toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d})}`;
  const formulaMap = {
    'Dividends (12M)': {
      label: 'Dividends (12M)',
      formula: 'Shares Held × Dividend Per Share (trailing 12M)',
      steps: [
        { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
        { label: 'Dividend per share (12M)', value: fmt(dividends / (shares || 1)) },
        { label: 'Total dividends received', value: fmt(dividends) },
      ],
      description: 'Total cash dividends received over the trailing 12 months, calculated by multiplying your shares held by the cumulative dividend per share declared in that period.',
    },
    [dividendText]: latestDiv ? {
      label: dividendText,
      formula: 'Declared dividend per share × Shares held',
      steps: [
        { label: 'Dividend per share (declared)', value: `₦${divPerShare.toFixed(2)}` },
        { label: 'Your shares', value: `${shares.toLocaleString()} shares` },
        { label: 'Your total entitlement', value: fmt(divPerShare * shares) },
      ],
      description: dividendText === 'Upcoming Dividend'
        ? 'This is the upcoming declared dividend per share. Your entitlement is calculated based on your current holding. Purification applies if the impure ratio is above 0%.'
        : 'The most recent dividend per share paid by this company. Your entitlement was calculated based on shares held at the record date.',
    } : null,
    'Impure Ratio': {
      label: 'Impure Income Ratio',
      formula: 'Non-Compliant Revenue ÷ Total Revenue × 100',
      steps: [
        { label: 'Non-compliant revenue (interest income, etc.)', value: `${ratio.toFixed(4)}% of revenue` },
        { label: 'AAOIFI tolerance threshold', value: '5.00%' },
        { label: `Status (${ratio <= 5 ? '✅ Within' : '❌ Exceeds'} threshold)`, value: `${ratio.toFixed(2)}%` },
      ],
      description: "The AAOIFI-standard ratio of a company's non-permissible income (e.g., interest, haram services) to its total revenue. A stock is considered Halal if this stays at or below 5%, but any non-zero ratio requires purification of your dividend income.",
    },
    'Portfolio Value': {
      label: 'Portfolio Value',
      formula: 'Shares Held × Current Market Price',
      steps: [
        { label: 'Shares held', value: `${shares.toLocaleString()} shares` },
        { label: 'Current market price', value: fmt(currentPrice) },
        { label: 'Total current value', value: fmt(totalValue) },
        { label: 'Avg. buy price', value: fmt(avgPrice) },
        { label: 'Unrealised P&L', value: `${currentPrice >= avgPrice ? '+' : ''}${fmt(totalValue - shares * avgPrice)}` },
      ],
      description: 'The current market value of your entire position in this stock, calculated using the latest available market price. This is a real-time estimate and fluctuates with the market.',
    },
  };

  return (
    <div
      style={{
        borderRadius: '24px',
        border: '1px solid rgba(217,119,6,0.15)',
        background: 'linear-gradient(180deg, var(--bg) 0%, rgba(217,119,6,0.02) 100%)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
        position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(217,119,6,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.03)'; }}
    >
      {/* Subtle glow effect behind logo */}
      <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ padding:'28px' }}>
        {/* Row 1 — identity + badge */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ padding: '4px', background: 'var(--bg)', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid var(--border)' }}>
                <CompanyLogo symbol={h.symbol} logoUrl={h.logo_url} size={48} radius={14} />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.15rem', color:'var(--text-dark)', letterSpacing:'-0.3px', marginBottom: '2px' }}>{h.symbol}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight: 500 }}>
                {shares.toLocaleString()} shares · ₦{Number(h.average_buy_price || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} avg cost
              </div>
            </div>
          </div>

          <div style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:'99px', padding:'6px 14px', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706', boxShadow: '0 0 8px rgba(217,119,6,0.6)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purification Required</span>
          </div>
        </div>

        {/* Row 2 — stat grid */}
        <div style={{ display:'grid', gridTemplateColumns: latestDiv ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap:'12px', marginBottom:'24px' }}>
          {[
            { label:'Dividends (12M)', value:`₦${dividends.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`, sub: 'Total received', show: true },
            { label: dividendText, value: dividendVal, sub: dividendDate || 'N/A', show: !!latestDiv },
            { label:'Impure Ratio', value:`${ratio.toFixed(2)}%`, sub: '≤ 5% threshold', warn: ratio > 5, show: true },
            { label:'Portfolio Value', value:`₦${totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, sub: 'Current', show: true },
          ].filter(s => s.show).map((stat, i) => (
            <div
              key={i}
              onClick={() => formulaMap[stat.label] && setFormulaInfo(formulaMap[stat.label])}
              style={{ background:'var(--bg)', borderRadius:'16px', padding:'14px 16px', border:'1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: formulaMap[stat.label] ? 'pointer' : 'default', transition:'all 0.2s', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { if (formulaMap[stat.label]) { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(15,82,87,0.1)'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              {/* Small formula hint icon */}
              {formulaMap[stat.label] && (
                <div style={{ position:'absolute', top:'8px', right:'8px', width:'16px', height:'16px', borderRadius:'50%', background:'var(--bg-section)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, color:'var(--text-muted)', border:'1px solid var(--border)' }}>f</div>
              )}
              <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px' }}>{stat.label}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:900, color: stat.warn ? '#D97706' : 'var(--text-dark)' }}>{stat.value}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'4px', fontWeight: 500 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Row 3 — progress bar */}
        <div style={{ marginBottom:'24px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <span style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--text-dark)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Impure portion of dividends</span>
            <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{duePct.toFixed(2)}%</span>
          </div>
          <div style={{ height:'8px', background:'var(--bg-section)', borderRadius:'99px', overflow:'hidden', border:'1px solid var(--border)' }}>
            <div style={{
              height:'100%',
              width:`${Math.max(1, duePct)}%`, // At least 1% so it's visible
              background:'linear-gradient(90deg, #F59E0B, #D97706)',
              borderRadius:'99px',
              transition:'width 1s cubic-bezier(0.16,1,0.3,1)',
              boxShadow:'0 0 10px rgba(217,119,6,0.5)'
            }} />
          </div>
        </div>

        {/* Row 4 — amount + CTA */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(245,158,11,0.04))', borderRadius:'18px', padding:'18px 24px', border:'1px solid rgba(217,119,6,0.2)' }}>
          <div>
            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Amount to Purify</div>
            <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#D97706', letterSpacing:'-0.5px', textShadow: '0 2px 10px rgba(217,119,6,0.15)' }}>₦{due.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </div>
          <button
            onClick={() => onPurify(h)}
            style={{ display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg, #D97706, #B45309)', color:'white', border:'none', padding:'14px 24px', borderRadius:'14px', fontSize:'0.9rem', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 20px rgba(217,119,6,0.3)', transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03) translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 24px rgba(217,119,6,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1) translateY(0)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(217,119,6,0.3)'; }}
          >
            <Sparkles size={16} />
            Purify Now
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* Formula popup */}
      <FormulaModal info={formulaInfo} onClose={() => setFormulaInfo(null)} />
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
        <PurifyModal
          holding={selectedHolding}
          onClose={() => setSelectedHolding(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* ─ Header Banner ─ */}
      <div style={{ background:'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'32px', boxShadow:'0 16px 40px rgba(13,27,42,0.18)', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'220px', height:'220px', background:'rgba(201,168,76,0.07)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'30%', width:'140px', height:'140px', background:'rgba(255,255,255,0.03)', borderRadius:'50%', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
            <div style={{ width:'58px', height:'58px', background:'rgba(255,255,255,0.08)', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(4px)' }}>
              {purificationDue > 0 ? <ShieldAlert size={28} color="#F59E0B" /> : <CheckCircle size={28} color="#34D399" />}
            </div>
            <div>
              <h2 style={{ fontSize:'1.28rem', fontWeight:800, color:'white', letterSpacing:'-0.5px', marginBottom:'4px' }}>Dividend Purification</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.79rem' }}>Cleanse your portfolio of non-compliant income</p>
            </div>
          </div>

          {purificationDue > 0 && (
            <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
              <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', padding:'12px 20px', backdropFilter:'blur(4px)' }}>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Total Due</div>
                <div style={{ fontSize:'1.18rem', fontWeight:900, color:'#F59E0B' }}>₦{purificationDue.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', padding:'12px 20px', backdropFilter:'blur(4px)' }}>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Dividends (12M)</div>
                <div style={{ fontSize:'1.18rem', fontWeight:900, color:'white' }}>₦{totalDivs.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─ List ─ */}
      <div style={{ background:'var(--bg)', borderRadius:'24px', padding:'28px 28px 32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
          <h3 style={{ fontSize:'0.97rem', fontWeight:800, color:'var(--text-dark)' }}>
            Pending Purifications
          </h3>
          {needsPurification.length > 0 && (
            <span style={{ background:'rgba(217,119,6,0.1)', color:'#D97706', border:'1px solid rgba(217,119,6,0.2)', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700, padding:'4px 12px' }}>
              {needsPurification.length} stock{needsPurification.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {needsPurification.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 40px', background:'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', borderRadius:'20px', border:'1px dashed #bbf7d0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'80px', height:'80px', background:'#dcfce7', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', border:'1px solid #86efac', boxShadow:'0 12px 32px rgba(34,197,94,0.15)' }}>
              <CheckCircle size={36} color="#16A34A" fill="rgba(34,197,94,0.2)" />
            </div>
            <div style={{ fontSize:'1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              Your Portfolio is Clean!
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', maxWidth:'400px', lineHeight:1.6 }}>
              Alhamdulillah. All your dividend income is derived from Shariah-compliant sources. There are no pending purifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {needsPurification.map(h => (
              <PurificationCard key={h.id} h={h} onPurify={setSelectedHolding} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
