import React, { useState, useEffect } from 'react';
import { Eye, BarChart2, Star, TrendingUp, TrendingDown, Trash2, Shield, AlertCircle, HelpCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist, fetchNgxStocks } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Ticker Component ─── */
const StockTicker = ({ stocks }) => {
  const navigate = useNavigate();
  if (!stocks || stocks.length === 0) return null;

  return (
    <div className="ticker-wrap" style={{ margin: '-40px -32px 32px -32px', borderRadius: '24px 24px 0 0', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
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
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
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
      setWatchlistSymbols(wlRes.map(item => item.symbol));
      setAllStocks(stocksRes.data || []);
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
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
    } catch (err) {
      alert('Failed to remove from watchlist');
    }
  };

  // Filter full stock objects that match the watchlist symbols
  const watchedStocks = allStocks.filter(s => watchlistSymbols.includes(s.symbol));

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

  return (
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'40px 32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
      <StockTicker stocks={allStocks} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Watchlist</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Tracked stocks and compliance alerts</p>
          </div>
        </div>
        <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 600 }}>
          {watchedStocks.length} {watchedStocks.length === 1 ? 'Asset' : 'Assets'}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading watchlist...</p>
        </div>
      ) : watchedStocks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #ffffff 0%, var(--bg-section) 100%)', 
          borderRadius: '24px', border: '1px dashed var(--border-strong)', boxShadow: 'var(--shadow-sm)',
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
            Your Watchlist is Empty
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'1rem', marginBottom:'32px', maxWidth:'400px', lineHeight:1.6 }}>
            Keep an eye on promising NGX stocks. Add them to your watchlist to track their Shariah compliance status and daily performance.
          </p>
          <button 
            onClick={() => navigate('/market')} 
            style={{ 
              display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', 
              borderRadius:'14px', background:'var(--gold-grad)', color:'white', border:'none', 
              fontWeight:800, fontSize:'0.95rem', cursor:'pointer', textDecoration:'none',
              boxShadow:'0 8px 24px rgba(201,168,76,0.3)', transition:'transform 0.2s, boxShadow 0.2s' 
            }}
          >
            <BarChart2 size={18}/> Explore Market
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>24h Change</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchedStocks.map((stock, i) => {
                const cfg = getStatusConfig(stock);
                const price = parseFloat(stock.latest_price ?? 0);
                const change = parseFloat(stock.price_change_pct ?? 0);
                const isPos = change >= 0;

                return (
                  <tr 
                    key={stock.symbol} 
                    className="roll-in-anim hover-row"
                    style={{ animationDelay: `${(i % 10) * 0.04}s`, borderBottom: i !== watchedStocks.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => navigate(`/market/${stock.symbol}`, { state: { stock } })}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {stock.logo_url ? (
                          <img src={stock.logo_url} alt={stock.symbol} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'contain', border: '1px solid var(--border)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                            {stock.symbol.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem', letterSpacing: '-0.2px' }}>{stock.symbol}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`status-badge ${cfg.cls}`} style={{ display: 'inline-flex', padding: '6px 10px', fontSize: '0.7rem' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem' }}>₦{price.toFixed(2)}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: isPos ? 'var(--halal)' : 'var(--non-halal)', background: isPos ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
                        {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPos ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/market/${stock.symbol}`, { state: { stock } }); }}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-section)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                          title="View Details"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemove(stock.symbol); }}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--non-halal-bg)', border: '1px solid var(--non-halal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--non-halal)', cursor: 'pointer', transition: 'all 0.2s' }}
                          title="Remove from Watchlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add a tiny style block to handle the row hover state */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: var(--bg-section) !important; }
        .hover-row:hover td { background: transparent; }
      `}} />
    </div>
  );
}

