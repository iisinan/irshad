import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, BarChart2, X, CheckCircle, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { fetchNgxStocks, fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchSectors } from '../../services/api';
import CompanyLogo from '../CompanyLogo';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Skeleton from '../ui/Skeleton';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtPrice = (p) => {
  try { return Number(p ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  catch { return Number(p ?? 0).toFixed(2); }
};

const fmtCap = (c) => {
  if (!c || c === 0) return '—';
  if (c >= 1e12) return `₦${(c / 1e12).toFixed(2)}T`;
  if (c >= 1e9)  return `₦${(c / 1e9).toFixed(2)}B`;
  return `₦${(c / 1e6).toFixed(2)}M`;
};

const normSector = (s) => {
  if (!s) return '—';
  const map = { Ict: 'ICT', 'Oil And Gas': 'Oil & Gas', 'Construction/Real Estate': 'Real Estate' };
  return map[s] || s;
};

const getStatusConfig = (company) => {
  let statusStr = 'DOUBTFUL';
  let cls = 'status-doubtful';
  let icon = <HelpCircle size={11} />;

  const rawStatus = company.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal' || s === 'compliant') { statusStr = 'SHARIAH COMPLIANT'; cls = 'status-halal'; icon = <CheckCircle size={11} />; }
    else if (s === 'non-compliant' || s === 'non_compliant') { statusStr = 'SHARIAH NON-COMPLIANT'; cls = 'status-non-compliant'; icon = <AlertCircle size={11} />; }
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'compliant' || s === 'halal') { statusStr = 'SHARIAH COMPLIANT'; cls = 'status-halal'; icon = <CheckCircle size={11} />; }
    else if (s === 'non-compliant' || s === 'non_compliant') { statusStr = 'SHARIAH NON-COMPLIANT'; cls = 'status-non-compliant'; icon = <AlertCircle size={11} />; }
  }
  return { label: statusStr, cls, icon, raw: statusStr.toLowerCase() };
};

/* ─── Table header cell — defined OUTSIDE to avoid re-mounting ───────────── */
const TH = ({ children, right, center, style }) => (
  <th style={{
    padding: '10px 12px',
    fontSize: '0.65rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.6px',
    color: 'var(--text-muted)',
    textAlign: right ? 'right' : center ? 'center' : 'left',
    background: 'var(--bg-section)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    position: 'sticky', top: 0, zIndex: 2,
    ...style
  }}>
    {children}
  </th>
);

const StockRow = React.memo(({ stock, idx, isWatched, onToggle }) => {
  const isPos  = Number(stock.price_change_pct ?? 0) >= 0;
  const cfg = getStatusConfig(stock);

  return (
    <tr
      className="tour-screener-item"
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
    >
      {/* Rank */}
      <td style={{ padding: '12px 8px 12px 20px', color: 'var(--text-light)', fontSize: '0.72rem', fontWeight: 700 }}>
        {idx + 1}
      </td>

      {/* Company */}
      <td style={{ padding: '12px 12px' }}>
        <Link
          to={`/market/${stock.symbol}/aaoifi`}

          state={{ stock }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={42} radius={12} />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.86rem', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
              {stock.symbol}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {stock.name}
            </div>
          </div>
        </Link>
      </td>

      {/* Price */}
      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.84rem', fontVariantNumeric: 'tabular-nums' }}>
        ₦{fmtPrice(stock.latest_price)}
      </td>

      {/* Change */}
      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '0.72rem', fontWeight: 800,
          color: isPos ? 'var(--halal)' : 'var(--non-compliant)',
          background: isPos ? 'var(--halal-bg)' : 'var(--non-compliant-bg)',
          padding: '4px 9px', borderRadius: '8px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {isPos ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
          {isPos ? '+' : ''}{Number(stock.price_change_pct ?? 0).toFixed(2)}%
        </span>
      </td>

      {/* Mkt Cap */}
      <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {fmtCap(stock.market_cap)}
      </td>

      {/* P/E */}
      <td style={{ padding: '12px 32px 12px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {stock.pe_ratio ? Number(stock.pe_ratio).toFixed(1) : '—'}
      </td>
    </tr>
  );
});

/* ─── Mobile Stock Card — shown on small screens ────────── */
const MobileStockCard = React.memo(({ stock, idx, isWatched, onToggle }) => {
  const isPos = Number(stock.price_change_pct ?? 0) >= 0;
  const cfg = getStatusConfig(stock);
  const statusColors = {
    'SHARIAH COMPLIANT': { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
    'SHARIAH NON-COMPLIANT': { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
    'DOUBTFUL': { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }
  };
  const sc = statusColors[cfg.label] || statusColors.DOUBTFUL;

  return (
    <div className="tour-screener-item" style={{ borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Logo */}
      <Link to={`/market/${stock.symbol}/aaoifi`} state={{ stock }} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={44} radius={12} />
      </Link>

      {/* Main info */}
      <Link to={`/market/${stock.symbol}/aaoifi`} state={{ stock }} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 900, color: 'var(--text-dark)', fontSize: '0.92rem', letterSpacing: '-0.3px' }}>{stock.symbol}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{stock.name}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{normSector(stock.sector)}</div>
      </Link>

      {/* Price + change */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 900, color: 'var(--text-dark)', fontSize: '0.95rem', letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums' }}>₦{fmtPrice(stock.latest_price)}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 800, color: isPos ? 'var(--halal)' : 'var(--non-compliant)', background: isPos ? 'var(--halal-bg)' : 'var(--non-compliant-bg)', padding: '3px 8px', borderRadius: 8, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
          {isPos ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
          {isPos ? '+' : ''}{Number(stock.price_change_pct ?? 0).toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MarketTab() {
  const queryClient = useQueryClient();

  const { data: stocks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['marketData', 'v2'],
    queryFn: async () => {
      const r = await fetchNgxStocks();
      const val = Array.isArray(r) ? r : (r?.data || []);
      localStorage.setItem('irshad_market_v2', JSON.stringify(val));
      return val;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('irshad_market_v2');
        if (cached) return JSON.parse(cached);
      } catch {}
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000,
  });

  const { data: initialWatchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const r = await fetchWatchlist();
      const list = Array.isArray(r) ? r : (r?.data || []);
      return list.map(w => w.symbol);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: sectorMap = {} } = useQuery({
    queryKey: ['sectorsMap'],
    queryFn: async () => {
      try {
        const res = await fetchSectors();
        return res?.data || (typeof res === 'object' && res !== null ? res : {});
      } catch (e) {
        return {};
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const [watchlist, setWatchlist] = useState([]);
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [sectorF,   setSectorF]   = useState('all');
  const [sortBy,    setSortBy]    = useState('default');

  // Safely extract from potentially stale cache shapes
  const actualStocks = useMemo(() => Array.isArray(stocks) ? stocks : (stocks?.data || []), [stocks]);
  const actualInitialWatchlist = useMemo(() => Array.isArray(initialWatchlist) ? initialWatchlist : (initialWatchlist?.data ? initialWatchlist.data.map(w => w.symbol) : []), [initialWatchlist]);

  useEffect(() => {
    if (actualInitialWatchlist.length > 0 && watchlist.length === 0) {
      setWatchlist(actualInitialWatchlist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualInitialWatchlist]);

  const handleToggle = async (symbol, isWatched) => {
    try {
      if (isWatched) { await removeFromWatchlist(symbol); setWatchlist(p => p.filter(s => s !== symbol)); }
      else           { await addToWatchlist(symbol);      setWatchlist(p => [...p, symbol]); }
    } catch { /* silent */ }
  };

  const uniqueSectors = useMemo(
    () => Object.keys(sectorMap).length > 0 ? Object.keys(sectorMap) : [...new Set(actualStocks.map(s => normSector(s.sector)).filter(Boolean))].sort(),
    [actualStocks, sectorMap]
  );



  const halalCount = useMemo(() => {
    return actualStocks.filter(s => getStatusConfig(s).label === 'SHARIAH COMPLIANT').length;
  }, [actualStocks]);

  const filtered = useMemo(() => {
    let list = actualStocks.filter(s => {
      const q = search.toLowerCase();
      if (q && !s.symbol?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false;
      if (statusF !== 'all') {
        const cfg = getStatusConfig(s);
        if (statusF === 'halal' && cfg.label !== 'SHARIAH COMPLIANT') return false;
        if (statusF === 'non-compliant' && cfg.label !== 'SHARIAH NON-COMPLIANT') return false;
        if (statusF === 'doubtful' && cfg.label !== 'DOUBTFUL') return false;
      }
      if (sectorF !== 'all' && normSector(s.sector) !== sectorF) return false;
      return true;
    });
    if (sortBy === 'gainers')  list = [...list].sort((a, b) => (b.price_change_pct || 0) - (a.price_change_pct || 0));
    if (sortBy === 'losers')   list = [...list].sort((a, b) => (a.price_change_pct || 0) - (b.price_change_pct || 0));
    if (sortBy === 'cap_high') list = [...list].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
    if (sortBy === 'pe_low')   list = [...list].sort((a, b) => (a.pe_ratio > 0 ? a.pe_ratio : 999) - (b.pe_ratio > 0 ? b.pe_ratio : 999));
    return list;
  }, [actualStocks, search, statusF, sectorF, sortBy]);

  const hasFilters = search || statusF !== 'all' || sectorF !== 'all' || sortBy !== 'default';
  const clearAll   = () => { setSearch(''); setStatusF('all'); setSectorF('all'); setSortBy('default'); };

  const selectStyle = (active) => ({
    padding: '8px 32px 8px 16px', borderRadius: '10px', outline: 'none', cursor: 'pointer',
    fontSize: '0.75rem', fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-muted)', fontFamily: 'inherit',
    border: active ? '1px solid var(--primary-100)' : '1px solid transparent',
    background: active ? 'var(--primary-50)' : 'var(--body-bg)',
    transition: 'all 0.2s',
  });

  return (
    <div className="animate-fade-in stagger-1" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header Hero Banner ─────────────────────────────────────── */}
      <div style={{ 
        padding: '16px 20px', marginBottom: '16px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '16px' 
      }}>
        
        {/* Large Decorative Icon on the right */}
        <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%) rotate(10deg)', opacity: 0.03, pointerEvents: 'none' }}>
           <TrendingUp size={160} strokeWidth={1.5} color="var(--primary)" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(91, 41, 113, 0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(91, 41, 113, 0.1)', boxShadow: '0 4px 12px rgba(91, 41, 113, 0.05)' }}>
            <BarChart2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>Market Screener</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', margin: 0, fontWeight: 600 }}>Nigerian Exchange (NGX) · AAOIFI Shariah Standard No. 21</p>
          </div>
        </div>
      </div>

      {/* ── Filter Card ─────────────────────────────────────── */}
      <div className="stagger-2" style={{
        background: 'var(--bg)', padding: '16px 24px',
        borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        {/* Search - Prominent Top Row */}
        <div className="market-search-bar tour-search-bar" style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for any company or ticker..."
            style={{
              width: '100%', paddingLeft: '44px', paddingRight: search ? '40px' : '16px',
              paddingTop: '12px', paddingBottom: '12px',
              borderRadius: '12px', border: '1px solid transparent',
              background: 'var(--body-bg)', fontSize: '0.85rem', fontWeight: 600,
              color: 'var(--text-dark)', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', transition: 'all 0.2s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}
            onFocus={e => {
              e.target.style.background = 'var(--bg)';
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'transparent';
              e.target.style.background = 'var(--body-bg)';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--border)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--text-light)'} onMouseLeave={e => e.currentTarget.style.background='var(--border)'}>
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
          {/* Sector Filter */}
          <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={selectStyle(sectorF !== 'all')}>
            <option value="all">All Sectors</option>
            {uniqueSectors.map(s => <option key={s} value={s}>{normSector(s)}</option>)}
          </select>

          {/* Sort By */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle(sortBy !== 'default')}>
            <option value="default">Default Sort</option>
            <option value="gainers">Top Gainers</option>
            <option value="losers">Top Losers</option>
            <option value="cap_high">Highest Mkt Cap</option>
            <option value="pe_low">Lowest P/E</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearAll}
              style={{
                padding: '8px 12px', borderRadius: '10px', border: 'none',
                background: 'transparent', fontSize: '0.74rem', fontWeight: 700,
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color='var(--text-dark)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
            >
              <X size={14} /> Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--body-bg)', padding: '6px 12px', borderRadius: '100px', letterSpacing: '0.5px' }}>
              {filtered.length} Companies
            </span>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: '0 0 24px 24px', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton height="56px" borderRadius="14px" />
              <Skeleton height="56px" borderRadius="14px" />
              <Skeleton height="56px" borderRadius="14px" />
              <Skeleton height="56px" borderRadius="14px" />
              <Skeleton height="56px" borderRadius="14px" />
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <BarChart2 size={44} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: 'var(--non-compliant)' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-dark)', fontWeight: 800 }}>Could not load market data</h3>
            <p style={{ marginBottom: '20px', fontSize: '0.8rem' }}>{error?.message || String(error)}</p>
            <button onClick={() => refetch()} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px' }}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <BarChart2 size={44} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: 'var(--text-light)' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-dark)', fontWeight: 800 }}>No companies found</h3>
            <p style={{ fontSize: '0.8rem', maxWidth: '340px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Try adjusting your search criteria or clearing your filters to view other NGX stocks.
            </p>
            <button onClick={clearAll} style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary)', border: '1px solid var(--primary-100)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="market-table-desktop" style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <TH>#</TH>
                    <TH>Company</TH>
                    <TH right>Price</TH>
                    <TH right>24h Change</TH>
                    <TH right>Mkt Cap</TH>
                    <TH right style={{ paddingRight: '32px' }}>P/E</TH>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((stock, i) => (
                    <StockRow
                      key={stock.symbol}
                      stock={stock}
                      idx={i}
                      isWatched={watchlist.includes(stock.symbol)}
                      onToggle={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="market-cards-mobile">
              {filtered.map((stock, i) => (
                <MobileStockCard
                  key={stock.symbol}
                  stock={stock}
                  idx={i}
                  isWatched={watchlist.includes(stock.symbol)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
