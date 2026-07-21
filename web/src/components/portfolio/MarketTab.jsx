import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, BarChart2, X, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { fetchNgxStocks, fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchSectors } from '../../services/api';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtPrice = (p) => {
  try { return Number(p ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  catch { return Number(p ?? 0).toFixed(2); }
};

const fmtCap = (c) => {
  if (!c || c === 0) return '—';
  if (c >= 1e12) return `₦${(c / 1e12).toFixed(1)}T`;
  if (c >= 1e9)  return `₦${(c / 1e9).toFixed(1)}B`;
  return `₦${(c / 1e6).toFixed(0)}M`;
};

const normSector = (s) => {
  if (!s) return '—';
  const map = { Ict: 'ICT', 'Oil And Gas': 'Oil & Gas', 'Construction/Real Estate': 'Real Estate' };
  return map[s] || s;
};

const getStatus = (company) => {
  const raw = company.status;
  if (typeof raw === 'object' && raw !== null) {
    const s = raw.status?.toLowerCase();
    return s === 'compliant' ? 'halal' : (s || 'doubtful');
  }
  if (typeof raw === 'string') {
    const s = raw.toLowerCase();
    return s === 'compliant' ? 'halal' : s;
  }
  return 'doubtful';
};

const STATUS_CFG = {
  halal:       { label: 'Halal',     cls: 'status-halal',     Icon: CheckCircle },
  'non-halal': { label: 'Non-Halal', cls: 'status-non-halal', Icon: AlertCircle },
  doubtful:    { label: 'Doubtful',  cls: 'status-doubtful',  Icon: HelpCircle  },
};

/* ─── Table header cell — defined OUTSIDE to avoid re-mounting ───────────── */
const TH = ({ children, right }) => (
  <th style={{
    padding: '11px 16px',
    fontSize: '0.71rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    textAlign: right ? 'right' : 'left',
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
  const status = getStatus(stock);
  const cfg    = STATUS_CFG[status] || STATUS_CFG.doubtful;
  const isPos  = Number(stock.price_change_pct ?? 0) >= 0;
  const Icon   = cfg.Icon;

  return (
    <tr
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
    >
      {/* Rank */}
      <td style={{ padding: '13px 8px 13px 20px', color: 'var(--text-light)', fontSize: '0.77rem', fontWeight: 700 }}>
        {idx + 1}
      </td>

      {/* Company */}
      <td style={{ padding: '13px 16px' }}>
        <Link
          to={`/market/${stock.symbol}`}
          state={{ stock }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '11px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
            background: 'var(--primary-50)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.68rem', color: 'var(--primary)',
          }}>
            {(stock.symbol || '').slice(0, 4)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem', lineHeight: 1.2 }}>
              {stock.symbol}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stock.name}
            </div>
          </div>
        </Link>
      </td>

      {/* Sector */}
      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        {normSector(stock.sector)}
      </td>

      {/* Industry */}
      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        {stock.business_type || '—'}
      </td>

      {/* Price */}
      <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
        ₦{fmtPrice(stock.latest_price)}
      </td>

      {/* Change */}
      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: '0.8rem', fontWeight: 700,
          color: isPos ? 'var(--halal)' : 'var(--non-halal)',
          background: isPos ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
          padding: '3px 8px', borderRadius: '6px',
        }}>
          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPos ? '+' : ''}{Number(stock.price_change_pct ?? 0).toFixed(2)}%
        </span>
      </td>

      {/* Mkt Cap */}
      <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
        {fmtCap(stock.market_cap)}
      </td>

      {/* P/E */}
      <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
        {stock.pe_ratio ? Number(stock.pe_ratio).toFixed(1) : '—'}
      </td>

      {/* Star */}
      <td style={{ padding: '13px 20px 13px 8px', textAlign: 'right' }}>
        <button
          onClick={() => onToggle(stock.symbol, isWatched)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: isWatched ? 'var(--gold)' : 'var(--border)',
            transition: 'color 0.15s, transform 0.15s',
          }}
          title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Star size={16} fill={isWatched ? 'currentColor' : 'none'} />
        </button>
      </td>
    </tr>
  );
});

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MarketTab() {
  const { data: stocks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const r = await fetchNgxStocks();
      return Array.isArray(r) ? r : (r?.data || []);
    },
    staleTime: 5 * 60 * 1000,
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
    queryFn: async () => await fetchSectors(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const [watchlist, setWatchlist] = useState([]);
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [sectorF,   setSectorF]   = useState('all');
  const [industryF, setIndustryF] = useState('all');
  const [sortBy,    setSortBy]    = useState('default');

  // Safely extract from potentially stale cache shapes
  const actualStocks = Array.isArray(stocks) ? stocks : (stocks?.data || []);
  const actualInitialWatchlist = Array.isArray(initialWatchlist) ? initialWatchlist : (initialWatchlist?.data ? initialWatchlist.data.map(w => w.symbol) : []);

  useEffect(() => {
    if (actualInitialWatchlist.length > 0 && watchlist.length === 0) {
      setWatchlist(actualInitialWatchlist);
    }
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

  const counts = useMemo(() => ({
    halal:    actualStocks.filter(s => getStatus(s) === 'halal').length,
    nonHalal: actualStocks.filter(s => getStatus(s) === 'non-halal').length,
    doubtful: actualStocks.filter(s => !['halal', 'non-halal'].includes(getStatus(s))).length,
  }), [actualStocks]);

  const filtered = useMemo(() => {
    let list = actualStocks.filter(s => {
      const q = search.toLowerCase();
      if (q && !s.symbol?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false;
      if (statusF !== 'all' && getStatus(s) !== statusF) return false;
      if (sectorF !== 'all' && normSector(s.sector) !== sectorF) return false;
      if (industryF !== 'all' && s.business_type !== industryF) return false;
      return true;
    });
    if (sortBy === 'gainers')  list = [...list].sort((a, b) => (b.price_change_pct || 0) - (a.price_change_pct || 0));
    if (sortBy === 'losers')   list = [...list].sort((a, b) => (a.price_change_pct || 0) - (b.price_change_pct || 0));
    if (sortBy === 'cap_high') list = [...list].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
    if (sortBy === 'pe_low')   list = [...list].sort((a, b) => (a.pe_ratio > 0 ? a.pe_ratio : 999) - (b.pe_ratio > 0 ? b.pe_ratio : 999));
    return list;
    return list;
  }, [actualStocks, search, statusF, sectorF, industryF, sortBy]);

  const hasFilters = search || statusF !== 'all' || sectorF !== 'all' || industryF !== 'all';
  const clearAll   = () => { setSearch(''); setStatusF('all'); setSectorF('all'); setIndustryF('all'); setSortBy('default'); };

  const selectStyle = (active) => ({
    padding: '9px 12px', borderRadius: '10px', outline: 'none', cursor: 'pointer',
    fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-dark)', fontFamily: 'inherit',
    border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
    background: active ? 'var(--primary-50)' : 'var(--bg-section)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header card ─────────────────────────────────────── */}
      <div style={{
        background: 'white', padding: '22px 24px 0',
        borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
      }}>
        {/* Title + summary pills */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.3px', margin: 0 }}>
              Market Screener
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Nigerian Exchange · {actualStocks.length} companies
            </p>
          </div>

          {actualStocks.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingBottom: '1px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
            <Search size={14} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by symbol or name…"
              style={{
                width: '100%', paddingLeft: '34px', paddingRight: search ? '32px' : '12px',
                paddingTop: '9px', paddingBottom: '9px',
                borderRadius: '10px', border: '1.5px solid var(--border)',
                background: 'var(--bg-section)', fontSize: '0.84rem',
                color: 'var(--text-dark)', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e  => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e   => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <X size={13} />
              </button>
            )}
          </div>



          <select value={sectorF} onChange={e => { setSectorF(e.target.value); setIndustryF('all'); }} style={selectStyle(sectorF !== 'all')}>
            <option value="all">All Sectors</option>
            {uniqueSectors.map(s => <option key={s} value={s}>{normSector(s)}</option>)}
          </select>

          {availableIndustries.length > 0 && (
            <select value={industryF} onChange={e => setIndustryF(e.target.value)} style={selectStyle(industryF !== 'all')}>
              <option value="all">All Industries</option>
              {availableIndustries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle(false)}>
            <option value="default">Default</option>
            <option value="gainers">Top Gainers</option>
            <option value="losers">Top Losers</option>
            <option value="cap_high">Highest Mkt Cap</option>
            <option value="pe_low">Lowest P/E</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearAll}
              style={{
                padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border)',
                background: 'white', fontSize: '0.82rem', fontWeight: 700,
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <X size={12} /> Clear
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.81rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div style={{
        background: 'white', border: '1px solid var(--border)',
        borderTop: 'none', borderRadius: '0 0 20px 20px', overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>Loading market data…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <BarChart2 size={42} strokeWidth={1} style={{ margin: '0 auto 14px', color: 'var(--non-halal)' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--non-halal)' }}>Could not load market data</h3>
            <p style={{ marginBottom: '20px', fontSize: '0.87rem' }}>{error?.message || String(error)}</p>
            <button onClick={() => refetch()} className="btn-primary" style={{ padding: '10px 24px' }}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <BarChart2 size={42} strokeWidth={1} style={{ margin: '0 auto 14px' }} />
            <h3 style={{ marginBottom: '8px' }}>No stocks found</h3>
            <p style={{ fontSize: '0.87rem' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>Company</TH>
                  <TH>Sector</TH>
                  <TH>Industry</TH>
                  <TH right>Price</TH>
                  <TH right>Change</TH>
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
