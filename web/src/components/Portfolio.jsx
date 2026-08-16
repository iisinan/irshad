import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPortfolio, removeHolding } from '../services/api';
import { toastError, toastSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import localforage from 'localforage';
import { Search, BarChart2, Star, Calculator, ShieldCheck, BookOpen, Briefcase, Activity, FileText, Rss, CheckCircle2, XCircle, AlertTriangle, Droplet, HelpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import PortfolioTab from './portfolio/PortfolioTab';
import MarketTab from './portfolio/MarketTab';
import WatchlistTab from './portfolio/WatchlistTab';
import ZakatTab from './portfolio/ZakatTab';
import PurificationTab from './portfolio/PurificationTab';
import LecturesTab from './portfolio/LecturesTab';
import StatementTab from './portfolio/StatementTab';
import UpdatesTab from './portfolio/UpdatesTab';
import GuideTab from './portfolio/GuideTab';

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
  const { user, setUser } = useAuth();
  
  // Try to hydrate from localforage cache for instant render
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    localforage.getItem('irshad_portfolio_cache').then(cached => {
      if (cached && !data) {
        setData(cached.data || null);
        setLoading(false);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [error, setError] = useState(null);

  const location = useLocation();
  const getTabFromHash = (hash) => {
    const h = hash.replace('#', '');
    return ['holdings', 'market', 'watchlist', 'zakat', 'purification', 'lectures', 'statement', 'updates', 'guide'].includes(h) ? h : 'holdings';
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromHash(location.hash));
  const [mountedTabs, setMountedTabs] = useState([activeTab]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [initialHoldingSymbol, setInitialHoldingSymbol] = useState(null);

  // Auto-open add modal or purification modal if navigated with state
  useEffect(() => {
    if (location.state?.action) {
      if (location.state.targetSymbol) {
        setInitialHoldingSymbol(location.state.targetSymbol);
      }
      
      if (location.state.action === 'add') {
        setShowAddModal('manual');
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const loadData = async (silent = false) => {
    if (!data && !silent) setLoading(true);
    if (!silent) setError(null);
    
    try {
      const { fetchUpdatesNews, fetchNgxStocks } = await import('../services/api');
      const api = (await import('../services/api')).default;

      const [portfolioRes, newsRes, resourcesRes, marketRes] = await Promise.allSettled([
        fetchPortfolio(),
        fetchUpdatesNews(),
        api.get('/resources'),
        fetchNgxStocks(),
      ]);

      if (portfolioRes.status === 'fulfilled') {
        setData(portfolioRes.value.data);
      } else {
        if (!data && !silent) setError(portfolioRes.reason?.message || 'Failed to load portfolio');
      }

      // Pre-warm caches so tabs render instantly
      if (newsRes.status === 'fulfilled') {
        localforage.setItem('irshad_updates_news_cache', newsRes.value.data);
      }
      if (resourcesRes.status === 'fulfilled') {
        localforage.setItem('irshad_resources_cache', resourcesRes.value.data.data);
      }
      if (marketRes.status === 'fulfilled') {
        const val = Array.isArray(marketRes.value) ? marketRes.value : (marketRes.value?.data || []);
        localStorage.setItem('irshad_market_v2', JSON.stringify(val));
      }

    } catch (e) {
      if (!data && !silent) setError(e?.message || 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { 
    setData(null);
    setLoading(true);
    loadData(); 
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAdd = async (payload) => {
    try {
      setIsAdding(true);
      const { addBulkHoldings } = await import('../services/api');
      await addBulkHoldings(payload);
      loadData();
      toastSuccess('Holdings added to portfolio');
      return true;
    } catch (err) {
      toastError(err?.message || 'Failed to add holdings');
      return false;
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

  const handleResend = async () => {
    setResendingEmail(true);
    setResendMessage('');
    try {
      const api = (await import('../services/api')).default;
      const res = await api.post('/email/resend');
      setResendMessage(res.data?.message || 'Verification link sent! Check your inbox.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Failed to resend. Please try again.');
    }
    setResendingEmail(false);
  };

  if (user && !user.email_verified_at) {
    return (
      <div style={{ textAlign:'center', padding:'100px 20px', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ background: 'var(--primary-50)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={32} color="var(--primary)" />
        </div>
        <h3 style={{ color:'var(--text-dark)', marginBottom:'10px' }}>Verification Required</h3>
        <p style={{ color:'var(--text-muted)', marginBottom:'24px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
          Please verify your email address to unlock your portfolio and access market data. Check your inbox for the verification link.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleResend} 
            disabled={resendingEmail}
            className="btn-primary"
          >
            {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
          </button>
          {resendMessage && (
            <p style={{ fontSize: '0.85rem', color: resendMessage.includes('Failed') ? 'var(--non-compliant)' : 'var(--primary)', margin: 0 }}>
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (loading) return <Skeleton />;
  
  if (error) return (
    <div style={{ textAlign:'center', padding:'100px 20px' }}>
      <h3 style={{ color:'var(--non-compliant)', marginBottom:'10px' }}>Error Loading Portfolio</h3>
      <p style={{ color:'var(--text-muted)', marginBottom:'20px' }}>{error}</p>
      <button onClick={loadData} className="btn-primary">Try Again</button>
    </div>
  );



  // Compute sidebar data
  const holdings = data?.holdings || [];
  const summary = data?.summary || {};
  const totalBalance = summary.total_balance || 0;
  
  const PIE_COLORS = ['var(--primary)', '#06b6d4', '#f59e0b', '#f43f5e', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
  const pieData = (holdings || []).map((h,i) => ({
    name: h.symbol, value: h.total_value || 0, color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (pieData.length === 0) pieData.push({ name: 'No Holdings', value: 1, color: 'var(--border)' });

  const isHoldingHalal = h => !!h.is_halal || ['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(h.symbol);
  const needsPurif = holdings.filter(h => isHoldingHalal(h) && (Number(h.purification_due || 0) > 0 || Number(h.non_compliant_ratio || 0) > 0)).length;
  const halalCount = holdings.filter(isHoldingHalal).length - needsPurif;
  const doubtfulCount = holdings.filter(h => h.status === 'doubtful').length;
  const nonHalalCount = holdings.filter(h => !isHoldingHalal(h) && h.status !== 'doubtful').length;


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
          initialSymbol={initialHoldingSymbol}
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAdd} 
          isAdding={isAdding} 
          onBrokerLinked={() => loadData(true)} // instantly reload when broker seeded
        />
      )}

      {/* Header & Tabs removed as per user request to clean up top-level redundant titles */}

      {/* ═ Layout ═ */}
      <div className={`portfolio-layout-grid ${activeTab !== 'holdings' ? 'single-column' : ''}`}>
        
        {/* Tab Content Rendering (Left Side) */}
        <div style={{ minWidth: 0 }}>
          {mountedTabs.includes('holdings') && (
            <div style={{ display: activeTab === 'holdings' ? 'block' : 'none' }}>
              <PortfolioTab 
                data={data}
                setShowAddModal={setShowAddModal}
                handleDelete={handleDelete}
                refreshData={loadData}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
            </div>
          )}
          {mountedTabs.includes('market') && (
            <div style={{ display: activeTab === 'market' ? 'block' : 'none' }}>
              <MarketTab />
            </div>
          )}
          {mountedTabs.includes('watchlist') && (
            <div style={{ display: activeTab === 'watchlist' ? 'block' : 'none' }}>
              <WatchlistTab data={data} refreshData={loadData} initialSymbol={initialHoldingSymbol} onClearInitialSymbol={() => setInitialHoldingSymbol(null)} />
            </div>
          )}
          {mountedTabs.includes('zakat') && (
            <div style={{ display: activeTab === 'zakat' ? 'block' : 'none' }}>
              <ZakatTab data={data} />
            </div>
          )}
          {mountedTabs.includes('purification') && (
            <div style={{ display: activeTab === 'purification' ? 'block' : 'none' }}>
              <PurificationTab data={data} initialSymbol={initialHoldingSymbol} refreshData={loadData} onClearInitialSymbol={() => setInitialHoldingSymbol(null)} />
            </div>
          )}
          {mountedTabs.includes('lectures') && (
            <div style={{ display: activeTab === 'lectures' ? 'block' : 'none' }}>
              <LecturesTab />
            </div>
          )}
          {mountedTabs.includes('statement') && (
            <div style={{ display: activeTab === 'statement' ? 'block' : 'none' }}>
              <StatementTab data={data} />
            </div>
          )}
          {mountedTabs.includes('updates') && (
            <div style={{ display: activeTab === 'updates' ? 'block' : 'none' }}>
              <UpdatesTab />
            </div>
          )}
          {mountedTabs.includes('guide') && (
            <div style={{ display: activeTab === 'guide' ? 'block' : 'none' }}>
              <GuideTab />
            </div>
          )}

        </div>

        {/* ── Right Sidebar (Only Visible on Holdings) ── */}
        {activeTab === 'holdings' && (
          <div className="stagger-3" style={{ display:'flex', flexDirection:'column', gap:'18px', position:'sticky', top:'24px' }}>
            {/* Pie Chart */}
          <div style={{ background: 'var(--bg)', border:'1px solid var(--border)', borderRadius:'24px', padding:'26px', boxShadow:'var(--shadow-sm)', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', position:'relative', zIndex:1 }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight:800, color:'var(--text-dark)', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--primary)' }}/> Allocation
              </h3>
            </div>
            {holdings.length === 0 ? (
              <div style={{ height:'180px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize: '0.79rem', fontWeight:600, background:'linear-gradient(180deg, var(--bg-section) 0%, #ffffff 100%)', borderRadius:'16px', border:'1.5px dashed var(--border)' }}>
                <Activity size={28} style={{ marginBottom:'12px', opacity:0.3, color:'var(--primary)' }} />
                <span>No allocation data</span>
              </div>
            ) : (
              <>
                <div style={{ height:'200px', position:'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>{fmtK(totalBalance)}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData.filter(d => d.value > 0).length > 0 ? pieData.filter(d => d.value > 0) : [{name: 'Empty', value: 1, color: 'var(--border)'}]} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} cornerRadius={6} stroke="none">
                        {(pieData.filter(d => d.value > 0).length > 0 ? pieData.filter(d => d.value > 0) : [{name: 'Empty', value: 1, color: 'var(--border)'}]).map((entry,i) => <Cell key={i} fill={entry.color} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.06))' }}/>)}
                      </Pie>
                      <Tooltip formatter={(v) => [fmtK(v),'Value']} contentStyle={{ borderRadius:'12px', border:'1px solid var(--border)', fontSize: '0.75rem', fontWeight:800, boxShadow: 'var(--shadow-md)', padding: '8px 12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="custom-scroll-container" style={{ 
                  display:'flex', flexDirection:'column', gap:'8px', marginTop:'16px', maxHeight:'280px', paddingRight:'6px', paddingBottom: '30px',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                }}>
                  {pieData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '6px 0', borderBottom: i !== pieData.length - 1 ? '1px solid var(--border-light)' : 'none', flexShrink: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'12px', height:'12px', borderRadius:'4px', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize: '0.75rem', fontWeight:700, color:'var(--text-dark)' }}>{d.name}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'50px', height:'6px', borderRadius:'3px', background:'var(--bg-section)', overflow:'hidden' }}>
                          <div style={{ width:`${totalBalance > 0 ? ((d.value / totalBalance)*100) : 0}%`, height:'100%', background:d.color, borderRadius:'3px' }}/>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight:800, color:'var(--text-muted)', minWidth:'36px', textAlign:'right' }}>
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
            


            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { label: 'Shariah Compliant',   value: halalCount,    icon: ShieldCheck,   color: 'var(--halal)',     bg: 'rgba(34,197,94,0.06)', action: () => { setActiveFilter('halal'); handleTabChange('holdings'); } },
                { label: 'Shariah Compliant (Purify)',value: needsPurif,    icon: Droplet, color: 'var(--doubtful)',  bg: 'rgba(234,179,8,0.06)', action: () => { setActiveFilter('purify'); handleTabChange('holdings'); } },
                { label: 'Doubtful',value: doubtfulCount,    icon: HelpCircle, color: '#d97706',  bg: 'rgba(245,158,11,0.06)', action: () => { setActiveFilter('doubtful'); handleTabChange('holdings'); } },
                { label: 'Shariah Non-Compliant',        value: nonHalalCount, icon: XCircle,       color: 'var(--non-compliant)', bg: 'rgba(239,68,68,0.06)', action: () => { setActiveFilter('nonhalal'); handleTabChange('holdings'); } },
              ].filter(r => r.value > 0).map(row => (
                <div 
                  key={row.label} 
                  onClick={row.action}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:'14px', background:row.bg, cursor:'pointer', transition:'all 0.2s', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = row.color; e.currentTarget.style.boxShadow = `0 4px 12px ${row.bg}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color, boxShadow: 'var(--shadow-sm)' }}>
                      <row.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight:700, color:'var(--text-dark)' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight:900, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            
            {activeTab !== 'market' && (
              <button 
                onClick={() => handleTabChange('market')} 
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: '8px', marginTop:'16px', padding:'14px 16px', borderRadius:'14px', background:'var(--primary)', color:'#FFFFFF', border:'none', width:'100%', cursor:'pointer', transition:'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 41, 113, 0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight:800 }}>Screen More Stocks</span>
                <BarChart2 size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        )}
      </div>
      
    </div>
  );
}
