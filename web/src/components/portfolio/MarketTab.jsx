import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, BarChart2, LayoutGrid, List as ListIcon, ChevronLeft } from 'lucide-react';
import { fetchNgxStocks, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* ─── Stock Card (Local to avoid breaking App.jsx until refactor) ─── */
const StockCard = ({ company, isWatched, onToggleWatch }) => {
  const priceChange = company.price_change ?? 0;
  const isPositive = priceChange >= 0;

  let statusStr = 'QUESTIONABLE';
  let badgeClass = 'status-doubtful';

  const rawStatus = company.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
    else if (s === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
    else if (s === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Link to={`/market/${company.symbol}`} state={{ stock: company }} className="stock-card" style={{ display: 'block' }}>
        <div className="stock-card-header">
          <div className="stock-card-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--primary-50)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.6rem', color: 'var(--primary)', letterSpacing: '0.5px',
              overflow: 'hidden',
            }}>
              {company.logo_url ? (
                  <img src={'http://127.0.0.1:8000' + company.logo_url} alt={company.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                  (company.symbol || '').slice(0, 5)
              )}
            </div>
            <div>
              <div className="stock-symbol">{company.symbol}</div>
              <div className="stock-name">{company.name}</div>
            </div>
          </div>
        </div>
        <div className="stock-card-body">
          <div className="stock-price-wrapper">
            <span className="stock-price-currency">₦</span>
            <span className="stock-price">{(company.latest_price ?? 0).toFixed(2)}</span>
          </div>
          <div className={`stock-change-pill ${isPositive ? 'pos' : 'neg'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {(company.price_change_pct ?? 0).toFixed(2)}%
          </div>
        </div>
      </Link>

      {/* Watchlist toggle button */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch(company.symbol, isWatched); }}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isWatched ? 'var(--gold)' : 'var(--border)',
          transition: 'all 0.2s'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </div>
  );
};

export default function MarketTab() {
  // Hydrate from cache for instant render
  const [stocks, setStocks] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_stocks_cache_v9');
      if (cached) {
        const { data, expiry } = JSON.parse(cached);
        if (Date.now() < expiry) return data?.data || [];
      }
    } catch {}
    return [];
  });
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(stocks.length === 0);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('default');
  const [viewMode, setViewMode] = useState('grid');

  const loadData = async () => {
    try {
      if (stocks.length === 0) setLoading(true);
      setError(null);

      const [wlRes, stocksRes] = await Promise.all([
        fetchWatchlist().catch(() => []),
        fetchNgxStocks()
      ]);
      
      setWatchlist(wlRes.map(w => w.symbol));
      setStocks(stocksRes.data || []);
      localStorage.setItem('irshad_stocks_cache_v9', JSON.stringify({ data: stocksRes, expiry: Date.now() + 1000 * 60 * 60 }));
    } catch (err) {
      if (stocks.length === 0) setError(err?.message || 'Failed to load market data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleWatch = async (symbol, isWatched) => {
    try {
      if (isWatched) {
        await removeFromWatchlist(symbol);
        setWatchlist(prev => prev.filter(s => s !== symbol));
      } else {
        await addToWatchlist(symbol);
        setWatchlist(prev => [...prev, symbol]);
      }
    } catch (err) {
      alert('Failed to update watchlist');
    }
  };

  const getStatus = (company) => {
    const raw = company.status;
    if (typeof raw === 'object' && raw !== null) return raw.status?.toLowerCase() ?? 'doubtful';
    if (typeof raw === 'string') {
      const s = raw.toLowerCase();
      if (s === 'compliant') return 'halal';
      return s;
    }
    return 'doubtful';
  };

  const filtered = stocks.filter(s => {
    const nameMatch = s.name?.toLowerCase()?.includes(search.toLowerCase()) || s.symbol?.toLowerCase()?.includes(search.toLowerCase());
    return nameMatch;
  }).sort((a, b) => {
    if (sortMode === 'gainers') return (b.price_change_pct || 0) - (a.price_change_pct || 0);
    if (sortMode === 'losers') return (a.price_change_pct || 0) - (b.price_change_pct || 0);
    return 0;
  });

  // Derive live market stats
  const halalCount  = stocks.filter(s => getStatus(s) === 'halal').length;
  const nonHalalCount = stocks.filter(s => getStatus(s) === 'non-halal').length;
  const doubtfulCount = stocks.filter(s => !['halal','non-halal'].includes(getStatus(s))).length;

  return (
    <div className="animate-fade-in stagger-1" style={{ borderRadius:'24px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', overflow: 'hidden' }}>
      
      {/* Market Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 60%, #0B6B71 100%)', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-30px', width: '220px', height: '220px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '180px', height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: stocks.length > 0 ? '24px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
              <BarChart2 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Search for Stock</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginTop: '2px' }}>Nigerian Exchange</p>
            </div>
          </div>
          
          {stocks.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { label: 'Halal', value: halalCount, color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
                { label: 'Doubtful', value: doubtfulCount, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                { label: 'Non-Halal', value: nonHalalCount, color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '8px 14px', background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integrated Filter Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '280px' }}>
            <Search size={14} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '14px', top: '11px' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search symbol or company..."
              style={{
                padding: '10px 14px 10px 36px',
                borderRadius: '12px',
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.1)',
                fontSize: '0.88rem',
                color: 'white',
                outline: 'none',
                width: '100%',
                fontFamily: 'inherit',
                backdropFilter: 'blur(4px)',
              }}
            />
          </div>



          {/* Sort select */}
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="default" style={{ color: '#0D1B2A' }}>Default Sort</option>
            <option value="gainers" style={{ color: '#0D1B2A' }}>Top Gainers</option>
            <option value="losers" style={{ color: '#0D1B2A' }}>Top Losers</option>
          </select>

          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stock count */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 32px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 700, background: 'white', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
          {filtered.length} {filtered.length === 1 ? 'stock' : 'stocks'}
        </span>
      </div>

      <div style={{ background: 'white', padding: '24px 32px 32px' }}>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading market data...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} strokeWidth={1} style={{ margin: '0 auto 20px', color: 'var(--non-halal)' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--non-halal)' }}>Could not load market data</h3>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          <button onClick={loadData} className="btn-primary">Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} strokeWidth={1} style={{ margin: '0 auto 20px' }} />
          <h3 style={{ marginBottom: '8px' }}>No stocks found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="custom-scroll-container">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filtered.map((stock, i) => (
                  <div key={stock.symbol} className="roll-in-anim" style={{ animationDelay: `${(i % 15) * 0.05}s` }}>
                    <StockCard 
                      company={stock} 
                      isWatched={watchlist.includes(stock.symbol)} 
                      onToggleWatch={handleToggleWatch} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="custom-scroll-container" style={{ paddingRight: 0 }}>
              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--bg-section)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Symbol</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Company</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Sector</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Price (₦)</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Change</th>
                      <th style={{ padding: '16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((stock, i) => {
                      const isPositive = (stock.price_change ?? 0) >= 0;
                      let statusStr = 'QUESTIONABLE';
                      let badgeClass = 'status-doubtful';
                      const rawStatus = stock.status;
                      if (typeof rawStatus === 'object' && rawStatus !== null) {
                        if (rawStatus.status?.toLowerCase() === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
                        else if (rawStatus.status?.toLowerCase() === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
                      } else if (typeof rawStatus === 'string') {
                        if (rawStatus.toLowerCase() === 'compliant' || rawStatus.toLowerCase() === 'halal') { statusStr = 'HALAL'; badgeClass = 'status-halal'; }
                        else if (rawStatus.toLowerCase() === 'non-halal') { statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; }
                      }
                      const isWatched = watchlist.includes(stock.symbol);

                      return (
                        <tr key={stock.symbol} className="roll-in-anim" style={{ borderTop: '1px solid var(--border)', animationDelay: `${(i % 15) * 0.03}s` }}>
                          <td style={{ padding: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                            <Link to={`/market/${stock.symbol}`} state={{ stock }} style={{ color: 'inherit', textDecoration: 'none' }}>{stock.symbol}</Link>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{stock.sector || '-'}</td>
                          <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'right' }}>{(stock.latest_price ?? 0).toFixed(2)}</td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <span style={{ color: isPositive ? 'var(--halal)' : 'var(--non-halal)', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {(stock.price_change_pct ?? 0).toFixed(2)}%
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button onClick={() => handleToggleWatch(stock.symbol, isWatched)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isWatched ? 'var(--gold)' : 'var(--border)' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}
      </div>
    </div>
  );
}
