import React, { useState, useEffect, useMemo } from 'react';
import { Eye, BarChart2, Star, TrendingUp, TrendingDown, Trash2, Shield, AlertCircle, HelpCircle, CheckCircle, ChevronRight, Search, Mail, MessageSquare, Filter, Plus } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist, fetchNgxStocks, addToWatchlist, updateWatchlist, formatLogoUrl } from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import AddWatchlistModal from './AddWatchlistModal';

export default function WatchlistTab() {
  const [watchlistItems, setWatchlistItems] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_watchlist_items_cache_v3');
      if (cached) return JSON.parse(cached) || [];
    } catch {}
    return [];
  });
  const [watchlistSymbols, setWatchlistSymbols] = useState(() => watchlistItems.map(i => i.symbol));
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, halal, non-halal
  
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
  }, []);

  const handleRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlistItems(prev => prev.filter(i => i.symbol !== symbol));
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
    } catch (err) {
      alert('Failed to remove from watchlist');
    }
  };

  const handleAdd = async (symbol) => {
    try {
      const res = await addToWatchlist(symbol);
      const newItem = res.data || res;
      setWatchlistItems(prev => [...prev, newItem]);
      setWatchlistSymbols(prev => [...prev, symbol]);
      setSearchQuery('');
      setIsSearching(false);
      toastSuccess('Added to watchlist');
    } catch (err) {
      toastError('Failed to add to watchlist');
    }
  };

  const toggleAlert = async (symbol, type) => {
    const item = watchlistItems.find(i => i.symbol === symbol);
    if (!item) return;

    const data = {
      alert_email: type === 'email' ? !item.alert_email : item.alert_email,
    };

    // Optimistic update
    setWatchlistItems(prev => prev.map(i => i.symbol === symbol ? { ...i, ...data } : i));

    try {
      await updateWatchlist(symbol, data);
      toastSuccess('Alert preferences updated');
    } catch (err) {
      // Revert on error
      setWatchlistItems(prev => prev.map(i => i.symbol === symbol ? item : i));
      toastError('Failed to update alert preferences');
    }
  };



  const getStatusConfig = (company) => {
    let statusStr = 'DOUBTFUL';
    let cls = 'status-doubtful';
    let icon = <HelpCircle size={12} />;

    const rawStatus = company.status;
    if (typeof rawStatus === 'object' && rawStatus !== null) {
      const s = rawStatus.status?.toLowerCase();
      if (s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; icon = <CheckCircle size={12} />; }
      else if (s === 'non-halal') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; icon = <AlertCircle size={12} />; }
    } else if (typeof rawStatus === 'string') {
      const s = rawStatus.toLowerCase();
      if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; icon = <CheckCircle size={12} />; }
      else if (s === 'non-halal') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; icon = <AlertCircle size={12} />; }
    }
    return { label: statusStr, cls, icon };
  };

  // Filter full stock objects that match the watchlist symbols
  const watchedStocks = useMemo(() => {
    let stocks = allStocks.filter(s => watchlistSymbols.includes(s.symbol));
    if (filter !== 'all') {
      stocks = stocks.filter(s => {
        const cfg = getStatusConfig(s);
        if (filter === 'halal') return cfg.label === 'HALAL';
        if (filter === 'non-halal') return cfg.label === 'NON-HALAL';
        return true;
      });
    }
    return stocks;
  }, [allStocks, watchlistSymbols, filter]);

  return (
    <div className="animate-fade-in stagger-1" style={{ background: 'var(--bg)', borderRadius:'24px', padding:'40px 32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
      
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'32px', boxShadow:'0 12px 32px rgba(13,27,42,0.15)', border:'none', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Eye size={28} fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.23rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Watchlist</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.79rem', marginTop: '4px', margin: 0 }}>Track assets & receive instant status alerts</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'white', fontSize: '0.79rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            {watchlistSymbols.length} {watchlistSymbols.length === 1 ? 'Asset' : 'Assets'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '16px', background: 'var(--primary)', color: 'var(--bg)', border: 'none', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(15,82,87,0.25)' }}
          className="hover-lift"
        >
          <Plus size={18} /> Add Assets
        </button>
        
        <div style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '16px', padding: '6px', border: '1px solid var(--border)' }}>
          {['all', 'halal', 'non-halal'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: filter === f ? 'var(--bg)' : 'transparent',
                color: filter === f ? 'var(--text-dark)' : 'var(--text-muted)',
                fontWeight: filter === f ? 800 : 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', fontWeight: 600 }}>Loading watchlist...</p>
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
            border:'1px solid var(--primary-100)', boxShadow:'0 12px 32px rgba(201,168,76,0.15)'
          }}>
            <Star size={36} color="var(--primary)" fill="var(--primary)" opacity={0.8} />
          </div>
          <div style={{ fontSize: '1.23rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
            {filter !== 'all' ? `No ${filter} assets found` : 'Your Watchlist is Empty'}
          </div>
          <p style={{ color:'var(--text-muted)', fontSize: '0.88rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
            Keep an eye on promising stocks. Add them to your watchlist to track their Shariah compliance status and daily performance.
          </p>
          <button 
            onClick={() => navigate('/portfolio#market')} 
            style={{ 
              display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
              borderRadius:'14px', background:'var(--gold-grad)', color:'var(--bg)', border:'none', 
              fontWeight:800, fontSize: '0.84rem', cursor:'pointer', textDecoration:'none',
              boxShadow:'0 8px 24px rgba(201,168,76,0.3)', transition:'transform 0.2s, boxShadow 0.2s' 
            }}
            className="hover-lift"
          >
            <BarChart2 size={18}/> Explore Market
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {watchedStocks.map((stock, i) => {
            const cfg = getStatusConfig(stock);
            const price = parseFloat(stock.latest_price ?? 0);
            const change = parseFloat(stock.price_change_pct ?? 0);
            const isPos = change >= 0;
            const wlItem = watchlistItems.find(w => w.symbol === stock.symbol) || {};

            return (
              <div 
                key={stock.symbol}
                className="watchlist-card hover-lift"
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'var(--bg)', 
                  borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                  animationDelay: `${(i % 10) * 0.04}s`, flexWrap: 'wrap', gap: '16px'
                }}
                onClick={() => navigate(`/market/${stock.symbol}`, { state: { stock } })}
              >
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {stock.logo_url ? (
                    <img loading="lazy" src={formatLogoUrl(stock.logo_url)} alt={stock.symbol} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'contain', border: '1px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-10)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.06rem', flexShrink: 0 }}>
                      {stock.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.01rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {stock.symbol}
                      <span className={`status-badge ${cfg.cls}`} style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '0.57rem' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{stock.name}</div>
                  </div>
                </div>

                <div className="watchlist-price-col" style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '24px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.06rem' }}>₦{price.toFixed(2)}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: isPos ? 'var(--halal)' : 'var(--non-halal)', marginTop: '4px' }}>
                    {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPos ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>

                <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleAlert(stock.symbol, 'email')}
                    className={`alert-btn-wide ${wlItem.alert_email ? 'active-email' : ''}`}
                  >
                    <Mail size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Email Alerts</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemove(stock.symbol); }}
                    className="remove-btn"
                    title="Remove from Watchlist"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={20} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddWatchlistModal 
          allStocks={allStocks} 
          watchlistSymbols={watchlistSymbols} 
          onClose={() => setShowAddModal(false)}
          onAdded={(symbols) => {
            loadData(); // reload watchlist items from backend
          }}
        />
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
          padding: 8px 16px; border-radius: 12px; background: var(--bg-section); border: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px; color: var(--text-muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .alert-btn-wide:hover { background: white; border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .active-email { background: var(--primary) !important; border-color: var(--primary) !important; color: white !important; }
        .active-email:hover { background: var(--primary-hover) !important; }
        .alert-btn.active-wa { background: #25D366; border-color: #25D366; color: white; }
        .alert-btn.active-wa:hover { background: #128C7E; }

        .remove-btn {
          width: 44px; height: 44px; border-radius: 12px; background: transparent; border: none;
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
          .watchlist-price-col { border-right: 1px solid var(--border); padding-right: 32px !important; }
        }
        @media (max-width: 768px) {
          .watchlist-card { padding: 16px !important; }
          .watchlist-price-col { align-items: flex-start !important; padding-right: 0 !important; }
        }
      `}} />
    </div>
  );
}
