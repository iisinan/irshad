import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPortfolio, addHolding, removeHolding, fetchNgxStocks, formatLogoUrl } from '../services/api';
import { toastError, toastSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { X, Search, LayoutDashboard, BarChart2, Star, Calculator, ShieldCheck, BookOpen, Info, Landmark, Briefcase, Bell, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import PortfolioTab from './portfolio/PortfolioTab';
import MarketTab from './portfolio/MarketTab';
import WatchlistTab from './portfolio/WatchlistTab';
import ZakatTab from './portfolio/ZakatTab';
import PurificationTab from './portfolio/PurificationTab';
import LecturesTab from './portfolio/LecturesTab';
import BasketsTab from './portfolio/BasketsTab';

import AddHoldingModal from "./portfolio/AddHoldingModal";

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
          <div key={i} style={{background: 'var(--bg)',borderRadius:'20px',padding:'24px',height:'130px',border:'1px solid var(--border)'}}>
            <div style={{...sh,width:'36px',height:'36px',borderRadius:'10px',marginBottom:'16px'}}/>
            <div style={{...sh,width:'110px',height:'32px',marginBottom:'8px'}}/>
            <div style={{...sh,width:'80px',height:'13px'}}/>
          </div>
        ))}
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
      const cached = localStorage.getItem('irshad_portfolio_cache_v10');
      if (cached) return JSON.parse(cached)?.data || null;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(!data); // Only show skeleton if no cached data
  const [error, setError] = useState(null);

  const location = useLocation();
  const getTabFromHash = (hash) => {
    const h = hash.replace('#', '');
    return ['portfolio', 'market', 'watchlist', 'zakat', 'purification', 'lectures', 'baskets'].includes(h) ? h : 'portfolio';
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

  const loadData = (silent = false) => {
    if (!data && !silent) setLoading(true);
    if (!silent) setError(null);
    fetchPortfolio()
      .then(r => setData(r.data))
      .catch(e => { if (!data && !silent) setError(e?.message || 'Failed to load portfolio'); })
      .finally(() => { if(!silent) setLoading(false); });
  };

  useEffect(() => { 
    loadData(); 
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (payload) => {
    try {
      setIsAdding(true);
      const { addBulkHoldings } = await import('../services/api');
      await addBulkHoldings(payload);
      setShowAddModal(false);
      loadData();
      toastSuccess('Holdings added to portfolio');
    } catch (err) {
      toastError(err?.message || 'Failed to add holdings');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeHolding(id);
      loadData();
      toastSuccess('Holding removed');
    } catch (err) {
      toastError(err?.message || 'Failed to remove holding');
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
    { id: 'portfolio',    label: 'Portfolio',       icon: Briefcase },
    { id: 'market',       label: 'Market Screener', icon: BarChart2 },
    { id: 'watchlist',    label: 'Watchlist',       icon: Star },
    { id: 'zakat',        label: 'Zakat',           icon: Calculator },
    { id: 'purification', label: 'Purification',    icon: ShieldCheck },
    { id: 'lectures',     label: 'Resources',       icon: BookOpen },
    { id: 'baskets',      label: 'Thematic Baskets',icon: Briefcase }
  ];

  // Compute sidebar data
  const holdings = data?.holdings || [];
  const summary = data?.summary || {};
  const totalBalance = summary.total_balance || 0;
  
  const PIE_COLORS = ['#C9B89C','#2A6F73','#3B82F6','#8b5cf6','#0F5257','#06b6d4'];
  const pieData = (holdings || []).slice(0,6).map((h,i) => ({
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
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 24px 80px' }}>
      {showAddModal && (
        <AddHoldingModal 
          initialTab={typeof showAddModal === 'string' ? showAddModal : 'manual'}
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAdd} 
          isAdding={isAdding} 
          onBrokerLinked={() => loadData(true)} // instantly reload when broker seeded
        />
      )}

      {/* Header & Tabs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '12px', background: 'var(--primary-50)', color: 'var(--primary)', border: 'none' }}>Personal Hub</div>
            <h1 style={{ fontSize: '2.46rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-dark)', lineHeight: 1.1 }}>
              Portfolio & Tools
            </h1>
            {totalBalance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Value:</span>
                <span style={{ fontSize: '0.97rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>{fmtK(totalBalance)}</span>
                {holdings.length > 0 && (
                  <span style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '2px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    {holdings.length} holdings
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 22px', borderRadius: '14px',
              background: 'var(--primary)', color: 'var(--bg)', border: 'none',
              fontWeight: 800, fontSize: '0.79rem', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(15,82,87,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(15,82,87,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(15,82,87,0.25)'; }}
          >
            <Search size={15} style={{ display: 'none' }} /> <span style={{ fontSize: '0.97rem', lineHeight: 1 }}>+</span> Add Holding
          </button>
        </div>

        {/* Custom Nav Bar - Polished Segmented Control Style */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', padding: '6px', overflowX: 'auto', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: isActive ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  padding: '10px 18px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 700,
                  color: isActive ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isActive ? '0 4px 12px rgba(15, 82, 87, 0.25)' : 'none',
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.color = 'var(--text-dark)'; e.currentTarget.style.background = 'var(--bg-section)'; } }}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon size={16} color={isActive ? 'white' : 'currentColor'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═ Two-column layout ═ */}
      <div className="portfolio-layout-grid">
        
        {/* Tab Content Rendering (Left Side) */}
        <div style={{ minWidth: 0 }}>
          {mountedTabs.includes('portfolio') && (
            <div style={{ display: activeTab === 'portfolio' ? 'block' : 'none' }}>
              <PortfolioTab data={data} setShowAddModal={setShowAddModal} handleDelete={handleDelete} changeTab={handleTabChange} refreshData={loadData} />
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
          {mountedTabs.includes('lectures') && (
            <div style={{ display: activeTab === 'lectures' ? 'block' : 'none' }}>
              <LecturesTab />
            </div>
          )}
          {mountedTabs.includes('baskets') && (
            <div style={{ display: activeTab === 'baskets' ? 'block' : 'none' }}>
              <BasketsTab />
            </div>
          )}

        </div>

        {/* ── Right Sidebar (Always Visible) ── */}
        <div className="stagger-3" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Pie Chart */}
          <div style={{ background: 'var(--bg)', border:'1px solid var(--border)', borderRadius:'24px', padding:'26px', boxShadow:'var(--shadow-sm)', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', position:'relative', zIndex:1 }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight:800, color:'var(--text-dark)', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--primary)' }}/> Allocation
              </h3>
              {holdings.length > 0 && (
                <span style={{ fontSize: '0.66rem', fontWeight:800, color:'var(--text-muted)' }}>{fmtK(totalBalance)}</span>
              )}
            </div>
            {holdings.length === 0 ? (
              <div style={{ height:'180px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize: '0.79rem', fontWeight:600, background:'linear-gradient(180deg, var(--bg-section) 0%, #ffffff 100%)', borderRadius:'16px', border:'1.5px dashed var(--border)' }}>
                <Activity size={28} style={{ marginBottom:'12px', opacity:0.3, color:'var(--primary)' }} />
                <span>No allocation data</span>
              </div>
            ) : (
              <>
                <div style={{ height:'160px', position:'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {pieData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v) => [fmtK(v),'Value']} contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize: '0.69rem', fontWeight:700 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginTop:'18px' }}>
                  {pieData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize: '0.7rem', fontWeight:700, color:'var(--text-dark)' }}>{d.name}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'50px', height:'4px', borderRadius:'2px', background:'var(--bg-section)', overflow:'hidden' }}>
                          <div style={{ width:`${totalBalance > 0 ? ((d.value / totalBalance)*100) : 0}%`, height:'100%', background:d.color, borderRadius:'2px' }}/>
                        </div>
                        <span style={{ fontSize: '0.69rem', fontWeight:800, color:'var(--text-muted)', minWidth:'32px', textAlign:'right' }}>
                          {totalBalance > 0 ? `${((d.value / totalBalance)*100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Shariah Summary */}
          <div style={{ background: 'var(--bg)', border:'1px solid var(--border)', borderRadius:'24px', padding:'26px', boxShadow:'var(--shadow-sm)', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px', position:'relative', zIndex:1 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--halal)', boxShadow:'0 0 10px rgba(34,197,94,0.4)' }}/> Shariah Health
            </h3>
            
            {/* Compliance Score Bar */}
            {(holdings || []).length > 0 && (
              <div style={{ marginBottom:'18px', padding:'16px', background:'var(--bg-section)', borderRadius:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize: '0.69rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Compliance Score</span>
                  <span style={{ fontSize: '0.79rem', fontWeight:900, color: halalCount === (holdings || []).length ? 'var(--halal)' : nonHalalCount > 0 ? 'var(--non-halal)' : 'var(--doubtful)' }}>
                    {(holdings || []).length > 0 ? `${Math.round((halalCount / (holdings || []).length) * 100)}%` : '—'}
                  </span>
                </div>
                <div style={{ height:'8px', background:'var(--border)', borderRadius:'4px', overflow:'hidden' }}>
                  <div style={{ 
                    width: (holdings || []).length > 0 ? `${(halalCount / (holdings || []).length) * 100}%` : '0%',
                    height:'100%',
                    background: halalCount === (holdings || []).length ? 'var(--halal)' : 'var(--doubtful)',
                    borderRadius:'4px',
                    transition:'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}/>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[
                { label: 'Halal Holdings',   value: halalCount,    color: 'var(--halal)',     bg: 'var(--halal-bg)',     border: 'var(--halal-border)' },
                { label: 'Non-Halal',        value: nonHalalCount, color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', border: 'var(--non-halal-border)' },
                { label: 'Need Purification',value: needsPurif,    color: 'var(--doubtful)',  bg: 'var(--doubtful-bg)',  border: 'var(--doubtful-border)' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'12px', background:row.bg, border:`1px solid ${row.border}` }}>
                  <span style={{ fontSize: '0.72rem', fontWeight:700, color:row.color }}>{row.label}</span>
                  <span style={{ fontSize: '0.97rem', fontWeight:900, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            
            {activeTab !== 'market' && (
              <button onClick={() => handleTabChange('market')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', padding:'12px 14px', borderRadius:'12px', background:'var(--primary-50)', color:'var(--primary)', border:'1px solid var(--primary-100)', width:'100%', cursor:'pointer', transition:'all 0.2s' }}>
                <span style={{ fontSize: '0.75rem', fontWeight:800 }}>Screen more stocks</span>
                <BarChart2 size={14} />
              </button>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
