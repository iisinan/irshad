import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, BarChart2, LayoutGrid, List as ListIcon, ChevronLeft } from 'lucide-react';
import { fetchNgxStocks, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../../services/api';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';

const normalizeSectorDisplay = (s) => {
  if (!s) return s;
  const map = { 'Ict': 'ICT', 'Oil And Gas': 'Oil & Gas', 'Construction/Real Estate': 'Real Estate' };
  return map[s] || s;
};

/* ─── Stock Card ─── */
const StockCard = React.memo(({ company, isWatched, onToggleWatch }) => {
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

  const fmtCap = (cap) => {
    if (!cap || cap === 0) return null;
    if (cap >= 1_000_000_000_000) return `₦${(cap / 1_000_000_000_000).toFixed(1)}T`;
    return `₦${(cap / 1_000_000_000).toFixed(1)}B`;
  };

  const fmtPrice = (price) => {
    try {
      return (price ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return (price ?? 0).toFixed(2);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Link to={`/market/${company.symbol}`} state={{ stock: company }} className="stock-card" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Header: logo + name + symbol ── */}
        <div className="stock-card-header">
          <div className="stock-card-title">
            <div className="stock-logo-wrap">
              {company.logo_url
                ? <img loading="lazy" src={'http://127.0.0.1:8000' + company.logo_url} alt={company.symbol} />
                : (company.symbol || '').slice(0, 4)
              }
            </div>
            <div>
              <div className="stock-symbol">{company.symbol}</div>
              <div className="stock-name">{company.name}</div>
            </div>
          </div>
        </div>

        {/* ── Price + change ── */}
        <div className="stock-price-row">
          <div className="stock-price-wrapper">
            <span className="stock-price-currency">₦</span>
            <span className="stock-price">{fmtPrice(company.latest_price)}</span>
          </div>
          <div className={`stock-change-pill ${isPositive ? 'pos' : 'neg'}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isPositive ? '+' : ''}{(company.price_change_pct ?? 0).toFixed(2)}%
          </div>
        </div>

        {/* ── Tags: status + sector ── */}
        <div className="stock-tags-row">
          <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.64rem', padding: '3px 9px' }}>{statusStr}</span>
          {company.sector && <span className="stock-sector-tag">{normalizeSectorDisplay(company.sector)}</span>}
        </div>

        {/* ── Metrics footer ── */}
        <div className="stock-metrics-row">
          <div className="stock-metric">
            <span className="metric-label">Div Yield</span>
            <span className={`metric-value ${!company.div_yield ? 'dim' : ''}`}>
              {company.div_yield > 0 ? `${company.div_yield}%` : '—'}
            </span>
          </div>
          <div className="stock-metric">
            <span className="metric-label">P/E Ratio</span>
            <span className={`metric-value ${!company.pe_ratio ? 'dim' : ''}`}>
              {company.pe_ratio ? company.pe_ratio.toFixed(1) : '—'}
            </span>
          </div>
          <div className="stock-metric">
            <span className="metric-label">Mkt Cap</span>
            <span className={`metric-value ${!company.market_cap ? 'dim' : ''}`}>
              {fmtCap(company.market_cap) || '—'}
            </span>
          </div>
        </div>

      </Link>

      {/* ── Watchlist star ── */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch(company.symbol, isWatched); }}
        className={`stock-star-btn ${isWatched ? 'active' : ''}`}
        style={{ position: 'absolute', top: '16px', right: '16px' }}
        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </div>
  );
});

const StockListRow = React.memo(({ stock, index, isWatched, onToggleWatch }) => {
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

  return (
    <tr 
      className="roll-in-anim" 
      style={{ borderTop: '1px solid var(--border)', animationDelay: `${(index % 15) * 0.03}s`, transition: 'background 0.2s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
        <Link to={`/market/${stock.symbol}`} state={{ stock }} style={{ color: 'inherit', textDecoration: 'none' }}>{stock.symbol}</Link>
      </td>
      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</td>
      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{normalizeSectorDisplay(stock.sector) || '-'}</td>
      <td style={{ padding: '16px' }}>
        <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>{statusStr}</span>
      </td>
      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{stock.div_yield > 0 ? `${stock.div_yield}%` : '-'}</td>
      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>{stock.pe_ratio ? stock.pe_ratio.toFixed(1) : '-'}</td>
      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>{stock.market_cap ? `₦${(stock.market_cap / 1000000000).toFixed(1)}B` : '-'}</td>
      <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'right' }}>{(stock.latest_price ?? 0).toFixed(2)}</td>
      <td style={{ padding: '16px', textAlign: 'right' }}>
        <span style={{ color: isPositive ? 'var(--halal)' : 'var(--non-halal)', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {(stock.price_change_pct ?? 0).toFixed(2)}%
        </span>
      </td>
      <td style={{ padding: '16px', textAlign: 'right' }}>
        <button onClick={() => onToggleWatch(stock.symbol, isWatched)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isWatched ? 'var(--gold)' : 'var(--border)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </td>
    </tr>
  );
});

export default function MarketTab() {
  const { 
    data: stocks = [], 
    isLoading: loadingStocks, 
    error: stocksError,
    refetch: loadData
  } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const res = await fetchNgxStocks();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: initialWatchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetchWatchlist();
      return res.map(w => w.symbol);
    },
    staleTime: 5 * 60 * 1000,
  });

  const [watchlist, setWatchlist] = useState([]);
  
  useEffect(() => {
    if (initialWatchlist.length > 0 && watchlist.length === 0) {
      setWatchlist(initialWatchlist);
    }
  }, [initialWatchlist]);

  const loading = loadingStocks;
  const error = stocksError?.message;

  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('default');
  const [viewMode, setViewMode] = useState('grid');

  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYield, setFilterYield] = useState('');
  const [filterCap, setFilterCap] = useState('');

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

  // Normalize sector display: 'Ict' → 'ICT', 'Oil And Gas' → 'Oil & Gas'
  const normalizeSector = (s) => {
    if (!s) return s;
    const map = { 'Ict': 'ICT', 'Oil And Gas': 'Oil & Gas', 'Construction/Real Estate': 'Real Estate' };
    return map[s] || s;
  };

  const uniqueSectors = [...new Set(stocks.map(s => s.sector).filter(Boolean))].sort();
  const sectorCounts = uniqueSectors.reduce((acc, sec) => {
    acc[sec] = stocks.filter(s => s.sector === sec).length;
    return acc;
  }, {});

  // Market stats
  const totalMcap = stocks.reduce((sum, s) => sum + (s.market_cap || 0), 0);
  const withChangePct = stocks.filter(s => (s.price_change_pct ?? 0) !== 0);
  const topGainer = withChangePct.length ? [...withChangePct].sort((a,b) => (b.price_change_pct||0)-(a.price_change_pct||0))[0] : null;
  const topLoser  = withChangePct.length ? [...withChangePct].sort((a,b) => (a.price_change_pct||0)-(b.price_change_pct||0))[0] : null;

  const hasActiveFilters = filterSector || filterStatus || filterYield || filterCap;
  const clearAllFilters = () => { setFilterSector(''); setFilterStatus(''); setFilterYield(''); setFilterCap(''); setSearch(''); };

  const filtered = stocks.filter(s => {
    const nameMatch = s.name?.toLowerCase()?.includes(search.toLowerCase()) || s.symbol?.toLowerCase()?.includes(search.toLowerCase());
    
    let sectorMatch = true;
    if (filterSector) sectorMatch = s.sector === filterSector;
    
    let statusMatch = true;
    if (filterStatus) statusMatch = getStatus(s) === filterStatus;
    
    let yieldMatch = true;
    if (filterYield === 'positive') yieldMatch = (s.div_yield > 0);

    let capMatch = true;
    if (filterCap === 'large') capMatch = s.market_cap >= 1000000000000;
    if (filterCap === 'mid') capMatch = s.market_cap >= 100000000000 && s.market_cap < 1000000000000;
    if (filterCap === 'small') capMatch = s.market_cap >= 10000000000 && s.market_cap < 100000000000;
    if (filterCap === 'micro') capMatch = s.market_cap < 10000000000 && s.market_cap > 0;

    return nameMatch && sectorMatch && statusMatch && yieldMatch && capMatch;
  }).sort((a, b) => {
    if (sortMode === 'gainers') return (b.price_change_pct || 0) - (a.price_change_pct || 0);
    if (sortMode === 'losers') return (a.price_change_pct || 0) - (b.price_change_pct || 0);
    if (sortMode === 'yield') return (b.div_yield || 0) - (a.div_yield || 0);
    if (sortMode === 'pe_lowest') return (a.pe_ratio > 0 ? a.pe_ratio : 999999) - (b.pe_ratio > 0 ? b.pe_ratio : 999999);
    if (sortMode === 'cap_highest') return (b.market_cap || 0) - (a.market_cap || 0);
    
    const upsideA = a.analysts_target && a.latest_price ? ((a.analysts_target - a.latest_price) / a.latest_price) : -999;
    const upsideB = b.analysts_target && b.latest_price ? ((b.analysts_target - b.latest_price) / b.latest_price) : -999;
    if (sortMode === 'upside') return upsideB - upsideA;
    
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Market Screener</h2>
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



          {/* Sector filter */}
          <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: filterSector ? '1.5px solid rgba(99,255,200,0.5)' : '1.5px solid rgba(255,255,255,0.15)', background: filterSector ? 'rgba(99,255,200,0.15)' : 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="" style={{ color: '#0D1B2A' }}>All Sectors</option>
            {uniqueSectors.map(sector => (
              <option key={sector} value={sector} style={{ color: '#0D1B2A' }}>{normalizeSector(sector)} ({sectorCounts[sector]})</option>
            ))}
          </select>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="" style={{ color: '#0D1B2A' }}>Any Status</option>
            <option value="halal" style={{ color: '#0D1B2A' }}>Halal</option>
            <option value="non-halal" style={{ color: '#0D1B2A' }}>Non-Halal</option>
            <option value="doubtful" style={{ color: '#0D1B2A' }}>Doubtful</option>
          </select>

          {/* Dividend filter */}
          <select value={filterYield} onChange={e => setFilterYield(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="" style={{ color: '#0D1B2A' }}>Any Dividend</option>
            <option value="positive" style={{ color: '#0D1B2A' }}>Pays Dividends (&gt;0%)</option>
          </select>

          {/* Cap filter */}
          <select value={filterCap} onChange={e => setFilterCap(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="" style={{ color: '#0D1B2A' }}>Any Size</option>
            <option value="large" style={{ color: '#0D1B2A' }}>Large Cap (&gt;₦1T)</option>
            <option value="mid" style={{ color: '#0D1B2A' }}>Mid Cap (₦100B-₦1T)</option>
            <option value="small" style={{ color: '#0D1B2A' }}>Small Cap (₦10B-₦100B)</option>
            <option value="micro" style={{ color: '#0D1B2A' }}>Micro Cap (&lt;₦10B)</option>
          </select>

          {/* Sort select */}
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', fontSize: '0.88rem', fontWeight: 600, color: 'white', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <option value="default" style={{ color: '#0D1B2A' }}>Sort: Default</option>
            <option value="gainers" style={{ color: '#0D1B2A' }}>Sort: Top Gainers</option>
            <option value="losers" style={{ color: '#0D1B2A' }}>Sort: Top Losers</option>
            <option value="yield" style={{ color: '#0D1B2A' }}>Sort: Highest Yield</option>
            <option value="pe_lowest" style={{ color: '#0D1B2A' }}>Sort: Lowest P/E</option>
            <option value="cap_highest" style={{ color: '#0D1B2A' }}>Sort: Highest Market Cap</option>
            <option value="upside" style={{ color: '#0D1B2A' }}>Sort: Analyst Upside</option>
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

      {/* Stats + filter strip */}
      <div style={{ padding: '12px 32px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Live market stat pills */}
        {totalMcap > 0 && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', background: 'white', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
            Total Listed: ₦{(totalMcap / 1e12).toFixed(2)}T
          </span>
        )}
        {topGainer && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--halal)', background: 'rgba(34,197,94,0.08)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.2)', whiteSpace: 'nowrap' }}>
            ▲ {topGainer.symbol} +{(topGainer.price_change_pct||0).toFixed(2)}%
          </span>
        )}
        {topLoser && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--non-halal)', background: 'rgba(239,68,68,0.08)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)', whiteSpace: 'nowrap' }}>
            ▼ {topLoser.symbol} {(topLoser.price_change_pct||0).toFixed(2)}%
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Active filter chips */}
          {filterSector && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(15,82,87,0.08)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(15,82,87,0.2)' }}>
              {normalizeSector(filterSector)}
              <button onClick={() => setFilterSector('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>×</button>
            </span>
          )}
          {filterStatus && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(15,82,87,0.08)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(15,82,87,0.2)' }}>
              {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              <button onClick={() => setFilterStatus('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>×</button>
            </span>
          )}
          {filterYield && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(15,82,87,0.08)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(15,82,87,0.2)' }}>
              Pays Dividends
              <button onClick={() => setFilterYield('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>×</button>
            </span>
          )}
          {filterCap && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(15,82,87,0.08)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(15,82,87,0.2)' }}>
              {filterCap.charAt(0).toUpperCase() + filterCap.slice(1)} Cap
              <button onClick={() => setFilterCap('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>×</button>
            </span>
          )}
          {hasActiveFilters && (
            <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer' }}>Clear all</button>
          )}
          <span style={{ color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 700, background: 'white', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'stock' : 'stocks'}
          </span>
        </div>
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
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Yield</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>P/E</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Mkt Cap</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Price (₦)</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Change</th>
                      <th style={{ padding: '16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((stock, i) => (
                      <StockListRow
                        key={stock.symbol}
                        stock={stock}
                        index={i}
                        isWatched={watchlist.includes(stock.symbol)}
                        onToggleWatch={handleToggleWatch}
                      />
                    ))}
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
