import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPortfolio, addHolding, removeHolding, fetchNgxStocks } from '../services/api';
import { toastError, toastSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { X, Search, LayoutDashboard, BarChart2, Star, Calculator, ShieldCheck, BookOpen, Info, Landmark, Briefcase, Bell, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import OverviewTab from './portfolio/OverviewTab';
import MarketTab from './portfolio/MarketTab';
import WatchlistTab from './portfolio/WatchlistTab';
import ZakatTab from './portfolio/ZakatTab';
import PurificationTab from './portfolio/PurificationTab';
import LecturesTab from './portfolio/LecturesTab';
import BasketsTab from './portfolio/BasketsTab';


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
function AddModal({ onClose, onAdd, isAdding, onBrokerLinked }) {
  const [tab, setTab] = useState('manual');
  
  // Rows for bulk add
  const [rows, setRows] = useState([{ id: Date.now(), sym: '', sh: '', pr: '' }]);
  const [activeRowId, setActiveRowId] = useState(null);

  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  
  // Broker State
  const [linking, setLinking] = useState(false);
  const [brokerName, setBrokerName] = useState('Meristem');
  const [linkMessage, setLinkMessage] = useState('');

  useEffect(() => {
    fetchNgxStocks().then(res => setAllStocks(res.data || [])).catch(console.error);
  }, []);

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    
    if (field === 'sym') {
      const val = value.toUpperCase();
      if (val.length > 0) {
        const filtered = allStocks.filter(s => s.symbol.includes(val) || s.name.toUpperCase().includes(val)).slice(0, 5);
        setFilteredStocks(filtered);
        setActiveRowId(id);
      } else {
        setActiveRowId(null);
      }
    }
  };

  const selectSymbolForRow = (id, s) => {
    let priceToFill = '';
    const match = allStocks.find(x => x.symbol === s);
    if (match) {
      const latestPrice = match.daily_prices?.[0]?.price || match.latest_price;
      if (latestPrice) priceToFill = Number(latestPrice).toFixed(2);
    }
    setRows(prev => prev.map(r => r.id === id ? { ...r, sym: s, pr: priceToFill || r.pr } : r));
    setActiveRowId(null);
  };

  const addRow = () => setRows(prev => [...prev, { id: Date.now(), sym: '', sh: '', pr: '' }]);
  const removeRow = (id) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const totalCost = rows.reduce((acc, r) => acc + ((Number(r.sh)||0) * (Number(r.pr)||0)), 0);

  const submit = (e) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.sym && r.sh && r.pr);
    if (validRows.length === 0) return toastError('Fill at least one complete holding row.');
    
    const holdings = validRows.map(r => ({
      symbol: r.sym.toUpperCase(),
      shares: Number(r.sh),
      average_buy_price: Number(r.pr)
    }));
    onAdd(holdings);
  };

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-dark)' }}>Add Holding</h3>
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
          <form onSubmit={submit} style={{ padding:'24px', maxHeight:'65vh', overflowY:'auto' }}>
            {rows.map((row, index) => (
              <div key={row.id} style={{ background:'var(--bg)', padding:'16px', borderRadius:'16px', marginBottom:'16px', border:'1px solid var(--border)', position:'relative' }}>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(row.id)} style={{ position:'absolute', top:'12px', right:'12px', background:'var(--bg-section)', border:'none', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer', zIndex:5 }}><X size={14}/></button>
                )}
                
                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Ticker Symbol</label>
                  <div style={{ position:'relative' }}>
                    <Search size={16} color="var(--text-light)" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }}/>
                    <input 
                      value={row.sym} 
                      onChange={e => handleRowChange(row.id, 'sym', e.target.value)} 
                      onFocus={() => { if(row.sym) setActiveRowId(row.id); }}
                      onBlur={() => setTimeout(() => setActiveRowId(null), 200)}
                      placeholder="e.g. MTNN" 
                      style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:'12px', border:'2px solid var(--border)', fontSize:'0.95rem', fontWeight:700, color:'var(--text-dark)', textTransform:'uppercase', outline:'none', transition:'border-color 0.2s', background:'white' }}
                      onFocusCapture={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlurCapture={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    {activeRowId === row.id && filteredStocks.length > 0 && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:'12px', zIndex:10, boxShadow:'0 12px 32px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.2s ease' }}>
                        {filteredStocks.map(stock => (
                          <div 
                            key={stock.symbol} 
                            onClick={() => selectSymbolForRow(row.id, stock.symbol)}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--bg-section)', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            <div>
                              <div style={{ fontWeight:800, color:'var(--text-dark)' }}>{stock.symbol}</div>
                              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{stock.name}</div>
                            </div>
                            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--primary)' }}>
                              ₦{Number(stock.daily_prices?.[0]?.price || stock.latest_price || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Shares</label>
                    <input type="number" value={row.sh} onChange={e=>handleRowChange(row.id, 'sh', e.target.value)} placeholder="0" min="0" step="any" style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'2px solid var(--border)', fontSize:'0.95rem', fontWeight:700, outline:'none', background:'white' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Avg Price (₦)</label>
                    <input type="number" value={row.pr} onChange={e=>handleRowChange(row.id, 'pr', e.target.value)} placeholder="0.00" min="0" step="any" style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'2px solid var(--border)', fontSize:'0.95rem', fontWeight:700, outline:'none', background:'white' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addRow} style={{ width:'100%', padding:'12px', borderRadius:'14px', background:'var(--primary-50)', border:'1px dashed var(--primary)', color:'var(--primary)', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', marginBottom:'24px', transition:'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-100)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-50)'}>
              + Add Another Holding
            </button>

            {/* Live Total Cost Calculation */}
            <div style={{ background:'var(--primary-50)', border:'1px solid var(--primary-100)', borderRadius:'12px', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--primary)' }}>Estimated Total Cost</span>
              <span style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--primary)' }}>
                ₦{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button type="button" onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:'14px', background:'white', border:'2px solid var(--border)', color:'var(--text-dark)', fontWeight:700, fontSize:'0.95rem', cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={isAdding} style={{ flex:2, padding:'14px', borderRadius:'14px', background:'var(--primary)', border:'none', color:'white', fontWeight:700, fontSize:'0.95rem', cursor:isAdding ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 20px rgba(15, 82, 87, 0.25)', opacity: isAdding ? 0.7 : 1 }}>
                {isAdding ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Add to Portfolio'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Widget Header */}
            <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--halal-bg)', color: 'var(--halal)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
                <Lock size={14} /> End-to-End Encrypted
              </div>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                Link your Broker
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                Connect your brokerage account to Irshad to seamlessly track your Shariah-compliant investments and receive a ₦1M simulated balance.
              </p>
            </div>

            {/* Widget Body */}
            <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
              
              {linkMessage && (
                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: linkMessage.includes('successfully') ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: linkMessage.includes('successfully') ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} /> {linkMessage}
                </div>
              )}

              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Select an Institution</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {['Meristem', 'Stanbic IBTC', 'CSCS', 'Risevest'].map((broker) => (
                  <div 
                    key={broker}
                    onClick={() => setBrokerName(broker)}
                    style={{
                      padding: '20px', borderRadius: '16px', border: brokerName === broker ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: brokerName === broker ? 'var(--primary-50)' : 'white', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      transition: 'all 0.2s', boxShadow: brokerName === broker ? '0 4px 12px rgba(15, 82, 87, 0.1)' : 'none'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                      {broker.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{broker}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Widget Footer */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'white' }}>
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    setLinking(true);
                    setLinkMessage('');
                    const { linkBroker } = await import('../services/api');
                    const res = await linkBroker(brokerName);
                    setLinkMessage(res.message || 'Broker linked successfully!');
                    if (onBrokerLinked) onBrokerLinked();
                    setTimeout(() => {
                      onClose();
                    }, 1500);
                  } catch(err) {
                    setLinkMessage(err.response?.data?.message || 'Failed to link broker.');
                  } finally {
                    setLinking(false);
                  }
                }}
                disabled={linking || !brokerName}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--primary)', 
                  border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem', 
                  cursor: (linking || !brokerName) ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                  boxShadow: '0 8px 24px rgba(15, 82, 87, 0.25)', opacity: (linking || !brokerName) ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {linking ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : 'Continue'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> Secured by Irshad OpenBanking
              </div>
            </div>

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
    return ['overview', 'market', 'watchlist', 'zakat', 'purification', 'lectures', 'baskets'].includes(h) ? h : 'overview';
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
    { id: 'overview',     label: 'Overview',        icon: LayoutDashboard },
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
        <AddModal 
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
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-dark)', lineHeight: 1.1 }}>
              Portfolio & Tools
            </h1>
            {totalBalance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Value:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>{fmtK(totalBalance)}</span>
                {holdings.length > 0 && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '2px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
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
              background: 'var(--primary)', color: 'white', border: 'none',
              fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(15,82,87,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(15,82,87,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(15,82,87,0.25)'; }}
          >
            <Search size={15} style={{ display: 'none' }} /> <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Holding
          </button>
        </div>

        {/* Custom Nav Bar - Polished Segmented Control Style */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', padding: '6px', overflowX: 'auto', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
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
                  fontSize: '0.85rem',
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
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'24px', padding:'26px', boxShadow:'var(--shadow-sm)', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', position:'relative', zIndex:1 }}>
              <h3 style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--primary)' }}/> Allocation
              </h3>
              {holdings.length > 0 && (
                <span style={{ fontSize:'0.75rem', fontWeight:800, color:'var(--text-muted)' }}>{fmtK(totalBalance)}</span>
              )}
            </div>
            {holdings.length === 0 ? (
              <div style={{ height:'180px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.9rem', fontWeight:600, background:'linear-gradient(180deg, var(--bg-section) 0%, #ffffff 100%)', borderRadius:'16px', border:'1.5px dashed var(--border)' }}>
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
                      <Tooltip formatter={(v) => [fmtK(v),'Value']} contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginTop:'18px' }}>
                  {pieData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-dark)' }}>{d.name}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'50px', height:'4px', borderRadius:'2px', background:'var(--bg-section)', overflow:'hidden' }}>
                          <div style={{ width:`${totalBalance > 0 ? ((d.value / totalBalance)*100) : 0}%`, height:'100%', background:d.color, borderRadius:'2px' }}/>
                        </div>
                        <span style={{ fontSize:'0.78rem', fontWeight:800, color:'var(--text-muted)', minWidth:'32px', textAlign:'right' }}>
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
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'24px', padding:'26px', boxShadow:'var(--shadow-sm)', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px', position:'relative', zIndex:1 }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--halal)', boxShadow:'0 0 10px rgba(34,197,94,0.4)' }}/> Shariah Health
            </h3>
            
            {/* Compliance Score Bar */}
            {(holdings || []).length > 0 && (
              <div style={{ marginBottom:'18px', padding:'16px', background:'var(--bg-section)', borderRadius:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Compliance Score</span>
                  <span style={{ fontSize:'0.9rem', fontWeight:900, color: halalCount === (holdings || []).length ? 'var(--halal)' : nonHalalCount > 0 ? 'var(--non-halal)' : 'var(--doubtful)' }}>
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
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:row.color }}>{row.label}</span>
                  <span style={{ fontSize:'1.1rem', fontWeight:900, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            
            {activeTab !== 'market' && (
              <button onClick={() => handleTabChange('market')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', padding:'12px 14px', borderRadius:'12px', background:'var(--primary-50)', color:'var(--primary)', border:'1px solid var(--primary-100)', width:'100%', cursor:'pointer', transition:'all 0.2s' }}>
                <span style={{ fontSize:'0.85rem', fontWeight:800 }}>Screen more stocks</span>
                <BarChart2 size={14} />
              </button>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
