import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Layers, ShieldAlert, AlertTriangle, Sparkles, Target,
  Plus, X, Trash2, ArrowUpRight, ArrowDownRight,
  RefreshCw, Edit2, ShieldCheck, Droplet, HelpCircle
} from 'lucide-react';

import { updateHolding } from '../../services/api';
import CompanyLogo from '../CompanyLogo';
import { toastError, toastSuccess } from '../../utils/toast';

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

/* ─── Animated Counter ─────────────────────────────────────── */
function AnimCounter({ target }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const dur = 1400;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{fmtK(val)}</>;
}


/* ─── Edit Modal ────────────────────────────────────────────── */
function EditHoldingModal({ holding, onClose, onSuccess }) {
  const [sh, setSh] = useState(holding.shares || '');
  const [pr, setPr] = useState(holding.average_buy_price || '');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!sh || Number(sh) <= 0) {
      alert('Please enter a valid number of shares.');
      return;
    }
    if (!pr || Number(pr) < 0) {
      alert('Please enter a valid average price.');
      return;
    }
    try { setLoading(true); await updateHolding(holding.id, { shares: +sh, average_buy_price: +pr }); onSuccess(); toastSuccess('Holding updated'); }
    catch (err) { toastError(err?.message || 'Failed to update holding'); }
    finally { setLoading(false); }
  };
  return createPortal(
    <>
      <style>{`
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          
          .modal-box {
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 24px 24px 0 0 !important;
            max-height: 90vh !important;
            box-shadow: none !important;
          }
          
          .modal-header {
            padding: 20px 20px 16px !important;
          }
          
          .modal-body {
            padding: 16px !important;
          }
        }
      `}</style>
      <div className="modal-overlay animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(6, 9, 14, 0.65)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'24px' }}>
        <div className="modal-box" style={{ background: 'var(--bg)', borderRadius:'28px', width:'100%', maxWidth:'500px', boxShadow:'0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(209, 165, 98, 0.15) inset', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="modal-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px 16px', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontWeight:900, fontSize: '0.97rem', color:'var(--text-dark)', letterSpacing: '-0.3px' }}>Edit {holding.symbol}</div>
              <div style={{ fontSize: '0.7rem', color:'var(--text-muted)', marginTop:'4px' }}>Adjust your position size and average price</div>
            </div>
            <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}><X size={16}/></button>
          </div>
          <form onSubmit={submit} className="modal-body" style={{ padding:'24px 28px' }}>
            <div className="mobile-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
              {[['Shares', sh, setSh, '0'], ['Avg Price (₦)', pr, setPr, '0.00']].map(([lbl, val, fn, ph]) => (
                <div key={lbl}>
                  <label style={{ display:'block', fontSize: '0.66rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px' }}>{lbl}</label>
                  <input type="number" value={val} onChange={e => fn(e.target.value)} placeholder={ph}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:'14px', border:'2px solid var(--border)', fontSize: '0.92rem', fontWeight:700, outline:'none', transition:'border-color 0.2s', background: 'var(--bg-section)', color: 'var(--text-dark)' }}
                    onFocus={e => e.target.style.borderColor='var(--primary)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="button" onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:'14px', background: 'var(--bg)', border:'2px solid var(--border)', fontWeight:800, fontSize: '0.79rem', cursor:'pointer', color:'var(--text-dark)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg)'}>Cancel</button>
              <button type="submit" disabled={loading} style={{ flex:1.5, padding:'14px', borderRadius:'14px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', fontWeight:800, fontSize: '0.79rem', cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(209, 165, 98,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
                {loading ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── Holding Card (Sleek List Item) ────────────────────────── */
function HoldingRow({ holding, onDelete, onEdit, hasBeenPurified }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  const isUp = (holding.return_percentage || 0) >= 0;
  
  const statusRaw = holding.status ? holding.status.toLowerCase() : (holding.is_halal ? 'halal' : 'non-halal');
  const finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(holding.symbol) ? 'halal' : statusRaw;
  
  const getBadgeStyle = (status, purificationDue, nonCompliantRatio) => {
    if (status === 'halal' || status === 'compliant') {
      if (Number(purificationDue || 0) > 0 || Number(nonCompliantRatio || 0) > 0) {
        return { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308', text: 'Shariah Compliant w/ Purification' };
      }
      return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--halal)', text: 'Shariah Compliant' };
    }
    if (status === 'non-halal' || status === 'non_halal' || status === 'non-compliant' || status === 'fail') return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--non-halal)', text: 'Shariah Non-Compliant' };
    return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--questionable)', text: 'Doubtful' };
  };
  const badge = getBadgeStyle(finalStatus, holding.purification_due, holding.non_compliant_ratio);
  const accentColor = badge.color;

  return (
    <div
      className="hover-card holding-row"
      onClick={() => navigate(`/market/${holding.symbol}/aaoifi`, { state: { stock: holding } })}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', padding: '20px 24px',
        background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        marginBottom: '8px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: hov ? '0 12px 32px rgba(91, 41, 113, 0.08)' : '0 4px 16px rgba(0,0,0,0.02)'
      }}
    >
      {/* Indicator */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: accentColor, borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }} />

      {/* Logo & Symbol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1.5, minWidth: 0 }}>
        <CompanyLogo symbol={holding.symbol} logoUrl={holding.logo_url} size={44} radius={12} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.79rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {holding.symbol}
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: badge.bg, color: badge.color, fontSize: '0.48rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {badge.text}
            </span>
            {Number(holding.total_dividends || 0) > 0 && (
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.48rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                ₦{Number(holding.total_dividends).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Divs
              </span>
            )}
            {Number(holding.purification_due || 0) > 0 && (
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--non-halal)', fontSize: '0.48rem', fontWeight: 800 }}>
                ₦{Number(holding.purification_due).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to purify
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{holding.name || holding.symbol}</div>
        </div>
      </div>

      {/* Shares & Value */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.79rem' }}>{fmtK(holding.total_value)}</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{Number(holding.shares).toLocaleString()} shares</div>
      </div>

      {/* Return */}
      <div style={{ flex: 0.8, textAlign: 'right', paddingLeft: '20px' }}>
        {(holding.return_percentage !== null && holding.return_percentage !== undefined && holding.return_percentage !== 0) ? (
          <div style={{ fontWeight: 800, fontSize: '0.75rem', color: isUp ? 'var(--halal)' : 'var(--non-halal)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
            {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
            {isUp?'+':''}{Number(holding.return_percentage||0).toFixed(2)}%
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>-</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '24px' }} onClick={e => e.stopPropagation()}>
        {badge.text === 'Shariah Compliant w/ Purification' && (
          Number(holding.purification_due || 0) === 0 && hasBeenPurified ? (
            <button 
              disabled
              style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--halal)', cursor: 'default', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.7rem' }}
            >
              <ShieldCheck size={13} /> Purified
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/portfolio#purification', { state: { action: 'purify', targetSymbol: holding.symbol } }); }}
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.2) 100%)', border: '1px solid rgba(245,158,11,0.3)', color: '#D97706', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.7rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.2)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.2) 100%)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
            >
              <Droplet size={13} /> Purify Now
            </button>
          )
        )}
        <button 
          onClick={() => onEdit(holding)}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dark)', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.7rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
        >
          <Edit2 size={13} /> Edit
        </button>
        <button 
          onClick={() => onDelete(holding.id)}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--non-halal)', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.7rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

export default function PortfolioTab({ data, setShowAddModal, handleDelete, refreshData, activeFilter = 'all', setActiveFilter }) {
  const [editingHolding, setEditingHolding] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const summary         = data?.summary || {};
  const holdings        = data?.holdings || [];
  const purifications   = data?.purifications || [];
  const totalBalance    = summary.total_balance    || 0;
  const compliance      = summary.health_percentage ?? 100;
  const isHoldingHalal = h => !!h.is_halal || ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(h.symbol);
  const needsPurif = holdings.filter(h => isHoldingHalal(h) && (Number(h.purification_due || 0) > 0 || Number(h.non_compliant_ratio || 0) > 0)).length;
  const halalCount = holdings.filter(isHoldingHalal).length - needsPurif;
  const nonHalalCount = holdings.filter(h => !isHoldingHalal(h) && h.status !== 'doubtful').length;
  const doubtfulCount = holdings.filter(h => h.status === 'doubtful').length;
  const totalGainPct    = holdings.length ? (holdings.reduce((s,h) => s + (h.return_percentage||0), 0) / holdings.length).toFixed(2) : null;
  const isPortfolioUp   = totalGainPct !== null ? Number(totalGainPct) >= 0 : true;

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshData?.(); } finally { setTimeout(() => setRefreshing(false), 800); }
  };

  const filterFn = h => {
    const statusRaw = h.status ? h.status.toLowerCase() : (h.is_halal ? 'halal' : 'non-halal');
    const finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(h.symbol) ? 'halal' : statusRaw;
    const isHalal = finalStatus === 'halal' || finalStatus === 'compliant';
    
    const needsPurification = Number(h.purification_due || 0) > 0 || Number(h.non_compliant_ratio || 0) > 0;

    if (activeFilter === 'halal')    return isHalal && !needsPurification;
    if (activeFilter === 'purify')   return isHalal && needsPurification;
    if (activeFilter === 'doubtful') return finalStatus === 'doubtful';
    if (activeFilter === 'nonhalal') return !isHalal && finalStatus !== 'doubtful';
    return true;
  };
  const displayHoldings = [...holdings].filter(filterFn).sort((a,b) => (b.total_value||0) - (a.total_value||0));

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'32px' }}>

      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSuccess={() => { setEditingHolding(null); refreshData?.(); }}
        />
      )}

      {/* ─── STICKY HEADER ─── */}
      <div style={{ position: 'sticky', top: '0px', zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: '16px' }}>
        
        {/* Solid background to cover scrolled items */}
        <div style={{ position: 'absolute', inset: '0 0 -30px 0', background: 'var(--body-bg)', zIndex: -1 }} />

        {/* ─── DASHBOARD HERO & FILTERS COMBINED ─── */}
        <div className="stagger-1 hover-card" style={{ 
          background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-section) 100%)',
          backgroundImage: 'radial-gradient(circle at top right, rgba(91, 41, 113, 0.03) 0%, transparent 60%), linear-gradient(135deg, var(--bg) 0%, var(--bg-section) 100%), linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 30px 30px, 30px 30px',
          border: '1px solid var(--border)',
          borderRadius: '16px', 
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
          marginBottom: '16px',
          color: 'var(--text-dark)'
        }}>
          {/* Decorative Glowing Orbs */}
          <div style={{ position: 'absolute', bottom: '-40%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(91, 41, 113, 0.03) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
          
          {/* Top Section: Balance & Stats */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                fontSize: 'clamp(2rem, 6vw, 2.8rem)', 
                fontWeight: 900, 
                letterSpacing: '-1px', 
                lineHeight: 1,
                color: 'var(--text-dark)',
                display: 'inline-block'
              }}>
                <AnimCounter target={totalBalance}/>
              </div>

              {totalGainPct !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPortfolioUp ? '#16a34a' : '#dc2626' }}>
                  {isPortfolioUp ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownRight size={18} strokeWidth={3} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    {isPortfolioUp ? '+' : ''}{totalGainPct}% Avg Return
                  </span>
                </div>
              )}
            </div>

            {/* Status Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#16a34a" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Compliant <strong style={{ color: 'var(--text-dark)', fontWeight: 800, marginLeft: '4px' }}>{halalCount}</strong></span>
              </div>
              
              {needsPurif > 0 && (
                <>
                  <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={16} color="#eab308" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purify <strong style={{ color: 'var(--text-dark)', fontWeight: 800, marginLeft: '4px' }}>{needsPurif}</strong></span>
                  </div>
                </>
              )}

              {doubtfulCount > 0 && (
                <>
                  <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={16} color="#d97706" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Doubtful <strong style={{ color: 'var(--text-dark)', fontWeight: 800, marginLeft: '4px' }}>{doubtfulCount}</strong></span>
                  </div>
                </>
              )}

              {nonHalalCount > 0 && (
                <>
                  <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} color="#dc2626" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Non-Compliant <strong style={{ color: 'var(--text-dark)', fontWeight: 800, marginLeft: '4px' }}>{nonHalalCount}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side abstract graphic - Elegant Glass Rings */}
          <div style={{ position: 'absolute', right: '-1%', top: '50%', transform: 'translateY(-50%)', zIndex: 0, opacity: 0.8, pointerEvents: 'none' }}>
             <svg width="120" height="120" viewBox="0 0 280 280" fill="none">
                <circle cx="140" cy="140" r="90" stroke="url(#ring1)" strokeWidth="30" opacity="0.15" />
                <circle cx="200" cy="80" r="60" stroke="url(#ring2)" strokeWidth="20" opacity="0.25" />
                <defs>
                  <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5b2971" />
                    <stop offset="100%" stopColor="#5b2971" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ring2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                  </linearGradient>
                </defs>
             </svg>
          </div>
          </div>
        
          {/* Bottom Section: Action Bar & Filters */}
          <div className="stagger-2" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.3)', padding: '12px 20px', position: 'relative', zIndex: 1 }}>
            
            {/* Filters (Segmented Control style) */}
            <div className="hide-scrollbar" style={{ display:'flex', background:'var(--body-bg)', borderRadius:'14px', padding:'6px', gap:'8px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', overflowX: 'auto', maxWidth: '100%' }}>
            {[
              { id:'all', label:'All', icon: Layers, activeColor: 'var(--primary)' },
              { id:'halal', label: 'Compliant', icon: ShieldCheck, activeColor: '#16a34a' },
              { id:'purify', label: 'Compliant (Purify)', icon: Droplet, activeColor: '#eab308' },
              { id:'doubtful', label: 'Doubtful', icon: HelpCircle, activeColor: '#d97706' },
              { id:'nonhalal', label: 'Non-Compliant', icon: AlertTriangle, activeColor: '#dc2626' }
            ].map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
                padding:'10px 18px', borderRadius:'10px', fontSize: '0.78rem', fontWeight:800, cursor:'pointer', border:'none', transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                background: activeFilter === f.id ? 'var(--bg)' : 'transparent',
                color:      activeFilter === f.id ? f.activeColor : 'var(--text-muted)',
                boxShadow:  activeFilter === f.id ? '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}>
                <f.icon size={16} color={activeFilter === f.id ? f.activeColor : 'var(--text-muted)'} />
                {f.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal('manual')}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'14px', background:'linear-gradient(135deg, var(--primary) 0%, #3a164a 100%)', color:'#FFFFFF', border:'none', fontWeight:800, fontSize: '0.8rem', cursor:'pointer', boxShadow:'0 8px 24px rgba(91, 41, 113, 0.25)', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(91, 41, 113, 0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(91, 41, 113, 0.25)'; }}
            >
              <Plus size={18}/> Add Holding
            </button>
          </div>
        </div>
        
        {/* Header */}
        {displayHoldings.length > 0 && (
          <div className="desktop-only" style={{ position: 'relative', marginTop: '12px', padding: '8px 24px', background: 'var(--body-bg)', zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1.5, fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '62px' }}>Asset</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Value / Shares</div>
              <div style={{ flex: 0.8, textAlign: 'right', fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '20px' }}>Total Return</div>
              <div style={{ paddingLeft: '24px', display: 'flex', gap: '8px' }}>
                <div style={{ width: '71px' }} />
                <div style={{ width: '85px' }} />
              </div>
            </div>
            {/* Diminishing fade shadow effect that covers the scrolled items below it */}
            <div style={{ position: 'absolute', bottom: '-24px', left: 0, right: 0, height: '24px', background: 'linear-gradient(to bottom, var(--body-bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 21 }} />
          </div>
        )}
      </div>

      {/* ─── HOLDINGS LIST ─── */}
      <div className="stagger-3" style={{ marginTop: '0px' }}>

        {/* Rows */}
        {displayHoldings.length === 0 ? (
          <div style={{ padding:'80px 40px', textAlign:'center' }}>
            <div style={{ width:'80px', height:'80px', background:'var(--primary-50)', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', border:'1px solid var(--primary-100)', transform: 'rotate(-5deg)' }}>
              <Wallet size={36} color="var(--primary)"/>
            </div>
            <div style={{ fontSize: '1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              {activeFilter==='all' ? 'Your Portfolio is Empty' : `No ${activeFilter} holdings found`}
            </div>
            <p style={{ color:'var(--text-muted)', marginBottom:'32px', maxWidth:'400px', margin:'0 auto 32px', lineHeight:1.6, fontSize: '0.84rem' }}>
              {activeFilter==='all' ? 'Start tracking your investments and ensure they align with Islamic financial principles.' : 'Try adjusting your filters to view other assets.'}
            </p>
            {activeFilter==='all' && (
              <button onClick={() => setShowAddModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', borderRadius:'14px', background:'var(--primary)', color:'#FFFFFF', border:'none', fontWeight:800, fontSize: '0.84rem', cursor:'pointer', boxShadow:'var(--shadow-sm)', transition:'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(91, 41, 113, 0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>
                <Plus size={18}/> Add Your First Asset
              </button>
            )}
          </div>
        ) : (
          <div 
            className="" 
            style={{ 
              paddingRight: '12px',
              paddingBottom: '60px'
            }}
          >
            {displayHoldings.map((h) => (
              <HoldingRow key={h.id} holding={h} onDelete={handleDelete} onEdit={setEditingHolding} hasBeenPurified={purifications.some(p => p.symbol === h.symbol)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
