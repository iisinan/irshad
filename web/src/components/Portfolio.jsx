import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPortfolio, addHolding, removeHolding } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import OverviewTab from './portfolio/OverviewTab';
import MarketTab from './portfolio/MarketTab';
import WatchlistTab from './portfolio/WatchlistTab';
import ZakatTab from './portfolio/ZakatTab';
import PurificationTab from './portfolio/PurificationTab';
import ShariahPage from './Shariah';

import AboutPage from './About';
import StockDetails from './StockDetails';

/* ─── Skeleton ─────────────────────────────────────────────── */
function Skeleton() {
  const sh = {
    background:'linear-gradient(90deg,var(--bg-section) 0%,#fff 50%,var(--bg-section) 100%)',
    backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear', borderRadius:'8px',
  };
  return (
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'36px 24px 80px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'36px',flexWrap:'wrap',gap:'20px'}}>
        <div>
          <div style={{...sh,width:'160px',height:'13px',marginBottom:'12px'}}/>
          <div style={{...sh,width:'280px',height:'42px',marginBottom:'10px'}}/>
          <div style={{...sh,width:'220px',height:'16px'}}/>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <div style={{...sh,width:'140px',height:'46px',borderRadius:'12px'}}/>
          <div style={{...sh,width:'160px',height:'46px',borderRadius:'12px'}}/>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',marginBottom:'28px'}}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{background:'white',borderRadius:'20px',padding:'24px',height:'130px',border:'1px solid var(--border)'}}>
            <div style={{...sh,width:'36px',height:'36px',borderRadius:'10px',marginBottom:'16px'}}/>
            <div style={{...sh,width:'110px',height:'32px',marginBottom:'8px'}}/>
            <div style={{...sh,width:'80px',height:'13px'}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Add Holding Modal ────────────────────────────────────── */
function AddModal({ onClose, onAdd, isAdding }) {
  const [tab, setTab] = useState('manual'); // 'manual' | 'broker'
  const [sym, setSym] = useState('');
  const [sh, setSh] = useState('');
  const [pr, setPr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!sym || !sh || !pr) return alert('Fill all fields');
    onAdd({ symbol: sym.toUpperCase(), shares: Number(sh), average_price: Number(pr) });
  };

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-dark)' }}>Add NGX Holding</h3>
          <button onClick={onClose} style={{ background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>
        </div>

        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-section)' }}>
          <button onClick={() => setTab('manual')} style={{ flex:1, padding:'14px', background:'none', border:'none', fontSize:'0.9rem', fontWeight:700, color: tab === 'manual' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'manual' ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all 0.2s' }}>
            Manual Entry
          </button>
          <button onClick={() => setTab('broker')} style={{ flex:1, padding:'14px', background:'none', border:'none', fontSize:'0.9rem', fontWeight:700, color: tab === 'broker' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === 'broker' ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all 0.2s' }}>
            Link Brokerage
          </button>
        </div>

        {tab === 'manual' ? (
          <form onSubmit={submit} style={{ padding:'24px' }}>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Ticker Symbol</label>
              <div style={{ position:'relative' }}>
                <Search size={14} color="var(--text-light)" style={{ position:'absolute', left:'14px', top:'14px' }}/>
                <input value={sym} onChange={e=>setSym(e.target.value)} placeholder="e.g. MTNN" style={{ width:'100%', padding:'12px 14px 12px 38px', borderRadius:'12px', border:'1.5px solid var(--border)', fontSize:'0.95rem', fontWeight:600, color:'var(--text-dark)', textTransform:'uppercase', outline:'none' }}/>
              </div>
              <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                {['MTNN','ZENITHBANK','DANGCEM'].map(s => (
                  <button key={s} type="button" onClick={()=>setSym(s)} style={{ background:'var(--bg-section)', border:'none', padding:'4px 10px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', cursor:'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
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
              <button type="button" onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:'12px', background:'var(--bg-alt)', border:'1px solid var(--primary)', color:'var(--primary)', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={isAdding} style={{ flex:1.5, padding:'14px', borderRadius:'12px', background:'var(--primary)', border:'none', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:isAdding ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 20px rgba(15, 82, 87, 0.2)' }}>
                {isAdding ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Add Holding'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding:'32px 24px', textAlign:'center' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'20px', background:'var(--primary-50)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:'1px solid var(--primary-100)' }}>
              <LinkIcon size={28} color="var(--primary)" />
            </div>
            <h4 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'12px' }}>Connect Your Broker</h4>
            <p style={{ color:'var(--text-muted)', fontSize:'0.95rem', lineHeight:1.6, marginBottom:'24px' }}>
              Automatically sync your portfolio and trades by linking your CSCS account or supported Nigerian brokerages.
            </p>
            <button type="button" style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'var(--primary)', border:'none', color:'white', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(15, 82, 87, 0.25)' }}>
              Coming Soon
            </button>
            <p style={{ fontSize:'0.8rem', color:'var(--text-light)', marginTop:'16px' }}>Secure, read-only access powered by Mono</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Hub ─────────────────────────────────────────────── */
export default function Portfolio() {
  const { user } = useAuth();
  
  // Try to hydrate from localStorage cache for instant render
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_portfolio_cache_v9');
      if (cached) return JSON.parse(cached)?.data || null;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(!data); // Only show skeleton if no cached data
  const [error, setError] = useState(null);

  const location = useLocation();
  const getTabFromHash = (hash) => {
    const h = hash.replace('#', '');
    if (h.startsWith('stock-')) return h;
    return ['overview', 'market', 'watchlist', 'zakat', 'purification', 'shariah', 'about'].includes(h) ? h : 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromHash(location.hash));
  const [mountedTabs, setMountedTabs] = useState([activeTab]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sync tab with URL hash if it changes
  useEffect(() => {
    setActiveTab(getTabFromHash(location.hash));
  }, [location.hash]);

  // Keep tabs mounted once they've been visited for instant switching
  useEffect(() => {
    if (!mountedTabs.includes(activeTab) && !activeTab.startsWith('stock-')) {
      setMountedTabs(prev => [...prev, activeTab]);
    }
  }, [activeTab, mountedTabs]);

  // Update URL hash when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  };

  const loadData = () => {
    if (!data) setLoading(true);
    setError(null);
    fetchPortfolio()
      .then(r => setData(r.data))
      .catch(e => { if (!data) setError(e?.message || 'Failed to load portfolio'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (payload) => {
    try {
      setIsAdding(true);
      await addHolding(payload);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err?.message || 'Failed to add holding');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeHolding(id);
      loadData();
    } catch (err) {
      alert(err?.message || 'Failed to remove holding');
    }
  };

  if (loading) return <Skeleton />;
  if (error) return (
    <div style={{ textAlign:'center', padding:'100px 20px' }}>
      <h3 style={{ color:'var(--non-halal)', marginBottom:'10px' }}>Error Loading Portfolio</h3>
      <p style={{ color:'var(--text-muted)', marginBottom:'20px' }}>{error}</p>
      <button onClick={loadData} className="btn-primary">Try Again</button>
    </div>
  );

  const tabs = [
    { id: 'overview',     label: 'Overview' },
    { id: 'market',       label: 'Market Screener' },
    { id: 'watchlist',    label: 'Watchlist' },
    { id: 'zakat',        label: 'Zakat' },
    { id: 'purification', label: 'Purification' },
    { id: 'shariah',      label: 'Shariah' },

    { id: 'about',        label: 'About' }
  ];

  // Compute sidebar data
  const holdings = data?.holdings || [];
  const summary = data?.summary || {};
  const totalBalance = summary.total_balance || 0;
  
  const PIE_COLORS = ['#C9B89C','#2A6F73','#3B82F6','#8b5cf6','#0F5257','#06b6d4'];
  const pieData = holdings.slice(0,6).map((h,i) => ({
    name: h.symbol, value: h.total_value || 0, color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (pieData.length === 0) pieData.push({ name: 'No Holdings', value: 1, color: '#e5e7eb' });

  const halalCount    = holdings.filter(h => h.is_halal).length;
  const nonHalalCount = holdings.filter(h => !h.is_halal).length;
  const needsPurif    = holdings.filter(h => h.purification_due > 0).length;

  const MOCK_PERF = [];

  const fmtK = (n) => {
    const v = Number(n||0);
    if (v >= 1_000_000_000) return `₦${(v/1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000)     return `₦${(v/1_000_000).toFixed(2)}M`;
    if (v >= 1_000)         return `₦${(v/1_000).toFixed(1)}K`;
    return `₦${Number(v).toLocaleString('en-NG',{maximumFractionDigits:0})}`;
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} isAdding={isAdding} />}

      {/* Header & Tabs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '10px' }}>Hub</div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-dark)', lineHeight: 1.1 }}>
              Portfolio & Tools
            </h1>
          </div>
        </div>

        {/* Custom Nav Bar */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '0', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 20px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═ Two-column layout ═ */}
      <div className="portfolio-layout-grid">
        
        {/* Tab Content Rendering (Left Side) */}
        <div style={{ minWidth: 0 }}>
          {mountedTabs.includes('overview') && (
            <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              <OverviewTab data={data} setShowAddModal={setShowAddModal} handleDelete={handleDelete} changeTab={handleTabChange} refreshData={loadData} />
            </div>
          )}
          {mountedTabs.includes('market') && (
            <div style={{ display: activeTab === 'market' ? 'block' : 'none' }}>
              <MarketTab />
            </div>
          )}
          {mountedTabs.includes('watchlist') && (
            <div style={{ display: activeTab === 'watchlist' ? 'block' : 'none' }}>
              <WatchlistTab />
            </div>
          )}
          {mountedTabs.includes('zakat') && (
            <div style={{ display: activeTab === 'zakat' ? 'block' : 'none' }}>
              <ZakatTab data={data} />
            </div>
          )}
          {mountedTabs.includes('purification') && (
            <div style={{ display: activeTab === 'purification' ? 'block' : 'none' }}>
              <PurificationTab data={data} />
            </div>
          )}
          {mountedTabs.includes('shariah') && (
            <div style={{ display: activeTab === 'shariah' ? 'block' : 'none' }}>
              <ShariahPage />
            </div>
          )}

          {mountedTabs.includes('about') && (
            <div style={{ display: activeTab === 'about' ? 'block' : 'none' }}>
              <AboutPage />
            </div>
          )}
          {activeTab.startsWith('stock-') && (
            <div style={{ display: 'block' }}>
              <StockDetails key={activeTab} symbol={activeTab.replace('stock-', '')} />
            </div>
          )}
        </div>

        {/* ── Right Sidebar (Always Visible) ── */}
        <div className="stagger-3" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Pie Chart */}
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'20px', padding:'22px', boxShadow:'var(--shadow-sm)' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'18px', display:'flex', alignItems:'center', gap:'7px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--primary)' }}/> Allocation
            </h3>
            {holdings.length === 0 ? (
              <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-light)', fontSize:'0.85rem' }}>No data yet</div>
            ) : (
              <>
                <div style={{ height:'160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={3}>
                        {pieData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v) => [fmtK(v),'Value']} contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'16px' }}>
                  {pieData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.76rem', fontWeight:600, color:'var(--text-dark)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize:'0.76rem', fontWeight:700, color:'var(--text-muted)' }}>
                        {totalBalance > 0 ? `${((d.value / totalBalance)*100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Shariah Summary */}
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'20px', padding:'22px', boxShadow:'var(--shadow-sm)' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'16px', display:'flex', alignItems:'center', gap:'7px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--primary)' }}/> Shariah Summary
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[
                { label: 'Halal Holdings',   value: halalCount,    color: 'var(--halal)',     bg: 'var(--halal-bg)' },
                { label: 'Non-Halal',        value: nonHalalCount, color: 'var(--non-halal)', bg: 'var(--non-halal-bg)' },
                { label: 'Need Purification',value: needsPurif,    color: 'var(--doubtful)',  bg: 'var(--doubtful-bg)' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'11px', background:row.bg }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:600, color:row.color }}>{row.label}</span>
                  <span style={{ fontSize:'1rem', fontWeight:900, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            
            {activeTab !== 'market' && (
              <button onClick={() => handleTabChange('market')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', padding:'11px 14px', borderRadius:'12px', background:'var(--primary-50)', color:'var(--primary)', border:'none', width:'100%', cursor:'pointer', transition:'all 0.2s' }}>
                <span style={{ fontSize:'0.82rem', fontWeight:700 }}>Screen more stocks</span>
                <span style={{ fontSize:'1rem' }}>→</span>
              </button>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
