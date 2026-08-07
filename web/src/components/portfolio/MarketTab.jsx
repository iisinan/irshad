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
    if (s === 'halal' || s === 'compliant') { statusStr = 'HALAL'; cls = 'status-halal'; icon = <CheckCircle size={11} />; }
    else if (s === 'non-halal' || s === 'non_compliant') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; icon = <AlertCircle size={11} />; }
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'compliant' || s === 'halal') { statusStr = 'HALAL'; cls = 'status-halal'; icon = <CheckCircle size={11} />; }
    else if (s === 'non-halal' || s === 'non_compliant') { statusStr = 'NON-HALAL'; cls = 'status-non-halal'; icon = <AlertCircle size={11} />; }
  }
  return { label: statusStr, cls, icon, raw: statusStr.toLowerCase() };
};

/* ─── Table header cell — defined OUTSIDE to avoid re-mounting ───────────── */
const TH = ({ children, right, center }) => (
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
  }}>
    {children}
  </th>
);

/* ─── Stock table row ────────────────────────────────────────────────────── */
const StockRow = React.memo(({ stock, idx, isWatched, onToggle }) => {
  const isPos  = Number(stock.price_change_pct ?? 0) >= 0;

  return (
    <tr
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
    >
      {/* Rank */}
      <td style={{ padding: '10px 8px 10px 16px', color: 'var(--text-light)', fontSize: '0.72rem', fontWeight: 700 }}>
        {idx + 1}
      </td>

      {/* Company */}
      <td style={{ padding: '10px 12px' }}>
        <Link
          to={`/market/${stock.symbol}`}
          state={{ stock }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <CompanyLogo symbol={stock.symbol} logoUrl={stock.logo_url} size={38} radius={10} />
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
      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.84rem', fontVariantNumeric: 'tabular-nums' }}>
        ₦{fmtPrice(stock.latest_price)}
      </td>

      {/* Change */}
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '0.72rem', fontWeight: 800,
          color: isPos ? 'var(--halal)' : 'var(--non-halal)',
          background: isPos ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
          padding: '4px 9px', borderRadius: '8px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isPos ? '+' : ''}{Number(stock.price_change_pct ?? 0).toFixed(2)}%
        </span>
      </td>

      {/* Mkt Cap */}
      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {fmtCap(stock.market_cap)}
      </td>

      {/* P/E */}
      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {stock.pe_ratio ? Number(stock.pe_ratio).toFixed(1) : '—'}
      </td>

      {/* Star */}
      <td style={{ padding: '10px 16px 10px 8px', textAlign: 'right' }}>
        <button
          onClick={() => onToggle(stock.symbol, isWatched)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
            color: isWatched ? 'var(--gold)' : 'var(--border)',
            transition: 'color 0.15s, transform 0.15s',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
          }}
          title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Star size={17} fill={isWatched ? 'currentColor' : 'none'} />
        </button>
      </td>
    </tr>
  );
});

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MarketTab() {
  const queryClient = useQueryClient();

  // Force-refresh on every mount to bypass stale/empty cache from previous errors
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['marketData', 'v2'] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: stocks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['marketData', 'v2'],
    queryFn: async () => {
      const r = await fetchNgxStocks();
      return Array.isArray(r) ? r : (r?.data || []);
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
  const [industryF, setIndustryF] = useState('all');
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

  const availableIndustries = useMemo(() => {
    if (sectorF === 'all') {
      const all = Object.values(sectorMap).flat();
      return [...new Set(all)].sort();
    }
    return sectorMap[sectorF] || [];
  }, [sectorF, sectorMap]);

  const halalCount = useMemo(() => {
    return actualStocks.filter(s => getStatusConfig(s).label === 'HALAL').length;
  }, [actualStocks]);

  const filtered = useMemo(() => {
    let list = actualStocks.filter(s => {
      const q = search.toLowerCase();
      if (q && !s.symbol?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false;
      if (statusF !== 'all') {
        const cfg = getStatusConfig(s);
        if (statusF === 'halal' && cfg.label !== 'HALAL') return false;
        if (statusF === 'non-halal' && cfg.label !== 'NON-HALAL') return false;
        if (statusF === 'doubtful' && cfg.label !== 'DOUBTFUL') return false;
      }
      if (sectorF !== 'all' && normSector(s.sector) !== sectorF) return false;
      if (industryF !== 'all' && s.business_type !== industryF) return false;
      return true;
    });
    if (sortBy === 'gainers')  list = [...list].sort((a, b) => (b.price_change_pct || 0) - (a.price_change_pct || 0));
    if (sortBy === 'losers')   list = [...list].sort((a, b) => (a.price_change_pct || 0) - (b.price_change_pct || 0));
    if (sortBy === 'cap_high') list = [...list].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
    if (sortBy === 'pe_low')   list = [...list].sort((a, b) => (a.pe_ratio > 0 ? a.pe_ratio : 999) - (b.pe_ratio > 0 ? b.pe_ratio : 999));
    return list;
  }, [actualStocks, search, statusF, sectorF, industryF, sortBy]);

  const hasFilters = search || statusF !== 'all' || sectorF !== 'all' || industryF !== 'all' || sortBy !== 'default';
  const clearAll   = () => { setSearch(''); setStatusF('all'); setSectorF('all'); setIndustryF('all'); setSortBy('default'); };

  const selectStyle = (active) => ({
    padding: '9px 14px', borderRadius: '12px', outline: 'none', cursor: 'pointer',
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dark)', fontFamily: 'inherit',
    border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
    background: active ? 'var(--primary-50)' : 'var(--bg-section)',
    transition: 'all 0.2s',
  });

  return (
    <div className="animate-fade-in stagger-1" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header Hero Banner ─────────────────────────────────────── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1A1020 0%, #2A1A2E 50%, #3C2D3E 100%)', 
        borderRadius: '20px', padding: '20px', 
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)', 
        border: '1px solid rgba(201, 149, 42, 0.2)', marginBottom: '16px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '16px' 
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'rgba(243,198,81,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(243,198,81,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(243,198,81,0.35)' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Market Screener</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginTop: '2px', margin: 0 }}>Nigerian Exchange (NGX) · AAOIFI Shariah Standard No. 21</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'var(--primary)', fontSize: '0.79rem', fontWeight: 800, background: 'rgba(243,198,81,0.12)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(243,198,81,0.3)', backdropFilter: 'blur(10px)' }}>
            {actualStocks.length} Companies
          </div>
          <div style={{ color: '#10B981', fontSize: '0.79rem', fontWeight: 800, background: 'rgba(16,185,129,0.15)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> {halalCount} Halal
          </div>
        </div>
      </div>

      {/* ── Filter Card ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg)', padding: '12px',
        borderRadius: '16px 16px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        <div className="market-filter-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="market-search-bar" style={{ position: 'relative', flex: '1 1 200px', maxWidth: '100%' }}>
            <Search size={14} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ticker or name…"
              style={{
                width: '100%', paddingLeft: '32px', paddingRight: search ? '32px' : '12px',
                paddingTop: '8px', paddingBottom: '8px',
                borderRadius: '10px', border: '1px solid var(--border)',
                background: 'var(--bg-section)', fontSize: '0.75rem',
                color: 'var(--text-dark)', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e  => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e   => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Shariah Status Segmented Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-section)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'halal', label: 'Halal' },
              { key: 'non-halal', label: 'Non-Halal' },
              { key: 'doubtful', label: 'Doubtful' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusF(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: statusF === tab.key ? 'var(--bg)' : 'transparent',
                  color: statusF === tab.key ? 'var(--text-dark)' : 'var(--text-muted)',
                  fontWeight: statusF === tab.key ? 800 : 600,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: statusF === tab.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sector Filter */}
          <select value={sectorF} onChange={e => { setSectorF(e.target.value); setIndustryF('all'); }} style={selectStyle(sectorF !== 'all')}>
            <option value="all">All Sectors</option>
            {uniqueSectors.map(s => <option key={s} value={s}>{normSector(s)}</option>)}
          </select>

          {/* Industry Filter */}
          {availableIndustries.length > 0 && (
            <select value={industryF} onChange={e => setIndustryF(e.target.value)} style={selectStyle(industryF !== 'all')}>
              <option value="all">All Industries</option>
              {availableIndustries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}

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
                padding: '9px 14px', borderRadius: '12px', border: '1px solid var(--border)',
                background: 'var(--bg)', fontSize: '0.74rem', fontWeight: 700,
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <X size={13} /> Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}>
              {filtered.length} {filtered.length === 1 ? 'Company' : 'Companies'}
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
            <BarChart2 size={44} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: 'var(--non-halal)' }} />
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
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>Company</TH>
                  <TH right>Price</TH>
                  <TH right>24h Change</TH>
                  <TH right>Mkt Cap</TH>
                  <TH right>P/E</TH>
                  <TH right>Watch</TH>
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
        )}
      </div>

    </div>
  );
}
