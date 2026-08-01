import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Plus, X, Trash2, ArrowUpRight, ArrowDownRight,
  RefreshCw, Edit2
} from 'lucide-react';
import {
  AreaChart, Area, YAxis, ResponsiveContainer
} from 'recharts';
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
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(15,82,87,0.4)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'24px' }}>
      <div style={{ background: 'var(--bg)', borderRadius:'28px', width:'100%', maxWidth:'500px', boxShadow:'0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px 16px', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontWeight:900, fontSize: '0.97rem', color:'var(--text-dark)', letterSpacing: '-0.3px' }}>Edit {holding.symbol}</div>
            <div style={{ fontSize: '0.7rem', color:'var(--text-muted)', marginTop:'4px' }}>Adjust your position size and average price</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}><X size={16}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'24px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
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
            <button type="submit" disabled={loading} style={{ flex:1.5, padding:'14px', borderRadius:'14px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', fontWeight:800, fontSize: '0.79rem', cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(212,175,55,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              {loading ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ─── Holding Card (Sleek List Item) ────────────────────────── */
function HoldingRow({ holding, onDelete, onEdit }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  const isUp = (holding.return_percentage || 0) >= 0;
  
  const statusRaw = holding.status ? holding.status.toLowerCase() : (holding.is_halal ? 'halal' : 'non-halal');
  const finalStatus = ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(holding.symbol) ? 'halal' : statusRaw;
  
  const getBadgeStyle = (status) => {
    if (status === 'halal' || status === 'compliant') return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--halal)', text: 'Halal' };
    if (status === 'non-halal' || status === 'non_halal' || status === 'non-compliant' || status === 'fail') return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--non-halal)', text: 'Non-Halal' };
    return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--questionable)', text: 'Doubtful' };
  };
  const badge = getBadgeStyle(finalStatus);
  const accentColor = badge.color;
  const sparkData = [0.88,0.92,0.89,0.95,0.97,isUp?1.0:0.95].map(m => ({ v:(holding.total_value||0)*m }));

  return (
    <div
      className="hover-card"
      onClick={() => navigate(`/market/${holding.symbol}`, { state: { stock: holding } })}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setMenuOpen(false); }}
      style={{
        display: 'flex', alignItems: 'center', padding: '20px 24px',
        background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        marginBottom: '12px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.05)' : '0 4px 16px rgba(0,0,0,0.02)'
      }}
    >
      {/* Indicator */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: accentColor, borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }} />

      {/* Logo & Symbol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1.5, minWidth: 0 }}>
        <CompanyLogo symbol={holding.symbol} logoUrl={holding.logo_url} size={44} radius={12} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.79rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {holding.symbol}
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: badge.bg, color: badge.color, fontSize: '0.48rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {badge.text}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{holding.name || holding.symbol}</div>
        </div>
      </div>

      {/* Trend Line */}
      <div style={{ flex: 1, height: '36px', padding: '0 20px', opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s' }}>
        {holding.total_value > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`sp-${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0.2}/>
                  <stop offset="100%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin - 5000','dataMax + 5000']} hide/>
              <Area type="monotone" dataKey="v" stroke={isUp?'#22c55e':'#ef4444'} strokeWidth={2} fill={`url(#sp-${holding.id})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
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
        <button 
          onClick={() => onEdit(holding)}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dark)', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.7rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.color = 'var(--gold)'; }}
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

  const { summary, holdings } = data;
  const totalBalance    = summary.total_balance    || 0;
  const purificationDue = summary.purification_due || 0;
  const compliance      = summary.health_percentage ?? 100;
  const isHoldingHalal = h => !!h.is_halal || ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(h.symbol);
  const halalCount      = holdings.filter(isHoldingHalal).length;
  const nonHalalCount   = holdings.filter(h => !isHoldingHalal(h)).length;
  const totalGainPct    = holdings.length ? (holdings.reduce((s,h) => s + (h.return_percentage||0), 0) / holdings.length).toFixed(2) : null;
  const isPortfolioUp   = totalGainPct !== null ? Number(totalGainPct) >= 0 : true;

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshData?.(); } finally { setTimeout(() => setRefreshing(false), 800); }
  };

  const filterFn = h => {
    if (activeFilter === 'halal')    return isHoldingHalal(h) && !(h.purification_due);
    if (activeFilter === 'purify')   return (h.purification_due||0) > 0;
    if (activeFilter === 'nonhalal') return !isHoldingHalal(h);
    return true;
  };
  const displayHoldings = [...holdings].filter(filterFn).sort((a,b) => (b.total_value||0) - (a.total_value||0));

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSuccess={() => { setEditingHolding(null); refreshData?.(); }}
        />
      )}

      {/* ─── DASHBOARD HERO ─── */}
      <div className="stagger-1" style={{ 
        background: 'linear-gradient(135deg, rgba(15,82,87,0.03) 0%, rgba(212,175,55,0.05) 100%)', 
        border: '1px solid rgba(15,82,87,0.08)',
        borderRadius: '24px', 
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '30px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,82,87,0.03)'
      }}>
        {/* Background Mesh */}
        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '100%', height: '200%', background: 'radial-gradient(ellipse at center, rgba(15,82,87,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
        
        {/* Left: Value & Stats */}
        <div style={{ zIndex: 1, flex: 1, minWidth: '280px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <span style={{ fontSize: '0.66rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.2px', color:'var(--text-muted)' }}>Total Balance</span>
            <button
              onClick={handleRefresh}
              style={{ background: 'var(--bg)', border:'1px solid var(--border)', borderRadius:'6px', cursor:'pointer', color:'var(--text-muted)', padding:'4px', display:'flex', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}
              title="Refresh portfolio"
            >
              <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/>
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', padding: '4px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', animation:'pulse 2s ease infinite' }}/>
              <span style={{ fontSize: '0.53rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Live</span>
            </div>
          </div>

          <div style={{ fontSize:'clamp(2.5rem, 6vw, 3.8rem)', fontWeight:900, color:'var(--text-dark)', letterSpacing:'-1.5px', lineHeight:1, marginBottom:'12px' }}>
            <AnimCounter target={totalBalance}/>
          </div>

          {totalGainPct !== null && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'10px', background: isPortfolioUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', marginBottom:'24px' }}>
              {isPortfolioUp ? <ArrowUpRight size={14} color="#22c55e"/> : <ArrowDownRight size={14} color="#ef4444"/>}
              <span style={{ fontSize: '0.75rem', fontWeight:800, color: isPortfolioUp ? '#22c55e' : '#ef4444' }}>
                {isPortfolioUp?'+':''}{totalGainPct}% Avg Return
              </span>
            </div>
          )}

          {/* Mini Stats Pills */}
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            {[
              { lbl: 'Halal', val: halalCount, bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
              { lbl: 'Non-Halal', val: nonHalalCount, bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
              { lbl: 'Purify', val: fmtK(purificationDue), bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
            ].map(stat => stat.val > 0 || stat.val !== "₦0" ? (
              <div key={stat.lbl} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }} />
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.lbl}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-dark)' }}>{stat.val}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Right: Compliance */}
        <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '24px', background: 'var(--bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Shariah Status</div>
            <div style={{ fontSize: '1.06rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              {compliance >= 90 ? 'Excellent' : compliance >= 70 ? 'Needs Review' : 'Critical'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '140px', lineHeight: 1.4 }}>
              Based on AAOIFI financial screening.
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTION BAR & FILTERS ─── */}
      <div className="stagger-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
        
        {/* Filters */}
        <div style={{ display:'flex', background:'var(--bg-section)', borderRadius:'12px', padding:'4px', gap:'4px' }}>
          {[
            { id:'all', label:'All Holdings' },
            { id:'halal', label:'Halal' },
            { id:'purify', label:'Purify' },
            { id:'nonhalal', label:'Non-Halal' }
          ].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
              padding:'8px 16px', borderRadius:'8px', fontSize: '0.7rem', fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              background: activeFilter === f.id ? 'var(--bg)' : 'transparent',
              color:      activeFilter === f.id ? 'var(--text-dark)' : 'var(--text-muted)',
              boxShadow:  activeFilter === f.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal('manual')}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', fontWeight:800, fontSize: '0.75rem', cursor:'pointer', boxShadow:'0 8px 20px rgba(212,175,55,0.3)', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 24px rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 20px rgba(212,175,55,0.3)'; }}
          >
            <Plus size={16}/> Add Holding
          </button>
        </div>
      </div>

      {/* ─── HOLDINGS LIST ─── */}
      <div className="stagger-3" style={{ marginTop: '24px' }}>
        
        {/* Header */}
        {displayHoldings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px 16px 24px' }}>
            <div style={{ flex: 1.5, fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '62px' }}>Asset</div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '20px' }}>7D Trend</div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Value / Shares</div>
            <div style={{ flex: 0.8, textAlign: 'right', fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '20px' }}>Total Return</div>
            <div style={{ paddingLeft: '24px', display: 'flex', gap: '8px' }}>
              <div style={{ width: '71px' }} />
              <div style={{ width: '85px' }} />
            </div>
          </div>
        )}

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
              <button onClick={() => setShowAddModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', borderRadius:'14px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', fontWeight:800, fontSize: '0.84rem', cursor:'pointer', boxShadow:'0 8px 24px rgba(212,175,55,0.3)', transition:'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
                <Plus size={18}/> Add Your First Asset
              </button>
            )}
          </div>
        ) : (
          <div>
            {displayHoldings.map((h) => (
              <HoldingRow key={h.id} holding={h} onDelete={handleDelete} onEdit={setEditingHolding}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
