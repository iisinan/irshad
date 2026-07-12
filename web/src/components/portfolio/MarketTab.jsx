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
      <Link to={`/portfolio#stock-${company.symbol}`} state={{ stock: company }} className="stock-card" style={{ display: 'block' }}>
        <div className="stock-card-header">
          <div className="stock-card-title">
            <div className="stock-symbol">{company.symbol}</div>
            <div className="stock-name">{company.name}</div>
          </div>
          <span className={`status-badge ${badgeClass}`}>{statusStr}</span>
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
      const cached = localStorage.getItem('irshad_stocks_cache_v7');
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
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
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

  const sectors = [...new Set(stocks.map(s => s.sector).filter(Boolean))].sort();

  const filtered = stocks.filter(s => {
    const statusMatch = filter === 'all' || getStatus(s) === filter;
    const nameMatch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.symbol?.toLowerCase().includes(search.toLowerCase());
    const sectorMatch = sectorFilter === 'all' || s.sector === sectorFilter;
    return statusMatch && nameMatch && sectorMatch;
  }).sort((a, b) => {
    if (sortMode === 'gainers') return (b.price_change_pct || 0) - (a.price_change_pct || 0);
    if (sortMode === 'losers') return (a.price_change_pct || 0) - (b.price_change_pct || 0);
    return 0;
  });

  return (
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '16px', top: '12px' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search symbol or company..."
            style={{
              padding: '10px 16px 10px 40px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-section)',
              fontSize: '0.95rem',
              color: 'var(--text-dark)',
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          />
        </div>

        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', outline: 'none', cursor: 'pointer' }}>
          <option value="default">Default Sort</option>
          <option value="gainers">Top Gainers</option>
          <option value="losers">Top Losers</option>
        </select>

        <div style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '12px', padding: '4px', marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['all', 'halal', 'doubtful', 'non-halal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === f ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: filter === f ? 'var(--primary-50)' : 'white',
              color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'All Stocks' : f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

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
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>Compliance</th>
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
                            <Link to={`/portfolio#stock-${stock.symbol}`} state={{ stock }} style={{ color: 'inherit', textDecoration: 'none' }}>{stock.symbol}</Link>
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
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span className={`status-badge ${badgeClass}`}>{statusStr}</span>
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
  );
}
