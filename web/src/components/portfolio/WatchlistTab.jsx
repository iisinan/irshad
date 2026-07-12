import React, { useState, useEffect } from 'react';
import { Eye, BarChart2, Star, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist, fetchNgxStocks } from '../../services/api';
import { Link } from 'react-router-dom';

/* ─── Shared StockCard (Watchlist Version) ─── */
const WatchlistCard = ({ company, onRemove }) => {
  const [hover, setHover] = useState(false);
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
    <div 
      style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
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
      
      {/* Remove Button overlay */}
      {hover && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(company.symbol); }}
          style={{
            position: 'absolute', top: '-10px', right: '-10px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--non-halal)', cursor: 'pointer', zIndex: 10
          }}
          title="Remove from Watchlist"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default function WatchlistTab() {
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  // Hydrate from cache for instant render
  const [allStocks, setAllStocks] = useState(() => {
    try {
      const cached = localStorage.getItem('irshad_stocks_cache_v7');
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

  return (
    <div className="animate-fade-in stagger-1" style={{ background:'white', borderRadius:'24px', padding:'40px 32px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Star size={24} fill="currentColor" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Watchlist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Tracked stocks and compliance alerts</p>
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
            onClick={() => window.location.hash = '#market'} 
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {watchedStocks.map(stock => (
            <WatchlistCard key={stock.symbol} company={stock} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
