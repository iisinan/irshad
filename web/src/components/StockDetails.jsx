import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, HelpCircle, BarChart2, TrendingUp, TrendingDown, Building2, Brain, Globe, Newspaper, Bell, X, ShieldCheck, XCircle, AlertTriangle, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { fetchStockDetails, fetchAiAnalysis, setPriceAlert, formatLogoUrl, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
const StockDetails = ({ symbol: propSymbol }) => {
  const { symbol: paramSymbol } = useParams();
  const symbol = propSymbol || paramSymbol;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use optimistic data passed via router state for instant render
  const optimisticStock = location.state?.stock || null;
  const [stock, setStock] = useState(optimisticStock);
  const [loading, setLoading] = useState(!optimisticStock); // only show full spinner if no optimistic data
  const [enriching, setEnriching] = useState(!!optimisticStock); // silent background fetch
  const [dividendInput, setDividendInput] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const [stockNews, setStockNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showBrokerageModal, setShowBrokerageModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertSaving, setAlertSaving] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    // Always fetch full data in background; merge so we add financials & chart
    fetchStockDetails(symbol)
      .then(r => { if (r.data) setStock(r.data); })
      .catch(console.error)
      .finally(() => { setLoading(false); setEnriching(false); });
      
    // Fetch related news (limit to 5 latest)
    setNewsLoading(true);
    api.get(`/news?symbol=${symbol}&limit=5`)
      .then(res => setStockNews(res.data?.data || []))
      .catch(console.error)
      .finally(() => setNewsLoading(false));

    // Log history
    if (user) {
      api.post('/history', { action: 'check', reference_id: symbol }).catch(() => {});
      fetchWatchlist().then(res => {
        const list = res?.data || res || [];
        setInWatchlist(list.some(item => item.symbol === symbol));
      }).catch(console.error);
    }
  }, [symbol, user]);

  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new CustomEvent('stock-data-loaded'));
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="animate-fade-in" style={{ padding: '80px 0', textAlign: 'center' }}>
        <BarChart2 size={48} strokeWidth={1} style={{ margin: '0 auto 20px', color: 'var(--text-light)' }} />
        <h2 style={{ marginBottom: '8px' }}>Stock not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We couldn't load data for this symbol.</p>
        <button onClick={() => window.history.back()} className="btn-primary">Go Back</button>
      </div>
    );
  }

  // ─── Status logic ───────────────────────────────────
  let statusStr = 'UNDER REVIEW';
  let badgeClass = 'status-doubtful';
  let reason = 'This stock has not been fully screened yet. Its Shariah compliance status is currently under review.';
  let StatusIcon = HelpCircle;
  let isHalal = false;
  let isNonHalal = false;
  let isDoubtful = true;

  const rawStatus = stock.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal' || s === 'compliant') {
      statusStr = 'HALAL'; badgeClass = 'status-halal'; StatusIcon = CheckCircle; isHalal = true; isNonHalal = false; isDoubtful = false;
    } else if (s === 'non-halal' || s === 'non-compliant') {
      statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; StatusIcon = AlertCircle; isNonHalal = true; isHalal = false; isDoubtful = false;
    } else if (s === 'doubtful') {
      statusStr = 'DOUBTFUL'; badgeClass = 'status-doubtful'; StatusIcon = AlertCircle; isDoubtful = true; isHalal = false; isNonHalal = false;
    }
    reason = rawStatus.reason ?? reason;
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'halal' || s === 'compliant') {
      statusStr = 'HALAL'; badgeClass = 'status-halal'; StatusIcon = CheckCircle; isHalal = true; isNonHalal = false; isDoubtful = false;
    } else if (s === 'non-halal' || s === 'non-compliant') {
      statusStr = 'NON-HALAL'; badgeClass = 'status-non-halal'; StatusIcon = AlertCircle; isNonHalal = true; isHalal = false; isDoubtful = false;
    } else if (s === 'doubtful') {
      statusStr = 'DOUBTFUL'; badgeClass = 'status-doubtful'; StatusIcon = AlertCircle; isDoubtful = true; isHalal = false; isNonHalal = false;
    }
  }

  // ─── Financial ratios ─────────────────────────────
  const financials = stock.financials;
  const latest = Array.isArray(financials) && financials.length > 0 ? financials[0] : null;
  const debt = parseFloat(latest?.total_debt) || 0;
  const marketCap = parseFloat(latest?.market_cap) || 0;
  const safeMarketCap = marketCap > 0 ? marketCap : 1;
  const interest = parseFloat(latest?.interest_income) || 0;
  const rawRevenue = parseFloat(latest?.total_revenue) || 0;
  const assets = parseFloat(latest?.total_assets) || 0;
  const revenue = rawRevenue > 0 ? rawRevenue : safeMarketCap;
  
  const hasFinancialHighlights = marketCap > 0 || debt > 0 || rawRevenue > 0 || interest > 0;

  const debtRatio = ((debt / safeMarketCap) * 100).toFixed(1);
  const cash = (parseFloat(latest?.cash_and_equivalents) || 0) + (parseFloat(latest?.interest_bearing_securities) || 0);
  const cashRatio = ((cash / safeMarketCap) * 100).toFixed(1);
  const interestRatio = ((interest / revenue) * 100).toFixed(1);
  const purificationRate = latest?.non_compliant_revenue_ratio ? (parseFloat(latest.non_compliant_revenue_ratio) * 100).toFixed(2) : interestRatio;

  const purificationAmount = dividendInput
    ? ((parseFloat(dividendInput) || 0) * (parseFloat(purificationRate) / 100)).toFixed(2)
    : null;

  const screeningColor = isHalal ? 'var(--halal)' : isNonHalal ? 'var(--non-halal)' : 'var(--doubtful)';
  const screeningBg = isHalal ? 'var(--halal-bg)' : isNonHalal ? 'var(--non-halal-bg)' : 'var(--doubtful-bg)';
  const screeningBorder = isHalal ? 'var(--halal-border)' : isNonHalal ? 'var(--non-halal-border)' : 'var(--doubtful-border)';

  const dailyPrices = stock.daily_prices || [];
  const latestPriceObj = dailyPrices.length > 0 ? dailyPrices[0] : null;
  const previousPriceObj = dailyPrices.length > 1 ? dailyPrices[1] : null;
  const latestPrice = latestPriceObj ? parseFloat(latestPriceObj.price) : 0;
  const previousPrice = previousPriceObj ? parseFloat(previousPriceObj.price) : latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePct = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;


  const renderRatioProgressBar = (title, subtitle, ratio, threshold, isMinimum = false, isCurrency = false, showThreshold = true) => {
    if (ratio === null || ratio === undefined) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: '0 0 220px', paddingLeft: '16px' }}>
            <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.88rem', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.79rem' }}>
            <AlertTriangle size={16} /> Insufficient data
          </div>
        </div>
      );
    }

    const ratioVal = parseFloat(ratio) || 0;
    const thresholdNum = parseFloat(threshold);
    const isPassing = !showThreshold ? true : (isMinimum ? ratioVal >= thresholdNum : ratioVal <= thresholdNum);
    
    const diff = Math.abs(thresholdNum - ratioVal);
    let headroomDisplay = '';
    if (showThreshold) {
      if (isCurrency) {
         headroomDisplay = isPassing ? `₦${diff.toLocaleString()} headroom` : (isMinimum ? `₦${diff.toLocaleString()} shortfall` : `₦${diff.toLocaleString()} excess`);
      } else {
         headroomDisplay = isPassing ? `${diff.toFixed(1)}pp headroom` : (isMinimum ? `${diff.toFixed(1)}pp shortfall` : `${diff.toFixed(1)}pp excess`);
      }
    }
    const color = isPassing ? 'var(--halal)' : 'var(--non-halal)';
    
    const maxVisual = showThreshold ? Math.max(thresholdNum / 0.7, ratioVal / 0.9, 1) : Math.max(ratioVal * 1.2, 1);
    const fillPercent = maxVisual > 0 ? (ratioVal / maxVisual) * 100 : 0;
    const thresholdPercent = (showThreshold && maxVisual > 0) ? (thresholdNum / maxVisual) * 100 : 0;
    
    const displayVal = isCurrency ? `₦ ${ratioVal.toLocaleString(undefined, {maximumFractionDigits: 0})}` : `${ratioVal.toFixed(1)}%`;
    const displayThreshold = isCurrency ? `₦ ${(thresholdNum/1000000000).toFixed(1)}B` : `${thresholdNum}%`;

    return (
      <div 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 0', 
          borderBottom: '1px solid var(--border)',
          transition: 'all 0.2s', position: 'relative'
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-section)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ flex: '0 0 220px', paddingLeft: '16px' }}>
          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.88rem', marginBottom: '4px' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
        
        <div style={{ flex: 1, position: 'relative', height: '14px', background: 'var(--bg-section)', borderRadius: '10px' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', 
            width: `${Math.min(fillPercent, 100)}%`, 
            background: color, 
            borderRadius: '10px',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          {showThreshold && (
            <>
              <div style={{
                position: 'absolute', top: '-6px', bottom: '-6px', 
                left: `${thresholdPercent}%`, width: '2px', 
                background: 'var(--non-halal)',
                zIndex: 10
              }} />
              <div style={{
                position: 'absolute', top: '22px', left: `calc(${thresholdPercent}% - 30px)`,
                fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, width: '60px', textAlign: 'center'
              }}>
                limit {displayThreshold}
              </div>
            </>
          )}
        </div>
        
        <div style={{ flex: '0 0 140px', textAlign: 'right', paddingRight: '16px' }}>
          <div style={{ fontSize: isCurrency ? '1.1rem' : '1.5rem', fontWeight: 900, color }}>{displayVal}</div>
          {showThreshold && <div style={{ fontSize: '0.66rem', fontWeight: 700, color, marginTop: '4px' }}>{headroomDisplay}</div>}
        </div>
      </div>
    );
  };

  // ─── AI Analysis & Actions ─────────────────────────
  const toggleWatchlist = async () => {
    if (!user) { navigate('/login'); return; }
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(symbol);
        setInWatchlist(false);
      } else {
        await addToWatchlist(symbol);
        setInWatchlist(true);
      }
    } catch (err) {
      console.error("Watchlist error", err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAskAI = () => {
    setAiLoading(true);
    setAiError(null);
    fetchAiAnalysis(symbol)
      .then(r => {
        const analysisText = r.data?.analysis || r.analysis || "No analysis returned.";
        setAiAnalysis(analysisText);
      })
      .catch(e => {
        console.error(e);
        if (e.response?.status === 401) {
          setAiError('Unauthorized. Please log in or wait for the backend to update public access.');
        } else {
          setAiError(e.response?.data?.message || 'Failed to get analysis. Ensure the backend is updated.');
        }
      })
      .finally(() => setAiLoading(false));
  };

  return (
    <div className="animate-fade-in page-wrapper">
      {/* Back link */}
      <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, marginBottom: '28px', fontSize: '0.79rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Subtle enriching indicator */}
      {enriching && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '16px', color: 'var(--text-muted)', fontSize: '0.69rem', verticalAlign: 'middle' }}>
          <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
          Loading full data...
        </div>
      )}

      {/* ─── Header Card ─── */}
      <div className="detail-header" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs instead of plain logo */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              {stock.logo_url ? (
                <img 
                src={formatLogoUrl(stock.logo_url)} 
                alt={`${stock.symbol} logo`}
                style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  objectFit: 'contain', background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
            ) : (
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--gold), #D4AF37)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1A1208', fontSize: '1.23rem', fontWeight: 800,
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
              }}>
                {stock.symbol?.charAt(0) || 'S'}
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '1.67rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>{stock.name}</h1>
                <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.66rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <StatusIcon size={12} /> {statusStr}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: '6px', letterSpacing: '0.5px' }}>
                {stock.symbol} · {stock.sector ?? 'Market Listed'} · Stock Exchange
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Latest Price</p>
          <div style={{ fontSize: '1.94rem', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>₦ {latestPrice.toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPositive ? '#4ade80' : '#f87171', fontWeight: 700, justifyContent: 'flex-end', marginTop: '4px' }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {priceChangePct.toFixed(2)}%
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
               onClick={toggleWatchlist}
               disabled={watchlistLoading}
               style={{ 
                 display: 'flex', alignItems: 'center', gap: '6px', 
                 background: inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.15)', 
                 border: `1px solid ${inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}`, 
                 color: inWatchlist ? '#1A1208' : 'white', 
                 padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', 
                 fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
               }}
            >
               {watchlistLoading ? <div className="spinner" style={{width:'14px', height:'14px', borderTopColor: inWatchlist?'#1A1208':'white', borderWidth: '2px'}}/> : <Star size={14} fill={inWatchlist ? '#1A1208' : 'none'} />}
               {inWatchlist ? 'Saved' : 'Watchlist'}
            </button>
            <button 
              onClick={() => setShowAlertDialog(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', 
                color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', 
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
            >
              <Bell size={14} /> Alert
            </button>
          </div>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="detail-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* About Company */}
          <div className="detail-panel">
            <div className="detail-section-label">About Company</div>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.85, color: 'var(--text-body)' }}>
              {stock.overview || `${stock.name} is a publicly traded company on the Stock Exchange, operating within the ${stock.sector || 'Unknown'} sector. Its primary business activities include the production, provision, and distribution of goods and services specific to the ${stock.sector || 'Unknown'} industry. The company focuses on delivering sustainable, long-term value to its shareholders and stakeholders across the region.`}
            </p>
          </div>

          {/* Irshad AI */}
          <div className="detail-panel" style={{ background: 'var(--bg-section)', border: '1px solid var(--border-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="detail-section-label" style={{ marginBottom: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} /> Irshad AI
              </div>
              {!aiAnalysis && !aiLoading && (
                <button onClick={handleAskAI} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'var(--gold)', color: '#1A1208', border: 'none' }}>
                  Ask Halal Assistant
                </button>
              )}
            </div>
            
            {aiLoading && <div style={{ color: 'var(--text-muted)', fontSize: '0.79rem', fontStyle: 'italic' }}>Analyzing the financials...</div>}
            {aiError && <div style={{ color: 'var(--non-halal)', fontSize: '0.79rem' }}>{aiError}</div>}
            {aiAnalysis && (
              <div style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.84rem' }}>
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            )}
            {!aiAnalysis && !aiLoading && !aiError && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                Get a plain-English explanation of why {stock.symbol} is classified as {statusStr}.
              </p>
            )}
          </div>

          {/* AAOIFI Screening Result Banner */}
          <div className="detail-panel" style={{ 
            borderLeft: `4px solid ${screeningColor}`, 
            background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
            padding: '24px 32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: screeningBg, borderRadius: '50%', filter: 'blur(50px)', opacity: 0.6, zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                background: isHalal ? 'rgba(74, 222, 128, 0.15)' : isNonHalal ? 'rgba(248, 113, 113, 0.15)' : 'rgba(250, 204, 21, 0.15)', 
                border: `1px solid ${isHalal ? 'rgba(74, 222, 128, 0.3)' : isNonHalal ? 'rgba(248, 113, 113, 0.3)' : 'rgba(250, 204, 21, 0.3)'}`,
                color: isHalal ? '#16a34a' : isNonHalal ? '#dc2626' : '#ca8a04',
                padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <StatusIcon size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  {isHalal ? 'Shariah Compliant' : isNonHalal ? 'Non-Compliant' : 'Status Doubtful'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Screened according to AAOIFI standards
                </p>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <Link to={`/market/${stock.symbol}/aaoifi`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.84rem', fontWeight: 700, background: 'var(--primary)', color: 'var(--bg)', border: 'none', borderRadius: '100px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(15, 82, 87, 0.2)' }}>
                <ShieldCheck size={18} />
                View Full AAOIFI Result
              </Link>
            </div>
          </div>

          {/* Advanced Metrics (Market Data) */}
          <div className="detail-panel">
            <div className="detail-section-label">Advanced Metrics</div>
            <div className="detail-metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valuation</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: 700 }}>{stock.valuation_info || 'N/A'}</span>
              </div>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth Forecast</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: 700 }}>{stock.growth_info || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="detail-panel">
            <div className="detail-section-label">Price History (30 Days)</div>
            <div style={{ height: '240px', width: '100%', marginTop: '16px' }}>
              {dailyPrices.length > 1 ? (() => {
                const chartData = [...dailyPrices].reverse().map(p => ({
                  date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  price: parseFloat(p.price)
                }));
                const minPrice = Math.min(...chartData.map(d => d.price));
                const maxPrice = Math.max(...chartData.map(d => d.price));
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        minTickGap={20}
                      />
                      <YAxis 
                        domain={[Math.floor(minPrice * 0.9), Math.ceil(maxPrice * 1.1)]} 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => `₦${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                        itemStyle={{ color: 'var(--primary)' }}
                        labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                        formatter={(val) => [`₦${val}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="var(--primary)" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6, fill: 'var(--primary)' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })() : (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg)', borderRadius: 'var(--radius-md)', color: 'var(--text-light)', border: '1.5px dashed var(--border)', gap: '12px'
                }}>
                  <BarChart2 size={36} strokeWidth={1} />
                  <span style={{ fontWeight: 600, fontSize: '0.79rem' }}>Not enough data</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Overview */}
          <div className="detail-panel">
            <div className="detail-section-label">Overview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Sector', value: stock.sector || 'N/A' },
                { label: 'Industry', value: stock.business_type || 'Equities' },
                { label: 'Exchange', value: 'Stock Exchange' },
                { label: 'Analyst Target', value: stock.analysts_target ? `₦ ${stock.analysts_target}` : 'N/A' },
                { label: 'Dividend Yield', value: stock.div_yield ? `${stock.div_yield}%` : 'N/A' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.77rem', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.84rem' }}>{row.value}</span>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.77rem', fontWeight: 500 }}>SEC Registration</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--halal)', fontWeight: 700, fontSize: '0.75rem', background: 'var(--halal-bg)', padding: '2px 8px', borderRadius: '12px' }}>
                  <CheckCircle size={12} /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* Purification Calculator */}
          <div className="detail-panel" style={{ background: 'linear-gradient(135deg, #0A2E36 0%, #0F5257 100%)', border: 'none', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ paddingRight: '12px' }}>
                <h3 style={{ color: 'white', fontWeight: 800, margin: '0 0 6px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--gold)" /> Dividend Purification
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
                  Cleanse your dividend earnings from non-compliant income based on AAOIFI standards.
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right', background: 'rgba(201,168,76,0.15)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.3)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Purification Rate</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>{purificationRate}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '4px' }}>Non-Compliant Revenue</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white' }}>
                  {latest?.non_compliant_revenue_ratio ? `${(parseFloat(latest.non_compliant_revenue_ratio) * 100).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '4px' }}>Interest Income Ratio</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white' }}>
                  {interestRatio}%
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>Calculate Purification Due</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>₦</span>
                  <input
                    type="number"
                    placeholder="Enter dividend"
                    value={dividendInput}
                    onChange={e => setDividendInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 28px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
                {purificationAmount !== null && dividendInput !== '' && (
                  <div style={{ flex: '0 0 auto', background: 'var(--gold)', padding: '10px 16px', borderRadius: '8px', color: '#1A1208', textAlign: 'center', minWidth: '90px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', opacity: 0.8 }}>Amount Due</div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 900 }}>₦ {purificationAmount}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buy Now */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                navigate('/login');
              } else {
                setShowBrokerageModal(true);
              }
            }}
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '0.88rem', border: 'none', cursor: 'pointer' }}
          >
            Buy Now
          </button>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.5 }}>
            Link your Nigerian brokerage account to enable live trading.
          </p>
        </div>
      </div>

      {/* ─── Brokerage Integration Modal ─── */}
      {showBrokerageModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary-50)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
              <Building2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)', textAlign: 'center', marginBottom: '12px' }}>Coming Soon</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.5, marginBottom: '32px' }}>
              Brokerage integration is currently on hold. We will notify you when trading is available.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '0.88rem' }} onClick={() => setShowBrokerageModal(false)}>
              Got it, thanks
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ─── News Section ─── */}
      <div style={{ marginTop: '32px' }}>
        <div className="detail-panel">
          <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Newspaper size={18} /> {stock.symbol} News
          </div>
          
          {newsLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading latest news...
            </div>
          ) : stockNews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stockNews.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 0', borderBottom: i < stockNews.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-light)', fontWeight: 500 }}>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.4 }}>{article.title}</div>
                  {article.excerpt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)' }}>
              <Globe size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No recent news found for {stock.symbol}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Price Alert Modal ─── */}
      {showAlertDialog && createPortal(
        <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'20px' }}>
          <div style={{ background: 'var(--bg)', borderRadius:'24px', width:'100%', maxWidth:'400px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.97rem', fontWeight:800, color:'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--primary)" /> Set Price Alert
              </h3>
              <button onClick={() => setShowAlertDialog(false)} style={{ background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!alertPrice) return alert('Enter a target price');
              setAlertSaving(true);
              try {
                await setPriceAlert(symbol, alertPrice);
                alert('Price alert set successfully!');
                setShowAlertDialog(false);
                setAlertPrice('');
              } catch (err) {
                alert(err.response?.data?.message || 'Failed to set price alert');
              } finally {
                setAlertSaving(false);
              }
            }} style={{ padding: '24px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Target Price (₦)</label>
              <div style={{ position:'relative', marginBottom:'24px' }}>
                <span style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontWeight:800 }}>₦</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  style={{ width:'100%', padding:'16px 16px 16px 40px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg)', fontSize:'1rem', fontWeight:600, outline:'none' }}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type="button" onClick={() => setShowAlertDialog(false)} style={{ flex:1, padding:'14px', borderRadius:'12px', background:'var(--bg-alt)', border:'1px solid var(--border)', color:'var(--text-muted)', fontWeight:700, fontSize: '0.79rem', cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={alertSaving} style={{ flex:1.5, padding:'14px', borderRadius:'12px', background:'var(--primary)', border:'none', color:'var(--bg)', fontWeight:700, fontSize: '0.79rem', cursor:alertSaving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 20px rgba(15, 82, 87, 0.2)' }}>
                  {alertSaving ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Save Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default StockDetails;
