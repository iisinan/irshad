import React, { useState } from 'react';
import {
  Wallet, TrendingUp, AlertCircle, ShieldAlert,
  Plus, X, Trash2, CheckCircle, ArrowUpRight, ArrowDownRight,
  BarChart2, PieChart as PieIcon, ChevronRight, RefreshCw,
  Shield, Activity, Link as LinkIcon, Edit2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { updateHolding } from '../../services/api';

/* ─── Helpers ──────────────────────────────────────────────── */
const fmt  = (n) => Number(n||0).toLocaleString('en-NG',{maximumFractionDigits:0});
const fmtK = (n) => {
  const v = Number(n||0);
  if (v >= 1_000_000_000) return `₦${(v/1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `₦${(v/1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `₦${(v/1_000).toFixed(1)}K`;
  return `₦${fmt(v)}`;
};

const MOCK_PERF = [];

const PIE_COLORS = ['#c9a84c','#22c55e','#3b82f6','#8b5cf6','#f97316','#06b6d4'];

const statusConfig = {
  true:  {label:'Halal',    color:'var(--halal)',    bg:'var(--halal-bg)',    icon:CheckCircle},
  false: {label:'Non-Halal',color:'var(--non-halal)',bg:'var(--non-halal-bg)',icon:ShieldAlert},
};

/* ─── Holding Row ──────────────────────────────────────────── */
function HoldingCard({holding, onDelete, onEdit}) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isUp = (holding.return_percentage || 0) >= 0;
  const sc = statusConfig[holding.is_halal ? 'true' : 'false'];
  const SIcon = sc.icon;

  const pct = Math.min(100, Math.max(0, Math.abs(holding.return_percentage || 0)));
  const sparkData = [
    {v: holding.total_value * 0.88},
    {v: holding.total_value * 0.92},
    {v: holding.total_value * 0.89},
    {v: holding.total_value * 0.94},
    {v: holding.total_value * 0.97},
    {v: holding.total_value * (isUp ? 1.0 : 0.96)},
  ];

  return (
    <div
      className="holding-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDelete(false); }}
      style={{
        background: 'white', border: `1px solid ${hov ? 'var(--primary-light)' : 'var(--border)'}`,
        borderRadius: '18px',
        marginBottom: '10px', transition: 'all 0.2s ease',
        boxShadow: hov ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
        background: 'var(--primary-50)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.5px',
        overflow: 'hidden',
      }}>
        {holding.logo_url ? (
            <img src={'http://127.0.0.1:8000' + holding.logo_url} alt={holding.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
            (holding.symbol || '').slice(0, 5)
        )}
      </div>

      <div style={{ flex: 1.4, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {holding.symbol}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {holding.name || holding.symbol}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.68rem', color: sc.color, fontWeight: 700 }}>
          <SIcon size={9}/> {sc.label}
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: 0.7 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '3px' }}>Shares</div>
        <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.92rem' }}>{Number(holding.shares).toLocaleString()}</div>
      </div>

      <div style={{ textAlign: 'right', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '3px' }}>Value</div>
        <div style={{ fontWeight: 900, color: 'var(--text-dark)', fontSize: '1rem' }}>{fmtK(holding.total_value)}</div>
      </div>

      <div className="sparkline-container" style={{ width: '70px', height: '34px', flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`pk-${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 10000','dataMax + 10000']} hide/>
            <Area type="monotone" dataKey="v" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={1.8} fill={`url(#pk-${holding.id})`} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ textAlign: 'right', flex: 0.8 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '3px' }}>Return</div>
        <div style={{
          fontWeight: 800, fontSize: '0.92rem',
          color: isUp ? 'var(--halal)' : 'var(--non-halal)',
          display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end',
        }}>
          {isUp ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
          {isUp ? '+' : ''}{Number(holding.return_percentage || 0).toFixed(2)}%
        </div>
      </div>

      <div style={{ flex: 0.9, textAlign: 'right' }}>
        {holding.purification_due > 0 ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(230,81,0,0.08)', color: 'var(--doubtful)', fontSize: '0.7rem', fontWeight: 700 }}>
            <AlertCircle size={10}/> Purify {fmtK(holding.purification_due)}
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'var(--halal-bg)', color: 'var(--halal)', fontSize: '0.7rem', fontWeight: 700 }}>
            <CheckCircle size={10}/> Compliant
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => onDelete(holding.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--non-halal)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-section)', color: 'var(--text-muted)', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onEdit(holding)} style={{ background: hov ? 'var(--primary-50)' : 'none', border: 'none', color: hov ? 'var(--primary)' : 'var(--text-light)', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <Edit2 size={15}/>
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ background: hov ? '#fee2e2' : 'none', border: 'none', color: hov ? 'var(--non-halal)' : 'var(--text-light)', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <Trash2 size={15}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Edit Modal ────────────────────────────────────────────── */
function EditHoldingModal({ holding, onClose, onSuccess }) {
  const [sh, setSh] = useState(holding.shares || '');
  const [pr, setPr] = useState(holding.average_price || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!sh || !pr) return alert('Fill all fields');
    try {
      setLoading(true);
      await updateHolding(holding.id, { shares: Number(sh), average_price: Number(pr) });
      onSuccess();
    } catch (err) {
      alert(err?.message || 'Failed to update holding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-dark)' }}>Edit {holding.symbol}</h3>
          <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Shares</label>
              <input type="number" value={sh} onChange={e=>setSh(e.target.value)} placeholder="0" style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:'1.5px solid var(--border)', fontSize:'0.95rem', fontWeight:600, outline:'none' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Avg Price (₦)</label>
              <input type="number" value={pr} onChange={e=>setPr(e.target.value)} placeholder="0.00" style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:'1.5px solid var(--border)', fontSize:'0.95rem', fontWeight:600, outline:'none' }}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:'12px' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:'12px', background:'white', border:'1.5px solid var(--border)', color:'var(--text-dark)', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex:1.5, padding:'14px', borderRadius:'12px', background:'var(--primary)', border:'none', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 20px rgba(34,197,94,0.2)' }}>
              {loading ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OverviewTab({ data, setShowAddModal, handleDelete, changeTab, refreshData }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [editingHolding, setEditingHolding] = useState(null);

  const { summary, holdings } = data;
  const totalBalance = summary.total_balance || 0;
  const purificationDue = summary.purification_due || 0;
  const compliance = summary.health_percentage ?? 100;

  // Filter & sort
  const filterFn = h => {
    if (activeFilter === 'halal')    return h.is_halal && !h.purification_due;
    if (activeFilter === 'needs')    return h.purification_due > 0;
    if (activeFilter === 'nonhalal') return !h.is_halal;
    return true;
  };
  const sortFn = (a, b) => {
    if (sortBy === 'value')  return (b.total_value || 0) - (a.total_value || 0);
    if (sortBy === 'return') return (b.return_percentage || 0) - (a.return_percentage || 0);
    if (sortBy === 'name')   return (a.symbol || '').localeCompare(b.symbol || '');
    return 0;
  };
  const displayHoldings = [...holdings].filter(filterFn).sort(sortFn);

  // Pie chart data
  const pieData = holdings.slice(0,6).map((h,i) => ({
    name: h.symbol, value: h.total_value || 0, color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (pieData.length === 0) pieData.push({ name: 'No Holdings', value: 1, color: '#e5e7eb' });

  const halalCount    = holdings.filter(h => h.is_halal).length;
  const nonHalalCount = holdings.filter(h => !h.is_halal).length;
  const needsPurif    = holdings.filter(h => h.purification_due > 0).length;

  return (
    <div className="animate-fade-in">
      {editingHolding && (
        <EditHoldingModal 
          holding={editingHolding} 
          onClose={() => setEditingHolding(null)} 
          onSuccess={() => { setEditingHolding(null); refreshData?.(); }} 
        />
      )}
      
      {/* ═ Stats Row ═ */}
      <div className="stagger-1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px', marginBottom:'24px' }}>
        {/* Total Value */}
        <div style={{ background:'var(--gold-grad)', borderRadius:'18px', padding:'22px 24px', color:'white', position:'relative', overflow:'hidden', boxShadow:'0 6px 28px rgba(201,168,76,0.3)' }}>
          <div style={{ position:'absolute', top:'-15px', right:'-15px', width:'90px', height:'90px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', opacity:0.85, marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
            <Wallet size={12}/> Total Value
          </div>
          <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1px', lineHeight:1, marginBottom:'8px' }}>
            {fmtK(totalBalance)}
          </div>
          <div style={{ fontSize:'0.78rem', fontWeight:600, opacity:0.85 }}>Portfolio market value</div>
        </div>

        {/* Compliance */}
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'18px', padding:'22px 24px', boxShadow:'var(--shadow-sm)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-muted)', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
            <Shield size={12} color="var(--primary)"/> Compliance
          </div>
          <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1px', color: compliance >= 90 ? 'var(--halal)' : compliance >= 70 ? 'var(--doubtful)' : 'var(--non-halal)', lineHeight:1, marginBottom:'8px' }}>
            {compliance}%
          </div>
          <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)' }}>
            {compliance >= 90 ? 'Excellent Shariah standing' : 'Needs attention'}
          </div>
        </div>

        {/* Purification */}
        <div style={{ background: purificationDue > 0 ? 'rgba(230,81,0,0.04)' : 'white', border: `1px solid ${purificationDue > 0 ? 'var(--doubtful-border)' : 'var(--border)'}`, borderRadius:'18px', padding:'22px 24px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color: purificationDue > 0 ? 'var(--doubtful)' : 'var(--text-muted)', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
            <ShieldAlert size={12}/> Purification Due
          </div>
          <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1px', color: purificationDue > 0 ? 'var(--doubtful)' : 'var(--text-dark)', lineHeight:1, marginBottom:'8px' }}>
            {fmtK(purificationDue)}
          </div>
          <div style={{ fontSize:'0.78rem', fontWeight:600, color: purificationDue > 0 ? 'var(--doubtful)' : 'var(--text-muted)' }}>
            {purificationDue > 0 ? `${needsPurif} stock${needsPurif > 1 ? 's' : ''} need purification` : 'All holdings clean'}
          </div>
        </div>

        {/* Holdings Count */}
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'18px', padding:'22px 24px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--text-muted)', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
            <Activity size={12} color="var(--primary)"/> Holdings
          </div>
          <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1px', color:'var(--text-dark)', lineHeight:1, marginBottom:'8px' }}>
            {holdings.length}
          </div>
          <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)' }}>
            {halalCount} Halal · {nonHalalCount} Non-Halal
          </div>
        </div>
      </div>

      {/* ── Holdings Table ── */}
      <div className="stagger-2">
        {/* Filters + Sort */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px', marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'6px' }}>
            {[['all','All'],['halal','Halal'],['needs','Needs Purif.'],['nonhalal','Non-Halal']].map(([val,lbl]) => (
              <button key={val} onClick={() => setActiveFilter(val)} style={{
                padding:'6px 14px', borderRadius:'20px', fontSize:'0.76rem', fontWeight:700, cursor:'pointer', transition:'all 0.18s',
                background: activeFilter === val ? 'var(--primary)' : 'white',
                color:       activeFilter === val ? 'white' : 'var(--text-muted)',
                border:      activeFilter === val ? 'none' : '1.5px solid var(--border)',
                boxShadow:   activeFilter === val ? 'none' : 'var(--shadow-sm)',
              }}>{lbl}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:'6px 10px', borderRadius:'9px', border:'1.5px solid var(--border)', background:'white', fontSize:'0.78rem', fontWeight:600, color:'var(--text-dark)', outline:'none', cursor:'pointer' }}>
              <option value="value">By Value</option>
              <option value="return">By Return</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>

        {/* Column Labels */}
        {displayHoldings.length > 0 && (
          <div className="holding-header" style={{ borderBottom:'1px solid var(--border)', marginBottom:'8px' }}>
            <div style={{ flex:1.4, fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>Stock</div>
            <div style={{ flex:0.7, textAlign:'right', fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>Shares</div>
            <div style={{ flex:1, textAlign:'right', fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>Value</div>
            <div style={{ width:'70px', fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)', textAlign:'center' }}>Trend</div>
            <div style={{ flex:0.8, textAlign:'right', fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>Return</div>
            <div style={{ flex:0.9, textAlign:'right', fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>Status</div>
            <div style={{ width:'32px' }}/>
          </div>
        )}

        {/* Holdings */}
        {displayHoldings.length === 0 ? (
          <div style={{ 
            padding:'80px 40px', textAlign:'center', background:'linear-gradient(180deg, #ffffff 0%, var(--bg-section) 100%)', 
            borderRadius:'24px', border:'1px dashed var(--border-strong)', boxShadow:'var(--shadow-sm)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
          }}>
            <div style={{ 
              width:'80px', height:'80px', background:'var(--primary-50)', borderRadius:'24px', 
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px',
              border:'1px solid var(--primary-100)', boxShadow:'0 12px 32px rgba(201,168,76,0.15)'
            }}>
              <Wallet size={36} color="var(--primary)" />
            </div>
            <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
              {activeFilter === 'all' ? 'Your Portfolio is Empty' : `No ${activeFilter} holdings found`}
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:'1rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
              {activeFilter === 'all' 
                ? 'Start tracking your investments by adding your first NGX stock. Ensure your portfolio remains Shariah-compliant.' 
                : 'Try changing the filter above to see other holdings in your portfolio.'}
            </p>
            {activeFilter === 'all' && (
              <button onClick={() => setShowAddModal(true)} style={{ 
                display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
                borderRadius:'14px', background:'var(--gold-grad)', color:'white', border:'none', 
                fontWeight:800, fontSize:'0.95rem', cursor:'pointer', 
                boxShadow:'0 8px 24px rgba(201,168,76,0.3)', transition:'transform 0.2s, boxShadow 0.2s' 
              }}>
                <Plus size={18}/> Add Your First Holding
              </button>
            )}
          </div>
        ) : (
          displayHoldings.map(h => (
            <HoldingCard key={h.id} holding={h} onDelete={handleDelete} onEdit={(holding) => setEditingHolding(holding)} />
          ))
        )}
      </div>
    </div>
  );
}
