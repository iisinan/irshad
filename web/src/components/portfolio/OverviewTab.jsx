import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, TrendingUp, AlertCircle, ShieldAlert,
  Plus, X, Trash2, CheckCircle, ArrowUpRight, ArrowDownRight,
  BarChart2, PieChart as PieIcon, ChevronRight, Shield,
  Activity, Edit2, Zap, ArrowRight, BookOpen, Award,
  Star, Clock, Newspaper, Eye, ExternalLink, RefreshCw,
  TrendingDown
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, YAxis, XAxis, CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';
import { updateHolding, fetchHistory, fetchNews, fetchWatchlist, formatLogoUrl } from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};
const timeAgo = (d) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const PIE_COLORS   = ['#0F5257','#D4AF37','#22C55E','#14B8A6','#6366f1','#f59e0b','#0B4347','#C9A84C'];
const SECTOR_COLORS = ['#0F5257','#D4AF37','#22C55E','#14B8A6','#6366f1','#f59e0b'];

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

/* ─── Compliance Ring ───────────────────────────────────────── */
function ComplianceRing({ pct, size = 108 }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;
  const color = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ filter: `drop-shadow(0 0 8px ${color}55)`, flexShrink: 0 }}>
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.085} />
      {/* progress */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.085}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.17} fontWeight="900" fill={color}>{pct}%</text>
      <text x={cx} y={cy + size * 0.115} textAnchor="middle" fontSize={size * 0.085} fontWeight="700" fill="rgba(255,255,255,0.38)">HALAL</text>
    </svg>
  );
}

/* ─── Skeleton block ────────────────────────────────────────── */
const Skel = ({ h = 52, r = 12 }) => (
  <div style={{ height: h, borderRadius: r, background: 'var(--bg-section)', animation: 'shimmer 1.5s infinite linear', backgroundImage: 'linear-gradient(90deg,var(--bg-section) 0%,#fff 50%,var(--bg-section) 100%)', backgroundSize: '200% 100%', marginBottom: 8 }} />
);

/* ─── Edit Modal ────────────────────────────────────────────── */
function EditHoldingModal({ holding, onClose, onSuccess }) {
  const [sh, setSh] = useState(holding.shares || '');
  const [pr, setPr] = useState(holding.average_price || '');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!sh || !pr) return;
    try { setLoading(true); await updateHolding(holding.id, { shares: +sh, average_price: +pr }); onSuccess(); toastSuccess('Holding updated'); }
    catch (err) { toastError(err?.message || 'Failed to update holding'); }
    finally { setLoading(false); }
  };
  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'400px', boxShadow:'0 32px 80px rgba(0,0,0,0.18)', overflow:'hidden', animation:'slideUpFade 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-dark)' }}>Edit {holding.symbol}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'2px' }}>Update your position</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}><X size={14}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'22px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'18px' }}>
            {[['Shares', sh, setSh, '0'], ['Avg Price (₦)', pr, setPr, '0.00']].map(([lbl, val, fn, ph]) => (
              <div key={lbl}>
                <label style={{ display:'block', fontSize:'0.7rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px' }}>{lbl}</label>
                <input type="number" value={val} onChange={e => fn(e.target.value)} placeholder={ph}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1.5px solid var(--border)', fontSize:'0.9rem', fontWeight:600, outline:'none', transition:'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='var(--primary)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:'10px', background:'white', border:'1.5px solid var(--border)', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', color:'var(--text-dark)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex:1.5, padding:'12px', borderRadius:'10px', background:'var(--primary)', color:'white', border:'none', fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 6px 16px rgba(15,82,87,0.2)' }}>
              {loading ? <div className="spinner" style={{ width:'14px', height:'14px', borderTopColor:'white' }}/> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Holding Row ───────────────────────────────────────────── */
function HoldingRow({ holding, onDelete, onEdit, rank }) {
  const [hov, setHov] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const isUp = (holding.return_percentage || 0) >= 0;
  const isHalal = !!holding.is_halal;
  const hasPurif = (holding.purification_due || 0) > 0;
  const leftBorder = hasPurif ? 'var(--doubtful)' : isHalal ? 'var(--halal)' : 'var(--non-halal)';
  const sparkData = [0.88,0.92,0.89,0.95,0.97,isUp?1.0:0.95].map(m => ({ v:(holding.total_value||0)*m }));

  return (
    <div
      className="holding-card-v2"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}
      style={{
        display:'flex', alignItems:'center', gap:'14px', padding:'18px 20px',
        background: hov ? 'linear-gradient(135deg,#f9fffd,white)' : 'white',
        border:`1.5px solid ${hov ? 'rgba(15,82,87,0.2)' : 'var(--border)'}`,
        borderLeft:`4px solid ${leftBorder}`,
        borderRadius:'18px', marginBottom:'8px',
        boxShadow: hov ? '0 8px 28px rgba(15,82,87,0.09)' : '0 1px 3px rgba(0,0,0,0.03)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Rank */}
      <div style={{ width:'20px', fontSize:'0.6rem', fontWeight:900, color:'var(--text-light)', textAlign:'center', flexShrink:0 }}>#{rank}</div>

      {/* Logo */}
      <div style={{ width:'42px', height:'42px', borderRadius:'11px', flexShrink:0, background:'var(--primary-50)', border:'1px solid var(--primary-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900, color:'var(--primary)', overflow:'hidden' }}>
        {holding.logo_url
          ? <img loading="lazy" src={formatLogoUrl(holding.logo_url)} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', transition:'transform 0.3s', transform:hov?'scale(1.12)':'scale(1)' }}/>
          : <span style={{ transform:hov?'scale(1.1)':'scale(1)', transition:'transform 0.3s' }}>{(holding.symbol||'').slice(0,4)}</span>}
      </div>

      {/* Name + badge */}
      <div style={{ flex:1.6, minWidth:0 }}>
        <div style={{ fontWeight:800, color:'var(--text-dark)', fontSize:'0.75rem', lineHeight:1.2 }}>{holding.symbol}</div>
        <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{holding.name||holding.symbol}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', marginTop:'4px', fontSize:'0.55rem', fontWeight:700,
          color: isHalal?'var(--halal)':'var(--non-halal)',
          background: isHalal?'var(--halal-bg)':'var(--non-halal-bg)',
          padding:'2px 6px', borderRadius:'4px' }}>
          {isHalal ? <CheckCircle size={8}/> : <ShieldAlert size={8}/>} {isHalal?'Halal':'Non-Halal'}
        </div>
      </div>

      {/* Shares */}
      <div style={{ flex:0.65, textAlign:'right' }}>
        <div style={{ fontSize:'0.55rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', marginBottom:'3px' }}>Shares</div>
        <div style={{ fontWeight:800, color:'var(--text-dark)', fontSize:'0.75rem' }}>{Number(holding.shares).toLocaleString()}</div>
      </div>

      {/* Value */}
      <div style={{ flex:1, textAlign:'right' }}>
        <div style={{ fontSize:'0.55rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', marginBottom:'3px' }}>Value</div>
        {holding.total_value > 0 ? (
          <div style={{ fontWeight:900, color:'var(--text-dark)', fontSize:'0.85rem' }}>{fmtK(holding.total_value)}</div>
        ) : (
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>Unavailable</div>
        )}
      </div>

      {/* Sparkline */}
      <div style={{ width:'62px', height:'28px', flexShrink:0 }}>
        {holding.total_value > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`sp-${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0.3}/>
                  <stop offset="100%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin - 5000','dataMax + 5000']} hide/>
              <Area type="monotone" dataKey="v" stroke={isUp?'#22c55e':'#ef4444'} strokeWidth={1.5} fill={`url(#sp-${holding.id})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Return */}
      <div style={{ flex:0.75, textAlign:'right' }}>
        <div style={{ fontSize:'0.55rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', marginBottom:'3px' }}>Return</div>
        {(holding.return_percentage !== null && holding.return_percentage !== undefined && holding.return_percentage !== 0) ? (
          <div style={{ fontWeight:800, fontSize:'0.75rem', color:isUp?'var(--halal)':'var(--non-halal)', display:'flex', alignItems:'center', gap:'2px', justifyContent:'flex-end' }}>
            {isUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
            {isUp?'+':''}{Number(holding.return_percentage||0).toFixed(2)}%
          </div>
        ) : (
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>-</div>
        )}
      </div>

      {/* Status chip */}
      <div style={{ flex:0.85, textAlign:'right' }}>
        {hasPurif ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', borderRadius:'20px', background:'rgba(180,83,9,0.08)', color:'var(--doubtful)', fontSize:'0.62rem', fontWeight:700 }}>
            <AlertCircle size={9}/> {fmtK(holding.purification_due)}
          </div>
        ) : (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', borderRadius:'20px', background:'var(--halal-bg)', color:'var(--halal)', fontSize:'0.62rem', fontWeight:700 }}>
            <CheckCircle size={9}/> Clean
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ flexShrink:0, display:'flex', gap:'3px' }}>
        {confirm ? (
          <>
            <button onClick={() => onDelete(holding.id)} style={{ padding:'5px 9px', borderRadius:'7px', background:'var(--non-halal)', color:'white', border:'none', fontWeight:700, fontSize:'0.68rem', cursor:'pointer' }}>Delete</button>
            <button onClick={() => setConfirm(false)} style={{ padding:'5px 9px', borderRadius:'7px', background:'var(--bg-section)', color:'var(--text-muted)', border:'none', fontWeight:700, fontSize:'0.68rem', cursor:'pointer' }}>No</button>
          </>
        ) : (
          <>
            <button onClick={() => onEdit(holding)} style={{ background:hov?'var(--primary-50)':'transparent', border:'none', color:hov?'var(--primary)':'var(--text-light)', cursor:'pointer', padding:'5px 7px', borderRadius:'7px', transition:'all 0.18s' }}><Edit2 size={13}/></button>
            <button onClick={() => setConfirm(true)} style={{ background:hov?'#fee2e2':'transparent', border:'none', color:hov?'var(--non-halal)':'var(--text-light)', cursor:'pointer', padding:'5px 7px', borderRadius:'7px', transition:'all 0.18s' }}><Trash2 size={13}/></button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Card shell ────────────────────────────────────────────── */
const Card = ({ children, style = {}, className = '' }) => (
  <div className={`hover-card ${className}`} style={{ background:'white', border:'1px solid var(--border)', borderRadius:'22px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', ...style }}>
    {children}
  </div>
);

/* ─── Card header ───────────────────────────────────────────── */
const CardHead = ({ icon: Icon, iconBg, iconColor = 'var(--primary)', title, sub, right }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ width:'32px', height:'32px', background:iconBg||'var(--primary-50)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} color={iconColor}/>
      </div>
      <div>
        <div style={{ fontWeight:800, color:'var(--text-dark)', fontSize:'0.92rem', lineHeight:1.2 }}>{title}</div>
        {sub && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:500, marginTop:'1px' }}>{sub}</div>}
      </div>
    </div>
    {right}
  </div>
);

/* ─── Main Component ────────────────────────────────────────── */
export default function OverviewTab({ data, setShowAddModal, handleDelete, changeTab, refreshData }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy]             = useState('value');
  const [editingHolding, setEditingHolding] = useState(null);
  const [activity, setActivity]   = useState([]);
  const [news, setNews]           = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingNews, setLoadingNews]         = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { summary, holdings } = data;
  const totalBalance    = summary.total_balance    || 0;
  const purificationDue = summary.purification_due || 0;
  const compliance      = summary.health_percentage ?? 100;
  const halalCount      = holdings.filter(h => h.is_halal).length;
  const nonHalalCount   = holdings.filter(h => !h.is_halal).length;
  const needsPurif      = holdings.filter(h => (h.purification_due||0) > 0).length;
  const totalGainPct    = holdings.length ? (holdings.reduce((s,h) => s + (h.return_percentage||0), 0) / holdings.length).toFixed(2) : null;
  const isPortfolioUp   = totalGainPct !== null ? Number(totalGainPct) >= 0 : true;

  useEffect(() => {
    fetchHistory()
      .then(r => setActivity((r.data?.history || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
    fetchNews()
      .then(r => { const a = r.news || r.data?.news || []; setNews(a.slice(0, 3)); })
      .catch(() => {})
      .finally(() => setLoadingNews(false));
    fetchWatchlist()
      .then(r => setWatchlist((r.data || r || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshData?.(); } finally { setTimeout(() => setRefreshing(false), 800); }
  };

  const filterFn = h => {
    if (activeFilter === 'halal')    return h.is_halal && !(h.purification_due);
    if (activeFilter === 'needs')    return (h.purification_due||0) > 0;
    if (activeFilter === 'nonhalal') return !h.is_halal;
    return true;
  };
  const sortFn = (a, b) => {
    if (sortBy === 'value')  return (b.total_value||0) - (a.total_value||0);
    if (sortBy === 'return') return (b.return_percentage||0) - (a.return_percentage||0);
    return (a.symbol||'').localeCompare(b.symbol||'');
  };
  const displayHoldings = [...holdings].filter(filterFn).sort(sortFn);

  // Pie data
  const total   = holdings.reduce((s,h) => s + (h.total_value||0), 0) || 1;
  const pieData = holdings.slice(0,8).map((h,i) => ({
    name: h.symbol, value: h.total_value||0,
    color: PIE_COLORS[i % PIE_COLORS.length],
    pct:  ((h.total_value||0)/total*100).toFixed(1),
  }));
  if (!pieData.length) pieData.push({ name:'Empty', value:1, color:'#e5e7eb', pct:'0' });

  // Sector data
  const sectorMap = {};
  holdings.forEach(h => { const s = h.sector||'Other'; sectorMap[s] = (sectorMap[s]||0) + (h.total_value||0); });
  const sectorData = Object.entries(sectorMap).sort((a,b) => b[1]-a[1]).slice(0,6)
    .map(([sector, value], i) => ({ sector: sector.length > 15 ? sector.slice(0,15)+'…' : sector, value, pct:(value/total*100).toFixed(1), color: SECTOR_COLORS[i] }));

  // Performers
  const byReturn      = [...holdings].filter(h => h.return_percentage != null).sort((a,b) => (b.return_percentage||0)-(a.return_percentage||0));
  const topPerformers = byReturn.slice(0,3);
  const worstPerfomers= [...byReturn].reverse().slice(0,2).filter(h => (h.return_percentage||0) < 0);

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSuccess={() => { setEditingHolding(null); refreshData?.(); }}
        />
      )}

      {/* ════════════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════════════ */}
      <div className="stagger-1" style={{ borderRadius:'26px', overflow:'hidden', boxShadow:'0 20px 60px rgba(15,82,87,0.22)', position:'relative' }}>

        {/* Background */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#08131f 0%,#0D2137 30%,#0F5257 70%,#0A6B6B 100%)', zIndex:0 }}/>
        {/* Orbs */}
        <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', background:'radial-gradient(circle,rgba(212,175,55,0.13) 0%,transparent 65%)', borderRadius:'50%', zIndex:1, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-100px', left:'15%', width:'280px', height:'280px', background:'radial-gradient(circle,rgba(34,197,94,0.08) 0%,transparent 65%)', borderRadius:'50%', zIndex:1, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'40%', left:'-60px', width:'200px', height:'200px', background:'radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)', borderRadius:'50%', zIndex:1, pointerEvents:'none' }}/>

        {/* Main content */}
        <div className="overview-hero" style={{ position:'relative', zIndex:2, padding:'34px 38px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'24px' }}>

            {/* Left: value + stats */}
            <div style={{ flex:1, minWidth:'240px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.45)' }}>Total Portfolio Value</span>
                <button
                  onClick={handleRefresh}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'2px', display:'flex', lineHeight:1 }}
                  title="Refresh portfolio"
                >
                  <RefreshCw size={11} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/>
                </button>
                {/* live dot */}
                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', animation:'pulse 2s ease infinite', boxShadow:'0 0 0 0 rgba(34,197,94,0.45)' }}/>
                  <span style={{ fontSize:'0.58rem', fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Live</span>
                </div>
              </div>

              <div style={{ fontSize:'clamp(2.2rem,5vw,3.4rem)', fontWeight:900, color:'white', letterSpacing:'-2px', lineHeight:1, marginBottom:'6px' }}>
                <AnimCounter target={totalBalance}/>
              </div>

              {/* Avg return badge */}
              {totalGainPct !== null && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'8px', background: isPortfolioUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', marginBottom:'20px' }}>
                  {isPortfolioUp ? <ArrowUpRight size={13} color="#22c55e"/> : <ArrowDownRight size={13} color="#ef4444"/>}
                  <span style={{ fontSize:'0.78rem', fontWeight:800, color: isPortfolioUp ? '#22c55e' : '#ef4444' }}>
                    {isPortfolioUp?'+':''}{totalGainPct}% avg return
                  </span>
                </div>
              )}

              {/* Divider stats */}
              <div style={{ display:'flex', gap:'18px', flexWrap:'wrap' }}>
                {[
                  { lbl:'Holdings', val:`${holdings.length}`, color:'rgba(255,255,255,0.9)' },
                  { lbl:'Halal', val:`${halalCount}`, color:'#22c55e' },
                  ...(nonHalalCount > 0 ? [{ lbl:'Non-Halal', val:`${nonHalalCount}`, color:'#ef4444' }] : []),
                  ...(purificationDue > 0 ? [{ lbl:'Purify', val:fmtK(purificationDue), color:'#f59e0b' }] : []),
                ].map(({ lbl, val, color }, i, arr) => (
                  <React.Fragment key={lbl}>
                    <div>
                      <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'rgba(255,255,255,0.35)', marginBottom:'3px' }}>{lbl}</div>
                      <div style={{ fontSize:'1rem', fontWeight:800, color }}>{val}</div>
                    </div>
                    {i < arr.length-1 && <div style={{ width:'1px', background:'rgba(255,255,255,0.08)', alignSelf:'stretch' }}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right: ring + CTA */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
              <ComplianceRing pct={compliance} size={108}/>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                  {compliance >= 90 ? '🌟 Excellent' : compliance >= 70 ? '⚠️ Review Needed' : '🚨 Urgent'}
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'12px', background:'linear-gradient(135deg,#E6C875,#D4AF37)', color:'#0D1B2A', border:'none', fontWeight:800, fontSize:'0.82rem', cursor:'pointer', boxShadow:'0 6px 18px rgba(212,175,55,0.4)', transition:'all 0.2s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 26px rgba(212,175,55,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 18px rgba(212,175,55,0.4)'; }}
                >
                  <Plus size={14}/> Add Holding
                </button>
                <button
                  onClick={() => changeTab?.('purification')}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'12px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.14)', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                >
                  <Shield size={13}/> Purify
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="overview-hero-bottom" style={{ position:'relative', zIndex:2, background:'rgba(0,0,0,0.22)', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'13px 38px', display:'flex', gap:'28px', flexWrap:'wrap' }}>
          {[
            { lbl:'Standard', val:'AAOIFI Shariah', color:'#22c55e' },
            { lbl:'Exchange', val:'National Exchange', color:'rgba(255,255,255,0.65)' },
            { lbl:'Compliance', val:`${compliance}% Halal`, color: compliance>=90?'#22c55e':compliance>=70?'#f59e0b':'#ef4444' },
            { lbl:'Non-Compliant', val:`${nonHalalCount} position${nonHalalCount!==1?'s':''}`, color:nonHalalCount>0?'#ef4444':'#22c55e' },
          ].map(({ lbl, val, color }) => (
            <div key={lbl}>
              <div style={{ fontSize:'0.56rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', color:'rgba(255,255,255,0.3)', marginBottom:'2px' }}>{lbl}</div>
              <div style={{ fontSize:'0.78rem', fontWeight:800, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ROW 2 — Allocation · Sectors · Actions
      ════════════════════════════════════════════════ */}
      <div className="overview-row2 stagger-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 256px', gap:'14px' }}>

        {/* Allocation Pie */}
        <Card>
          <CardHead icon={PieIcon} title="Allocation" sub={`${holdings.length} positions`}/>
          {holdings.length > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'148px', height:'148px', flexShrink:0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value">
                      {pieData.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                    </Pie>
                    <Tooltip formatter={(v,n,p) => [fmtK(v), p.payload.name]} contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'5px', maxHeight:'148px', overflowY:'auto' }}>
                {pieData.map((d,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:d.color, flexShrink:0 }}/>
                    <span style={{ fontSize:'0.74rem', fontWeight:700, color:'var(--text-dark)', flex:1 }}>{d.name}</span>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)' }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-muted)' }}>
              <PieIcon size={28} style={{ opacity:0.15, marginBottom:'8px' }}/>
              <p style={{ fontSize:'0.8rem' }}>Add holdings to see allocation</p>
            </div>
          )}
        </Card>

        {/* Sector Breakdown */}
        <Card>
          <CardHead icon={BarChart2} iconBg="#eef2ff" iconColor="#6366f1" title="Sectors" sub={`${sectorData.length} industries`}/>
          {sectorData.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {sectorData.map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.76rem', fontWeight:700, color:'var(--text-dark)' }}>{s.sector}</span>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)' }}>{s.pct}%</span>
                  </div>
                  <div style={{ height:'5px', background:'var(--bg-section)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${s.pct}%`, background:s.color, borderRadius:'3px', transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)', animationDelay:`${i*0.08}s` }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-muted)', fontSize:'0.8rem' }}>
              <BarChart2 size={28} style={{ opacity:0.15, marginBottom:'8px' }}/>
              <p>No sector data yet</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {[
            { icon:Plus,     label:'Add Holding',   sub:'Track a new stock',   color:'#0F5257', bg:'var(--primary-50)', fn:() => setShowAddModal(true) },
            { icon:BarChart2, label:'Screen Stocks', sub:'Find halal picks',    color:'#6366f1', bg:'#eef2ff',         to:'/portfolio#market' },
            { icon:Eye,      label:'Watchlist',     sub:'Monitor your picks',   color:'#f59e0b', bg:'#fffbeb',         fn:() => changeTab?.('watchlist') },
            { icon:BookOpen, label:'Resources',     sub:'Learn Islamic finance', color:'#14b8a6', bg:'#f0fdfa',        fn:() => changeTab?.('lectures') },
            { icon:Shield,   label:'Purify',        sub:'Calculate haram income',color:'#B45309', bg:'var(--doubtful-bg)', fn:() => changeTab?.('purification') },
          ].map(({ icon:Icon, label, sub, color, bg, to, fn }) => {
            const inner = (
              <div key={label} onClick={fn} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', borderRadius:'13px', background:'white', border:'1.5px solid var(--border)', cursor:'pointer', transition:'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.background=bg; e.currentTarget.style.transform='translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='white'; e.currentTarget.style.transform='none'; }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={14} color={color}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'0.82rem', color:'var(--text-dark)', lineHeight:1.2 }}>{label}</div>
                  <div style={{ fontSize:'0.66rem', color:'var(--text-muted)', fontWeight:500 }}>{sub}</div>
                </div>
                <ArrowRight size={12} color="var(--text-light)"/>
              </div>
            );
            return to ? <Link key={label} to={to} style={{ textDecoration:'none' }}>{inner}</Link> : <React.Fragment key={label}>{inner}</React.Fragment>;
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ROW 3 — Performance + Performers + Watchlist
      ════════════════════════════════════════════════ */}
      <div className="overview-row3 stagger-3" style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'14px' }}>

        {data.history && data.history.length > 1 ? (
          <Card>
            <CardHead
              icon={TrendingUp}
              title="Performance"
              sub="30-day portfolio history"
              right={<span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600 }}>{data.history.length} snapshots</span>}
            />
            <div style={{ height:'190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history} margin={{ top:5, right:0, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#0F5257" stopOpacity={0.18}/>
                      <stop offset="100%" stopColor="#0F5257" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide/>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="0" vertical={false}/>
                  <Tooltip
                    formatter={v => [fmtK(v), 'Value']}
                    labelFormatter={l => new Date(l).toLocaleDateString('en-NG', { month:'short', day:'numeric' })}
                    contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#0F5257" strokeWidth={2.2} fill="url(#perfGrad)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          /* Performers shown when no chart data */
          <Card>
            <CardHead icon={Award} iconBg="#fffbeb" iconColor="#f59e0b" title="Performers" sub="By return %"/>
            {topPerformers.length === 0
              ? <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize:'0.8rem' }}>Add holdings to see performance</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                  {[...topPerformers,...worstPerfomers].map(h => {
                    const up = (h.return_percentage||0) >= 0;
                    return (
                      <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:up?'var(--halal-bg)':'var(--non-halal-bg)', borderRadius:'11px' }}>
                        {up ? <Star size={12} color="var(--halal)"/> : <TrendingDown size={12} color="var(--non-halal)"/>}
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:'0.82rem', color:'var(--text-dark)' }}>{h.symbol}</div>
                          <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{fmtK(h.total_value)}</div>
                        </div>
                        <div style={{ fontWeight:800, color:up?'var(--halal)':'var(--non-halal)', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'2px' }}>
                          {up?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}
                          {up?'+':''}{Number(h.return_percentage||0).toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </Card>
        )}

        {/* Watchlist snapshot */}
        <Card>
          <CardHead
            icon={Eye} iconBg="#fffbeb" iconColor="#f59e0b"
            title="Watchlist"
            right={<button onClick={() => changeTab?.('watchlist')} style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--primary)', background:'var(--primary-50)', border:'none', cursor:'pointer', padding:'4px 9px', borderRadius:'7px', display:'flex', alignItems:'center', gap:'3px' }}>All <ChevronRight size={11}/></button>}
          />
          {watchlist.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)' }}>
              <Eye size={26} style={{ opacity:0.12, marginBottom:'8px' }}/>
              <p style={{ fontSize:'0.8rem' }}>Your watchlist is empty</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {watchlist.map((item,i) => {
                const price  = item.latest_price || item.current_price || 0;
                const change = item.price_change_pct || 0;
                const up = change >= 0;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:'var(--bg-section)', borderRadius:'11px', transition:'all 0.18s', cursor:'default' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--primary-50)'}
                    onMouseLeave={e => e.currentTarget.style.background='var(--bg-section)'}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.58rem', fontWeight:900, color:'white', flexShrink:0, overflow:'hidden' }}>
                      {item.logo_url ? <img loading="lazy" src={formatLogoUrl(item.logo_url)} alt={item.symbol} style={{ width:'100%', height:'100%', objectFit:'contain' }}/> : (item.symbol||'').slice(0,4)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:'0.8rem', color:'var(--text-dark)' }}>{item.symbol}</div>
                      <div style={{ fontSize:'0.66rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name||''}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, fontSize:'0.8rem', color:'var(--text-dark)' }}>₦{Number(price).toFixed(2)}</div>
                      <div style={{ fontSize:'0.66rem', fontWeight:700, color:up?'var(--halal)':'var(--non-halal)', display:'flex', alignItems:'center', gap:'2px', justifyContent:'flex-end' }}>
                        {up?<ArrowUpRight size={9}/>:<ArrowDownRight size={9}/>}{up?'+':''}{Number(change).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════
          ROW 4 — News · Activity
      ════════════════════════════════════════════════ */}
      <div className="overview-row4 stagger-4" style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:'14px' }}>

        {/* Market News */}
        <Card>
          <CardHead
            icon={Newspaper} iconBg="#f0fdfa" iconColor="#14b8a6"
            title="Market News"
            right={<Link to="/portfolio#market" style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--primary)', background:'var(--primary-50)', textDecoration:'none', padding:'4px 9px', borderRadius:'7px', display:'flex', alignItems:'center', gap:'3px' }}>More <ChevronRight size={11}/></Link>}
          />
          {loadingNews ? [1,2,3].map(i => <Skel key={i} h={66}/>) : news.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px', color:'var(--text-muted)', fontSize:'0.8rem' }}>No news available</div>
          ) : news.map((item,i) => (
            <a key={i} href={item.url||item.link||'#'} target="_blank" rel="noreferrer"
              style={{ display:'flex', gap:'11px', padding:'11px', borderRadius:'13px', border:'1px solid var(--border)', textDecoration:'none', marginBottom:'8px', background:'white', transition:'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--primary-50)'; e.currentTarget.style.borderColor='var(--primary-100)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor='var(--border)'; }}>
              {item.image_url && <img loading="lazy" src={item.image_url} alt="" style={{ width:'52px', height:'52px', borderRadius:'9px', objectFit:'cover', flexShrink:0 }} onError={e => { e.target.style.display='none'; }}/>}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.79rem', color:'var(--text-dark)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'4px' }}>
                  <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>{item.source||'Market'}</span>
                  <span style={{ color:'var(--text-light)' }}>·</span>
                  <span style={{ fontSize:'0.65rem', color:'var(--text-light)' }}>{timeAgo(item.published_at||item.created_at)}</span>
                </div>
              </div>
              <ExternalLink size={10} color="var(--text-light)" style={{ flexShrink:0, marginTop:'3px' }}/>
            </a>
          ))}
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHead icon={Activity} title="Recent Activity"/>
          {loadingActivity ? [1,2,3].map(i => <Skel key={i} h={50}/>) : activity.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)' }}>
              <Clock size={26} style={{ opacity:0.12, marginBottom:'8px' }}/>
              <p style={{ fontSize:'0.8rem' }}>Screen stocks to see activity</p>
            </div>
          ) : activity.map((item,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 11px', background:'var(--bg-section)', borderRadius:'11px', marginBottom:'7px' }}>
              <div style={{ width:'32px', height:'32px', background:'var(--primary-50)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Activity size={13} color="var(--primary)"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.79rem', color:'var(--text-dark)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {item.action === 'check' ? `Screened ${item.detail?.symbol||'—'}` : 'Activity'}
                </div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'1px' }}>{timeAgo(item.created_at)}</div>
              </div>
              {item.detail?.symbol && (
                <Link to={`/market/${item.detail.symbol}`} style={{ fontSize:'0.66rem', fontWeight:700, color:'var(--primary)', textDecoration:'none', background:'var(--primary-50)', padding:'3px 7px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'2px', whiteSpace:'nowrap' }}>
                  View <ChevronRight size={9}/>
                </Link>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════
          HOLDINGS TABLE
      ════════════════════════════════════════════════ */}
      <div className="stagger-5">
        {/* Table header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#0F5257,#0A6B6B)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wallet size={14} color="white"/>
            </div>
            <div>
              <div style={{ fontWeight:800, color:'var(--text-dark)', fontSize:'0.92rem' }}>My Holdings</div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:500 }}>{displayHoldings.length} position{displayHoldings.length!==1?'s':''} shown</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', alignItems:'center' }}>
            {/* Segmented filter */}
            <div style={{ display:'flex', background:'white', border:'1.5px solid var(--border)', borderRadius:'10px', padding:'3px', gap:'2px' }}>
              {[['all','All'],['halal','✓ Halal'],['needs','⚠ Purif.'],['nonhalal','✕ Non-Halal']].map(([val,lbl]) => (
                <button key={val} onClick={() => setActiveFilter(val)} style={{
                  padding:'5px 11px', borderRadius:'7px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.16s',
                  background: activeFilter===val ? 'var(--primary)' : 'transparent',
                  color:       activeFilter===val ? 'white' : 'var(--text-muted)',
                  boxShadow:   activeFilter===val ? '0 2px 8px rgba(15,82,87,0.2)' : 'none',
                }}>{lbl}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:'6px 10px', borderRadius:'9px', border:'1.5px solid var(--border)', background:'white', fontSize:'0.74rem', fontWeight:600, color:'var(--text-dark)', outline:'none', cursor:'pointer' }}>
              <option value="value">Sort: Value</option>
              <option value="return">Sort: Return</option>
              <option value="name">Sort: Name</option>
            </select>
            <button onClick={() => setShowAddModal(true)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'9px', background:'var(--primary)', color:'white', border:'none', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', boxShadow:'0 4px 12px rgba(15,82,87,0.2)' }}>
              <Plus size={13}/> Add
            </button>
          </div>
        </div>

        {/* Column labels */}
        {displayHoldings.length > 0 && (
          <div className="holding-header" style={{ borderBottom:'1.5px solid var(--border)', marginBottom:'8px', paddingBottom:'7px', paddingLeft:'20px', paddingRight:'20px', gap:'14px' }}>
            <div style={{ width:'20px' }}/>
            <div style={{ width:'42px' }}/>
            <div style={{ flex:1.6, fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Stock</div>
            <div style={{ flex:0.65, textAlign:'right', fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Shares</div>
            <div style={{ flex:1, textAlign:'right', fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Value</div>
            <div style={{ width:'62px', textAlign:'center', fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Trend</div>
            <div style={{ flex:0.75, textAlign:'right', fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Return</div>
            <div style={{ flex:0.85, textAlign:'right', fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--text-muted)' }}>Status</div>
            <div style={{ width:'66px' }}/>
          </div>
        )}

        {/* Rows */}
        {displayHoldings.length === 0 ? (
          <div style={{ padding:'72px 40px', textAlign:'center', background:'linear-gradient(135deg,white,var(--bg-section))', borderRadius:'22px', border:'1.5px dashed var(--border)' }}>
            <div style={{ width:'68px', height:'68px', background:'var(--primary-50)', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', border:'1px solid var(--primary-100)' }}>
              <Wallet size={30} color="var(--primary)"/>
            </div>
            <div style={{ fontSize:'1.25rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'10px', letterSpacing:'-0.5px' }}>
              {activeFilter==='all' ? 'Portfolio is Empty' : `No ${activeFilter} holdings`}
            </div>
            <p style={{ color:'var(--text-muted)', marginBottom:'24px', maxWidth:'360px', margin:'0 auto 24px', lineHeight:1.6, fontSize:'0.9rem' }}>
              {activeFilter==='all' ? 'Track your investments and maintain full Shariah compliance.' : 'Adjust the filter to see other holdings.'}
            </p>
            {activeFilter==='all' && (
              <button onClick={() => setShowAddModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'12px 24px', borderRadius:'13px', background:'var(--gold-grad)', color:'white', border:'none', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', boxShadow:'0 8px 22px rgba(212,175,55,0.3)', transition:'all 0.2s' }} className="hover-lift">
                <Plus size={16}/> Add Your First Holding
              </button>
            )}
          </div>
        ) : (
          displayHoldings.map((h, i) => (
            <HoldingRow key={h.id} holding={h} rank={i+1} onDelete={handleDelete} onEdit={setEditingHolding}/>
          ))
        )}
      </div>
    </div>
  );
}
