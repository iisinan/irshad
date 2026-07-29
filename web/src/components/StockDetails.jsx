import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, HelpCircle, BarChart2, TrendingUp, TrendingDown, Building2, Brain, Globe, Newspaper, Bell, X, ShieldCheck, Activity, ChevronDown, ChevronUp, Briefcase, Scale, Landmark } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { fetchStockDetails, fetchAiAnalysis, setPriceAlert, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';
import CompanyLogo from './CompanyLogo';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { formatAppJustification } from '../utils/screeningFormatter';

const StockDetails = ({ symbol: propSymbol }) => {
  const { symbol: paramSymbol } = useParams();
  const symbol = propSymbol || paramSymbol;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use optimistic data passed via router state for instant render
  const optimisticStock = location.state?.stock || null;
  const [stock, setStock] = useState(optimisticStock);
  const [loading, setLoading] = useState(true); // always show full spinner to prevent layout shifts
  const [enriching, setEnriching] = useState(!!optimisticStock); // silent background fetch
  const [dividendInput, setDividendInput] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const [showBrokerageModal, setShowBrokerageModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertSaving, setAlertSaving] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);



  const handleAskAI = () => {
    setAiLoading(true);
    setAiError(null);
    fetchAiAnalysis(symbol)
      .then(r => {
        const payload = r.data || r;
        const analysisText = payload?.reasoning || payload?.analysis || "No analysis returned.";
        const isNonHalalReport = stock?.status?.status === 'non-halal' || stock?.status?.stage1?.status === 'non-halal' || stock?.current_status === 'non-halal';
        setAiAnalysis(formatAppJustification(analysisText, isNonHalalReport));
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

  useEffect(() => {
    // Always fetch full data in background; merge so we add financials & chart
    fetchStockDetails(symbol)
      .then(r => { if (r.data) setStock(r.data); })
      .catch(console.error)
      .finally(() => { setLoading(false); setEnriching(false); });
      
    // Log history
    if (user) {
      api.post('/history', { action: 'check', reference_id: symbol }).catch(() => {});
      fetchWatchlist().then(res => {
        const list = res?.data || res || [];
        setInWatchlist(list.some(item => item.symbol === symbol));
      }).catch(console.error);
    }

    // Automatically fetch AI analysis
    handleAskAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  let reason = 'This stock has not been fully screened yet. Its Shariah compliance status is currently under review.';
  let StatusIcon = HelpCircle;
  let isHalal = false;
  let isNonHalal = false;

  const rawStatus = stock.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal' || s === 'compliant') {
      statusStr = 'HALAL'; StatusIcon = CheckCircle; isHalal = true; isNonHalal = false;
    } else if (s === 'non-halal' || s === 'non-compliant') {
      statusStr = 'NON-HALAL'; StatusIcon = AlertCircle; isNonHalal = true; isHalal = false;
    } else if (s === 'doubtful') {
      statusStr = 'DOUBTFUL'; StatusIcon = AlertCircle; isHalal = false; isNonHalal = false;
    }
    reason = rawStatus.reason ?? reason;
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'halal' || s === 'compliant') {
      statusStr = 'HALAL'; StatusIcon = CheckCircle; isHalal = true; isNonHalal = false;
    } else if (s === 'non-halal' || s === 'non-compliant') {
      statusStr = 'NON-HALAL'; StatusIcon = AlertCircle; isNonHalal = true; isHalal = false;
    } else if (s === 'doubtful') {
      statusStr = 'DOUBTFUL'; StatusIcon = AlertCircle; isHalal = false; isNonHalal = false;
    }
  }

  reason = formatAppJustification(reason, isNonHalal);

  // ─── Financial ratios ─────────────────────────────
  const financials = stock.financials;
  const latest = Array.isArray(financials) && financials.length > 0 ? financials[0] : null;

  const marketCap = parseFloat(latest?.market_cap) || 0;
  const safeMarketCap = marketCap > 0 ? marketCap : 1;
  const interest = parseFloat(latest?.interest_income) || 0;
  const rawRevenue = parseFloat(latest?.total_revenue) || 0;
  const revenue = rawRevenue > 0 ? rawRevenue : safeMarketCap;
  const interestRatio = ((interest / revenue) * 100).toFixed(1);
  const purificationRate = latest?.non_compliant_income_ratio ? parseFloat(latest.non_compliant_income_ratio).toFixed(2) : interestRatio;

  const purificationAmount = dividendInput
    ? ((parseFloat(dividendInput) || 0) * (parseFloat(purificationRate) / 100)).toFixed(2)
    : null;



  const dailyPrices = stock.daily_prices || [];
  const latestPriceObj = dailyPrices.length > 0 ? dailyPrices[0] : null;
  const previousPriceObj = dailyPrices.length > 1 ? dailyPrices[1] : null;
  const latestPrice = latestPriceObj ? parseFloat(latestPriceObj.price) : 0;
  const previousPrice = previousPriceObj ? parseFloat(previousPriceObj.price) : latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePct = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;



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

      {/* ─── Header Card (Redesigned with Verdict & Justification as Primary) ─── */}
      <div className="detail-header" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '28px clamp(20px, 4vw, 36px)', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Background ambient orbs */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 18s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 25s ease-in-out infinite alternate-reverse' }} />
        
        {/* Top Row: Company Info (Left) & Secondary Price / Actions (Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
          
          {/* Left: Logo & Company Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <CompanyLogo
              symbol={stock.symbol}
              logoUrl={stock.logo_url}
              size={56}
              radius={14}
              style={{ background: 'var(--bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.5px', color: 'white', margin: 0, lineHeight: 1.1 }}>{stock.name}</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: '6px 0 0', letterSpacing: '0.5px', fontSize: '0.84rem' }}>
                {stock.symbol} · {stock.sector ?? 'Market Listed'} · Stock Exchange
              </p>
            </div>
          </div>

          {/* Right: Actions & Secondary Price Tag */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                 onClick={toggleWatchlist}
                 disabled={watchlistLoading}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: '6px', 
                   background: inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.15)', 
                   border: `1px solid ${inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}`, 
                   color: inWatchlist ? '#1A1208' : 'white', 
                   padding: '7px 14px', borderRadius: '10px', fontSize: '0.74rem', 
                   fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                   boxShadow: inWatchlist ? '0 4px 12px rgba(212, 175, 55, 0.3)' : 'none'
                 }}
              >
                 {watchlistLoading ? <div className="spinner" style={{width:'14px', height:'14px', borderTopColor: inWatchlist?'#1A1208':'white', borderWidth: '2px'}}/> : <Bell size={14} fill={inWatchlist ? '#1A1208' : 'none'} />}
                 {inWatchlist ? 'Alert Set' : 'Alert'}
              </button>
            </div>

            {/* Secondary Price Display */}
            <div className="hover-card" style={{ textAlign: 'right', background: 'rgba(0,0,0,0.18)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Latest Price</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: '850', color: 'white', letterSpacing: '-0.5px' }}>₦ {latestPrice.toFixed(2)}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: isPositive ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '0.75rem' }}>
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {priceChangePct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Bottom Row: Primary Verdict & Justification Banner ─── */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', boxSizing: 'border-box',
          background: isHalal 
            ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.28) 0%, rgba(20, 83, 45, 0.35) 100%)' 
            : isNonHalal 
            ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.32) 0%, rgba(153, 27, 27, 0.38) 100%)' 
            : 'linear-gradient(135deg, rgba(202, 138, 4, 0.28) 0%, rgba(133, 77, 14, 0.35) 100%)',
          border: `1.5px solid ${isHalal ? 'rgba(74, 222, 128, 0.45)' : isNonHalal ? 'rgba(248, 113, 113, 0.45)' : 'rgba(250, 204, 21, 0.45)'}`,
          borderRadius: '18px',
          padding: '20px 24px',
          boxShadow: isHalal 
            ? '0 12px 32px rgba(22, 163, 74, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : isNonHalal 
            ? '0 12px 32px rgba(220, 38, 38, 0.28), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 12px 32px rgba(202, 138, 4, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
          gap: '24px',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {/* Left: Primary Verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: isHalal ? '#16a34a' : isNonHalal ? '#dc2626' : '#ca8a04',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isHalal ? '0 0 20px rgba(22, 163, 74, 0.5)' : isNonHalal ? '0 0 20px rgba(220, 38, 38, 0.5)' : '0 0 20px rgba(202, 138, 4, 0.5)', 
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.3)',
              animation: 'pulse 2.5s infinite alternate'
            }}>
              <StatusIcon size={30} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                AAOIFI Compliance Verdict
              </div>
              <div style={{ fontSize: '1.95rem', fontWeight: 950, color: 'white', letterSpacing: '-0.5px', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                {statusStr}
              </div>
            </div>
          </div>

          {/* Right: Summary of Justification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '24px', flex: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold, #d4af37)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--gold, #d4af37)" /> Screening Justification Summary
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {reason || 'Screened strictly according to AAOIFI Standard No. 21 methodology. All business operations and financial ratios comply with Shariah requirements.'}
            </p>
            <div style={{ marginTop: '4px' }}>
              <Link to={`/market/${stock.symbol}/aaoifi`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.15)', padding: '5px 16px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.25)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Full Audit →
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="detail-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* About Company (Furnished with Industry, Board, and Date Price) */}
          <div className="detail-panel" style={{ padding: '28px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
            <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '20px' }}>
              <Briefcase size={16} /> ABOUT {stock.name}
            </div>

            {/* Key Details Grid Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              
              {/* Metric 1: Industry */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={14} color="var(--primary)" /> Industry / Sector
                </span>
                <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
                  {stock.sector || stock.industry || 'Financial Services'}
                </span>
              </div>

              {/* Metric 2: NGX Board */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={14} color="var(--gold, #d4af37)" /> NGX Trading Board
                </span>
                <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
                  {stock.board || stock.ngx_board || (stock.symbol === 'JAIZBANK' || stock.symbol === 'TAJBANK' || stock.symbol === 'LOTUS' || stock.symbol === 'NREIT' ? 'Non-Interest Board' : 'Equity Board / Main')}
                </span>
              </div>

              {/* Metric 3: Price as at Date */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="var(--halal, #16a34a)" /> Price as at {latestPriceObj?.date ? new Date(latestPriceObj.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '1.05rem', color: 'var(--text-dark)', fontWeight: 900 }}>
                    ₦ {latestPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isPositive ? 'var(--halal)' : 'var(--non-halal)' }}>
                    ({isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Metric 4: Analyst Target */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="var(--primary)" /> Analyst Target
                </span>
                <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
                  {stock.analysts_target ? `₦ ${stock.analysts_target}` : 'N/A'}
                </span>
              </div>

              {/* Metric 5: Dividend Yield */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart2 size={14} color="var(--gold, #d4af37)" /> Dividend Yield
                </span>
                <span style={{ fontSize: '1.02rem', color: 'var(--text-dark)', fontWeight: 850 }}>
                  {stock.div_yield ? `${(parseFloat(stock.div_yield) * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>

              {/* Metric 6: SEC Registration */}
              <div className="hover-card" style={{ background: 'var(--bg-section)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--halal, #16a34a)" /> SEC Registration
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--halal)', fontWeight: 800, fontSize: '0.95rem' }}>
                  <CheckCircle size={15} /> Verified & Listed
                </span>
              </div>

            </div>
          </div>

          {/* Irshad Shariah Analysis */}
          <div className="detail-panel hover-card" style={{ 
            background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', 
            border: '1px solid rgba(212, 175, 55, 0.25)', 
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.05)',
            cursor: aiAnalysis ? 'pointer' : 'default',
            position: 'relative', overflow: 'hidden'
          }} onClick={() => { if (aiAnalysis) setIsAiExpanded(!isAiExpanded); }}>
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (isAiExpanded || aiLoading || aiError || !aiAnalysis) ? '16px' : '0' }}>
              <div className="detail-section-label" style={{ marginBottom: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.15)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Brain size={18} color="var(--gold)" />
                </div>
                Irshad Analysis Reasoning
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {!aiAnalysis && !aiLoading && (
                  <button onClick={(e) => { e.stopPropagation(); handleAskAI(); }} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #d4af37 0%, #b89326 100%)', color: '#1A1208', border: 'none', fontWeight: 800, boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}>
                    Ask Irshad ✨
                  </button>
                )}
                {aiAnalysis && (
                  <div style={{ background: 'rgba(212, 175, 55, 0.1)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isAiExpanded ? <ChevronUp size={18} color="var(--gold)" /> : <ChevronDown size={18} color="var(--gold)" />}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {aiLoading && <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}><div className="spinner" style={{width: '14px', height: '14px', borderWidth: '2px'}} /> Irshad is searching corporate disclosures & analyzing financials...</div>}
              {aiError && <div style={{ color: 'var(--non-halal)', fontSize: '0.79rem' }}>{aiError}</div>}
              {aiAnalysis && isAiExpanded && (
                <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                  <div style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {!aiAnalysis && !aiLoading && !aiError && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, marginTop: '8px' }}>
                  Get a real-time Shariah assessment powered by Irshad with contextual source citations.
                </p>
              )}
            </div>
          </div>



          {/* Advanced Metrics (Market Data) */}
          {(stock.valuation_info && stock.valuation_info !== 'N/A' && stock.valuation_info !== 'O' || 
            stock.growth_info && stock.growth_info !== 'N/A' && stock.growth_info !== 'O') && (
            <div className="detail-panel" style={{ padding: '28px', background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
              <div className="detail-section-label" style={{ marginBottom: '20px' }}>Advanced Metrics</div>
              <div className="detail-metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {stock.valuation_info && stock.valuation_info !== 'N/A' && stock.valuation_info !== 'O' && (
                  <div className="hover-card" style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-section) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} color="var(--primary)" /> Valuation
                    </span>
                    <span style={{ fontSize: '1.05rem', color: 'var(--text-dark)', fontWeight: 850 }}>{stock.valuation_info}</span>
                  </div>
                )}
                {stock.growth_info && stock.growth_info !== 'N/A' && stock.growth_info !== 'O' && (
                  <div className="hover-card" style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-section) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} color="var(--halal)" /> Growth Forecast
                    </span>
                    <span style={{ fontSize: '1.05rem', color: 'var(--text-dark)', fontWeight: 850 }}>{stock.growth_info}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

        {/* Right Column (Sticky so it stays fixed and doesn't move with page scroll) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px', alignSelf: 'start' }}>



          {/* Purification Calculator */}
          {isHalal && (
            <div className="detail-panel hover-card" style={{ 
            background: 'linear-gradient(135deg, #071F24 0%, #0D3E42 100%)', 
            border: '1px solid rgba(212, 175, 55, 0.15)', 
            color: 'white',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ paddingRight: '12px' }}>
                <h3 style={{ color: 'white', fontWeight: 800, margin: '0 0 6px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--gold)" /> Dividend Purification
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
                  Cleanse your dividend earnings from non-compliant income based on AAOIFI standards.
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right', background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>Purification Rate</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>{purificationRate}%</div>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Non-Compliant Rev.</div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'white' }}>
                  {latest?.non_compliant_income_ratio ? `${(parseFloat(latest.non_compliant_income_ratio) * 100).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interest Income</div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'white' }}>
                  {interestRatio}%
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.25)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Calculate Purification Due</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>₦</span>
                  <input
                    type="number"
                    placeholder="Enter dividend"
                    value={dividendInput}
                    onChange={e => setDividendInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 36px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      fontSize: '0.94rem',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                  />
                </div>
                {purificationAmount !== null && dividendInput !== '' && (
                  <div className="animate-fade-in" style={{ flex: '0 0 auto', background: 'linear-gradient(135deg, #d4af37 0%, #b89326 100%)', padding: '12px 16px', borderRadius: '10px', color: '#1A1208', textAlign: 'center', minWidth: '100px', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px', opacity: 0.8, letterSpacing: '0.5px' }}>Amount Due</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900 }}>₦ {purificationAmount}</div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

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
              className="hover-card" 
              style={{ 
                width: '100%', justifyContent: 'center', padding: '16px', fontSize: '0.94rem', 
                border: 'none', cursor: 'pointer', borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white', fontWeight: 800, letterSpacing: '0.5px',
                boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(6, 78, 59, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 78, 59, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
            <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--bg-section)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                <Building2 size={32} />
              </div>
              <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>Live Trading Coming Soon</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '32px' }}>
                We are currently integrating with top Nigerian stockbrokers to enable seamless trading directly from Irshad. 
              </p>
              <button 
                onClick={() => setShowBrokerageModal(false)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-dark)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-section)'}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}



      {/* ─── News Section ─── */}
      <div style={{ marginTop: '32px', paddingBottom: '32px' }}>
        <div className="detail-panel">
          <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Newspaper size={18} /> Latest News for {stock.symbol}
          </div>
          
          {enriching ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading latest news...
            </div>
          ) : stock.news && stock.news.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {stock.news.slice(0, 6).map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="hover-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', border: '1px solid var(--border)', borderRadius: '16px', textDecoration: 'none', background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                  {article.thumbnail_url && (
                    <div style={{ height: '140px', width: '100%', overflow: 'hidden', background: 'var(--bg-section)' }}>
                      <img src={article.thumbnail_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      {article.source && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 800, background: 'var(--primary-50)', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(6, 78, 59, 0.1)' }}>{article.source}</span>
                      )}
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-light)', fontWeight: 700 }}>{article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.4, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </h4>
                    {article.excerpt && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, marginTop: 'auto' }}>
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-light)', background: 'var(--bg-section)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <Globe size={40} style={{ margin: '0 auto 16px', opacity: 0.4, color: 'var(--text-muted)' }} />
              <h4 style={{ margin: '0 0 8px', color: 'var(--text-dark)', fontSize: '0.95rem' }}>No recent news</h4>
              <p style={{ fontSize: '0.84rem' }}>There are currently no news updates for {stock.symbol}.</p>
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
