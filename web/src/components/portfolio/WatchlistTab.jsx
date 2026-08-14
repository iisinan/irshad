import React, { useState, useEffect, useMemo, Component } from 'react';
import { Eye, BarChart2, Star, TrendingUp, TrendingDown, Trash2, AlertCircle, HelpCircle, CheckCircle, ChevronRight, Mail, Plus, Bell, Layers, ShieldCheck, Droplet, AlertTriangle } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist, fetchNgxStocks } from '../../services/api';
import CompanyLogo from '../CompanyLogo';
import { toastError, toastSuccess } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import AddWatchlistModal from './AddWatchlistModal';
import WatchlistAlertModal from './WatchlistAlertModal';
import Skeleton from '../ui/Skeleton';

class ModalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Modal crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '100%', wordBreak: 'break-word' }}>
            <h2 style={{ color: 'red', marginTop: 0 }}>Modal Error</h2>
            <p><strong>Message:</strong> {this.state.error?.message}</p>
            <pre style={{ fontSize: '11px', overflowX: 'auto', background: 'var(--bg)', padding: '10px' }}>{this.state.error?.stack}</pre>
            <button onClick={() => { this.setState({hasError:false}); this.props.onClose(); }} style={{ marginTop: '16px', padding: '8px 16px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WatchlistTab({ initialSymbol, onClearInitialSymbol }) {
  const [watchlistItems, setWatchlistItems] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_watchlist_items_cache_v3');
      if (cached) return JSON.parse(cached) || [];
    } catch {}
    return [];
  });
  const [watchlistSymbols, setWatchlistSymbols] = useState(() => watchlistItems.map(i => i.symbol));
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAlertStock, setActiveAlertStock] = useState(null); // holds the stock object for alerts
  const [filter, setFilter] = useState('all'); // all, halal, non-halal
  const [activeView, setActiveView] = useState('assets'); // 'assets' | 'inbox'
  
  const navigate = useNavigate();
  
  // Hydrate from cache for instant render
  const [allStocks, setAllStocks] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_stocks_cache_v10');
      if (cached) {
        const { data, expiry } = JSON.parse(cached);
        if (Date.now() < expiry) return data?.data || [];
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(allStocks.length === 0);

  useEffect(() => {
    if (initialSymbol && allStocks.length > 0) {
      const target = allStocks.find(s => s.symbol === initialSymbol);
      if (target) {
        setActiveAlertStock(target);
      }
    }
  }, [initialSymbol, allStocks]);

  const loadData = async () => {
    try {
      if (allStocks.length === 0) setLoading(true);
      const [wlRes, stocksRes] = await Promise.all([
        fetchWatchlist(),
        fetchNgxStocks()
      ]);
      const newWl = wlRes.map(item => item.symbol);
      setWatchlistItems(wlRes);
      setWatchlistSymbols(newWl);
      localStorage.setItem('irshad_watchlist_items_cache_v3', JSON.stringify(wlRes));
      setAllStocks(stocksRes.data || []);
      localStorage.setItem('irshad_stocks_cache_v10', JSON.stringify({ data: stocksRes, expiry: Date.now() + 1000 * 60 * 60 }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (symbol) => {
    if (!window.confirm(`Are you sure you want to remove ${symbol} from your watchlist?`)) {
      return;
    }
    try {
      await removeFromWatchlist(symbol);
      setWatchlistItems(prev => prev.filter(i => i.symbol !== symbol));
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
      toastSuccess(`Removed ${symbol} from watchlist`);
    } catch (err) {
      console.error(err);
      toastError('Failed to remove from watchlist');
    }
  };

  const handleAlertUpdate = (updatedItem) => {
    setWatchlistItems(prev => prev.map(i => i.symbol === updatedItem.symbol ? { ...i, ...updatedItem } : i));
  };



  const getStatusConfig = (company) => {
    let statusStr = 'DOUBTFUL';
    let cls = 'status-doubtful';
    let icon = <HelpCircle size={12} />;

    const rawStatus = company.status;
    if (typeof rawStatus === 'object' && rawStatus !== null) {
      const s = rawStatus.status?.toLowerCase();
      if (s === 'halal' || s === 'compliant') { statusStr = 'SHARIAH COMPLIANT'; cls = 'status-halal'; icon = <CheckCircle size={12} />; }
      else if (s === 'non-halal' || s === 'non_compliant') { statusStr = 'SHARIAH NON-COMPLIANT'; cls = 'status-non-halal'; icon = <AlertCircle size={12} />; }
    } else if (typeof rawStatus === 'string') {
      const s = rawStatus.toLowerCase();
      if (s === 'compliant' || s === 'halal') { statusStr = 'SHARIAH COMPLIANT'; cls = 'status-halal'; icon = <CheckCircle size={12} />; }
      else if (s === 'non-halal' || s === 'non_compliant') { statusStr = 'SHARIAH NON-COMPLIANT'; cls = 'status-non-halal'; icon = <AlertCircle size={12} />; }
    }
    return { label: statusStr, cls, icon, raw: statusStr.toLowerCase() };
  };

  // Filter full stock objects that match the watchlist symbols
  const watchedStocks = useMemo(() => {
    let stocks = allStocks.filter(s => watchlistSymbols.includes(s.symbol));
    if (filter !== 'all') {
      stocks = stocks.filter(s => {
        const cfg = getStatusConfig(s);
        if (filter === 'halal') return cfg.label === 'SHARIAH COMPLIANT';
        if (filter === 'nonhalal') return cfg.label === 'SHARIAH NON-COMPLIANT';
        if (filter === 'doubtful') return cfg.label === 'DOUBTFUL';
        if (filter === 'purify') return false; // Watchlist items do not track purification yet
        return true;
      });
    }
    return stocks;
  }, [allStocks, watchlistSymbols, filter]);

  const handleCloseAlertModal = () => {
    setActiveAlertStock(null);
    if (onClearInitialSymbol) onClearInitialSymbol();
  };

  return (
    <div className="animate-fade-in stagger-1 watchlist-tab-card" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'0', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', border:'1px solid var(--border)', overflow:'hidden' }}>
      
      <div style={{ 
        background: 'linear-gradient(to right, var(--bg) 40%, var(--primary-50) 100%)', padding: '28px 32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%) rotate(-5deg)', opacity: 0.08, pointerEvents: 'none' }}>
           <Eye size={180} strokeWidth={1} color="var(--primary)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(138, 76, 158, 0.12)' }}>
            <Eye size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>Watchlist & Alerts</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', margin: 0 }}>Track assets & receive instant status alerts</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, background: 'var(--bg)', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            {watchlistSymbols.length} {watchlistSymbols.length === 1 ? 'Asset' : 'Assets'}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px 32px' }}>
        <div className="watchlist-action-bar" style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="hide-scrollbar" style={{ display:'flex', background:'var(--body-bg)', borderRadius:'14px', padding:'6px', gap:'8px', border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', overflowX: 'auto', maxWidth: '100%' }}>
            {[
              { id:'all', label:'All', icon: Layers, activeColor: 'var(--primary)' },
              { id:'halal', label: 'Compliant', icon: ShieldCheck, activeColor: '#16a34a' },
              { id:'purify', label: 'Purify', icon: Droplet, activeColor: '#eab308' },
              { id:'doubtful', label: 'Doubtful', icon: HelpCircle, activeColor: '#d97706' },
              { id:'nonhalal', label: 'Non-Compliant', icon: AlertTriangle, activeColor: '#dc2626' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
                  padding:'10px 18px', borderRadius:'10px', fontSize: '0.78rem', fontWeight:800, cursor:'pointer', border:'none', transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  background: filter === f.id ? 'var(--bg)' : 'transparent',
                  color:      filter === f.id ? f.activeColor : 'var(--text-muted)',
                  boxShadow:  filter === f.id ? '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <f.icon size={16} color={filter === f.id ? f.activeColor : 'var(--text-muted)'} />
                {f.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
            className="hover-lift"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Assets
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="60px" borderRadius="12px" />
            <Skeleton height="60px" borderRadius="12px" />
            <Skeleton height="60px" borderRadius="12px" />
          </div>
        </div>
      ) : watchedStocks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #ffffff 0%, var(--bg-section) 100%)', 
          borderRadius: '24px', border: '2px dashed var(--border)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            width:'80px', height:'80px', background:'var(--primary-50)', borderRadius:'24px', 
            display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px',
            border:'1px solid var(--primary-100)', boxShadow:'0 12px 32px rgba(91, 41, 113, 0.1)'
          }}>
            <Star size={36} color="var(--primary)" fill="var(--primary)" opacity={0.8} />
          </div>
          <div style={{ fontSize: '1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
            No Alerts Set
          </div>
          <p style={{ color:'var(--text-muted)', fontSize: '0.88rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
            Keep an eye on promising stocks. Set an alert to track their Shariah compliance status and daily performance.
          </p>
          <button 
            onClick={() => navigate('/portfolio#market')} 
            style={{ 
              display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
              borderRadius:'14px', background:'var(--primary)', color:'white', border:'none', 
              fontWeight:800, fontSize: '0.84rem', cursor:'pointer', textDecoration:'none',
              boxShadow:'var(--shadow-sm)', transition:'transform 0.2s, boxShadow 0.2s' 
            }}
            className="hover-lift"
          >
            <BarChart2 size={18} strokeWidth={2.5}/> Explore Market
          </button>
        </div>
      ) : (
        <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
          {watchedStocks.map((stock, i) => {
            const cfg = getStatusConfig(stock);
            const price = parseFloat(stock.latest_price ?? 0);
            const change = parseFloat(stock.price_change_pct ?? 0);
            const isPos = change >= 0;
            const wlItem = watchlistItems.find(w => w.symbol === stock.symbol) || {};
            const hasAlerts = wlItem.alert_email || wlItem.alert_inapp || wlItem.alert_push || wlItem.alert_verdict_change || wlItem.alert_compliance_risk || wlItem.alert_price_change || wlItem.alert_weekly_digest;

            return (
              <div 
                key={stock.symbol}
                className="watchlist-card hover-lift"
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--bg)', 
                  borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
                  animationDelay: `${(i % 10) * 0.04}s`, flexWrap: 'wrap', gap: '16px'
                }}
                onClick={() => navigate(`/market/${stock.symbol}/aaoifi`, { state: { stock } })}
              >
                <div className="watchlist-card-main" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
                  <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={32} radius={10} />
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.85rem', letterSpacing: '-0.2px' }}>
                      {stock.symbol}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{stock.name}</div>
                  </div>
                </div>

                <div className="watchlist-price-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.90rem' }}>₦{price.toFixed(2)}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 700, color: isPos ? 'var(--halal)' : 'var(--non-halal)', marginTop: '4px', background: isPos ? 'var(--halal-bg)' : 'var(--non-halal-bg)', padding: '3px 6px', borderRadius: '8px' }}>
                    {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPos ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>

                <div className="watchlist-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveAlertStock(stock);
                    }}
                    className={`alert-btn-wide ${hasAlerts ? 'active-alert' : ''}`}
                    title={hasAlerts ? 'Alerts Active' : 'Set Alerts'}
                  >
                    <Bell size={12} fill={hasAlerts ? "currentColor" : "none"} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{hasAlerts ? 'Alerts On' : 'Alerts'}</span>
                  </button>
                  
                  <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
                  
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(stock.symbol); }}
                    className="remove-btn"
                    title="Remove from Watchlist"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} color="var(--text-light)" style={{ marginLeft: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {showAddModal && (
        <AddWatchlistModal 
          allStocks={allStocks} 
          watchlistSymbols={watchlistSymbols} 
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            loadData(); // reload watchlist items from backend
          }}
        />
      )}

      {activeAlertStock && (
        <ModalErrorBoundary onClose={handleCloseAlertModal}>
          <WatchlistAlertModal
            stock={activeAlertStock}
            watchlistData={watchlistItems.find(w => w.symbol === activeAlertStock.symbol) || {}}
            onClose={handleCloseAlertModal}
            onUpdated={handleAlertUpdate}
          />
        </ModalErrorBoundary>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-search-row:hover { background: var(--bg-section) !important; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; border-color: var(--primary-50) !important; }
        
        .alert-btn {
          width: 44px; height: 44px; border-radius: 12px; background: var(--bg-section); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .alert-btn:hover { background: white; border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .alert-btn-wide {
          padding: 6px 12px; border-radius: 10px; background: var(--bg-section); border: 1px solid var(--border);
          display: flex; align-items: center; gap: 6px; color: var(--text-muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .alert-btn-wide:hover { background: white; border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .active-alert { background: var(--primary-50) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
        .active-alert:hover { background: var(--primary-100) !important; transform: translateY(-2px); box-shadow: 0 4px 12px var(--primary-50) !important; }
        
        .active-email { background: var(--primary) !important; border-color: var(--primary) !important; color: white !important; }
        .active-email:hover { background: var(--primary-hover) !important; }

        .remove-btn {
          width: 36px; height: 36px; border-radius: 10px; background: transparent; border: none;
          display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .remove-btn:hover { background: var(--non-halal-bg); color: var(--non-halal); transform: scale(1.05); }

        .watchlist-card {
          animation: slideUpFade 0.4s ease forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes slideUpFade {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .watchlist-price-col { border-right: 1px solid var(--border); padding-right: 24px !important; }
        }
        @media (max-width: 768px) {
          .watchlist-card { padding: 12px !important; }
          .watchlist-price-col { align-items: flex-start !important; padding-right: 0 !important; }
        }
      `}} />
    </div>
  );
}
