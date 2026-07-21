import React, { useState, useEffect, useMemo } from 'react';
import { Eye, BarChart2, Star, TrendingUp, TrendingDown, Trash2, Shield, AlertCircle, HelpCircle, CheckCircle, ChevronRight, Search, Mail, MessageSquare, Filter } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist, fetchNgxStocks, addToWatchlist, updateWatchlist } from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Ticker Component ─── */
const StockTicker = ({ stocks }) => {
  const navigate = useNavigate();
  if (!stocks || stocks.length === 0) return null;

  return (
    <div className="ticker-wrap" style={{ margin: '0 0 32px 0', borderRadius: '24px 24px 0 0', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
      <div className="ticker">
        {stocks.slice(0, 20).concat(stocks.slice(0, 20)).map((stock, i) => {
          let statusStr = 'QUESTIONABLE';
          let color = 'var(--doubtful)';
          const rawStatus = stock.status;
          if (typeof rawStatus === 'object' && rawStatus !== null) {
            const s = rawStatus.status?.toLowerCase();
            if (s === 'halal') { statusStr = 'HALAL'; color = 'var(--halal)'; }
            else if (s === 'non-halal') { statusStr = 'NON-HALAL'; color = 'var(--non-halal)'; }
          } else if (typeof rawStatus === 'string') {
            const s = rawStatus.toLowerCase();
            if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; color = 'var(--halal)'; }
            else if (s === 'non-halal') { statusStr = 'NON-HALAL'; color = 'var(--non-halal)'; }
          }
          const displayPrice = Number(stock.latest_price || stock.daily_prices?.[0]?.price || 0).toFixed(2);
          return (
            <div key={`${stock.symbol}-${i}`} className="ticker-item" onClick={() => navigate(`/market/${stock.symbol}`, { state: { stock } })}>
              <span className="ticker-item-symbol">{stock.symbol}</span>
              <span className="ticker-item-price">₦{displayPrice}</span>
              <span style={{ fontWeight: 800, fontSize: '0.7rem', color, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>{statusStr}</span>
              <div className="ticker-separator" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function WatchlistTab() {
  const [watchlistItems, setWatchlistItems] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_watchlist_items_cache_v3');
      if (cached) return JSON.parse(cached) || [];
    } catch {}
    return [];
  });
  const [watchlistSymbols, setWatchlistSymbols] = useState(() => watchlistItems.map(i => i.symbol));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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

  const searchResults = searchQuery 
    ? allStocks.filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

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
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'40px 32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
      <StockTicker stocks={allStocks} />
      
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius:'24px', padding:'32px', boxShadow:'0 12px 32px rgba(13,27,42,0.15)', border:'none', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Star size={28} fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Watchlist</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '4px' }}>Tracked stocks and compliance alerts</p>
          </div>
        </div>
        <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1, backdropFilter: 'blur(10px)' }}>
          {watchlistSymbols.length} {watchlistSymbols.length === 1 ? 'Asset' : 'Assets'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', background: 'var(--bg-section)', borderRadius: '16px', padding: '0 16px', border: '2px solid transparent', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: isSearching ? '0 8px 24px rgba(201,168,76,0.15)' : 'none', ...(isSearching ? { borderColor: 'var(--primary)', background: 'white' } : { border: '1px solid var(--border)' }) }}>
          <Search size={20} color={isSearching ? 'var(--primary)' : 'var(--text-muted)'} style={{ transition: 'color 0.3s' }} />
          <input 
            type="text" 
            placeholder="Search stocks to add..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            style={{ border: 'none', background: 'transparent', padding: '16px', width: '100%', fontSize: '1rem', color: 'var(--text-dark)', outline: 'none', fontWeight: 500 }}
          />
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '16px', padding: '6px', border: '1px solid var(--border)' }}>
          {['all', 'halal', 'non-halal'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? 'var(--text-dark)' : 'var(--text-muted)',
                fontWeight: filter === f ? 800 : 600,
                fontSize: '0.85rem',
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
        
        {isSearching && searchQuery && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '16px', marginTop: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border)', overflow: 'hidden', zIndex: 20 }}>
            {searchResults.map(stock => {
              const inWatchlist = watchlistSymbols.includes(stock.symbol);
              return (
                <div key={stock.symbol} onClick={() => !inWatchlist && handleAdd(stock.symbol)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: inWatchlist ? 'default' : 'pointer', borderBottom: '1px solid var(--border)', opacity: inWatchlist ? 0.6 : 1, transition: 'background 0.2s' }} className="hover-search-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-10)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {stock.symbol.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                    </div>
                  </div>
                  {inWatchlist ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '6px 12px', borderRadius: '8px' }}>Tracking</span>
                  ) : (
                    <button style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s' }} className="hover-lift">Add</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading watchlist...</p>
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
          <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-dark)', marginBottom:'12px', letterSpacing:'-0.5px' }}>
            {filter !== 'all' ? `No ${filter} assets found` : 'Your Watchlist is Empty'}
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'1rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
            Keep an eye on promising stocks. Add them to your watchlist to track their Shariah compliance status and daily performance.
          </p>
          <button 
            onClick={() => navigate('/portfolio#market')} 
            style={{ 
              display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
              borderRadius:'14px', background:'var(--gold-grad)', color:'white', border:'none', 
              fontWeight:800, fontSize:'0.95rem', cursor:'pointer', textDecoration:'none',
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
                  display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'white', 
                  borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                  animationDelay: `${(i % 10) * 0.04}s`, flexWrap: 'wrap', gap: '16px'
                }}
                onClick={() => navigate(`/market/${stock.symbol}`, { state: { stock } })}
              >
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {stock.logo_url ? (
                    <img loading="lazy" src={stock.logo_url} alt={stock.symbol} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'contain', border: '1px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-10)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
                      {stock.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.15rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {stock.symbol}
                      <span className={`status-badge ${cfg.cls}`} style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '0.65rem' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{stock.name}</div>
                  </div>
                </div>

                <div className="watchlist-price-col" style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '24px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.2rem' }}>₦{price.toFixed(2)}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: isPos ? 'var(--halal)' : 'var(--non-halal)', marginTop: '4px' }}>
                    {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPos ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>

                <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleAlert(stock.symbol, 'email')}
                    className={`alert-btn ${wlItem.alert_email ? 'active-email' : ''}`}
                    title={wlItem.alert_email ? "Email Alerts Enabled" : "Enable Email Alerts"}
                  >
                    <Mail size={16} />
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-search-row:hover { background: var(--bg-section) !important; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; border-color: var(--primary-50) !important; }
        
        .alert-btn {
          width: 44px; height: 44px; border-radius: 12px; background: var(--bg-section); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .alert-btn:hover { background: white; border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .alert-btn.active-email { background: var(--primary); border-color: var(--primary); color: white; }
        .alert-btn.active-email:hover { background: var(--primary-hover); }
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
