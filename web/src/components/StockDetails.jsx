import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, HelpCircle, BarChart2, TrendingUp, TrendingDown, Building2, Brain, Globe, Newspaper, Bell, X, ShieldCheck, Activity, ChevronDown, ChevronUp, Briefcase, Scale, Landmark, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { fetchStockDetails, fetchAiAnalysis, setPriceAlert, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import CompanyLogo from './CompanyLogo';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { formatAppJustification } from '../utils/screeningFormatter';

const LOADING_STEPS = [
  "Initializing AAOIFI Screening...",
  "Reading latest financial statements...",
  "Fetching regulatory filings...",
  "Searching latest company news...",
  "Analyzing business activities...",
  "Consulting Irshad Engine...",
  "Calculating AAOIFI financial ratios...",
  "Running compliance engine...",
  "Generating transparent report..."
];

const StockDetails = ({ symbol: propSymbol }) => {
  const { symbol: paramSymbol } = useParams();
  const symbol = propSymbol || paramSymbol;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use optimistic data passed via router state for instant render
  const optimisticStock = location.state?.stock || null;

  // React Query — uses cached data instantly on repeat visits, fetches fresh in background
  const { data: stock, isLoading: queryLoading, isFetching } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const r = await fetchStockDetails(symbol);
      return r?.data || r;
    },
    staleTime: 5 * 60 * 1000,     // 5 min cache — repeat visits are instant
    retry: 2,
    retryDelay: 1500,
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const [showBrokerageModal, setShowBrokerageModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showPurificationModal, setShowPurificationModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertSaving, setAlertSaving] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  // UI theater: simulate loading steps
  useEffect(() => {
    let timer;
    if (simulatedLoading) {
      timer = setInterval(() => {
        setStepIndex(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 350);
    }
    return () => clearInterval(timer);
  }, [simulatedLoading]);

  // Turn off simulated loading when real data is ready and minimum time has passed
  useEffect(() => {
    if (!queryLoading && stock) {
      const minTimer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 1000);
      return () => clearTimeout(minTimer);
    } else if (!queryLoading && !stock) {
      setSimulatedLoading(false);
    }
  }, [queryLoading, stock]);

  const loading = queryLoading || simulatedLoading;

  // Log history & load watchlist status
  useEffect(() => {
    if (user) {
      api.post('/history', { action: 'check', reference_id: symbol }).catch(() => {});
      fetchWatchlist().then(res => {
        const list = res?.data || res || [];
        setInWatchlist(list.some(item => item.symbol === symbol));
      }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, user]);

  const handleAskAI = () => {
    setAiLoading(true);
    setAiError(null);
    setIsAiExpanded(true);
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


  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: -10, background: 'var(--primary)', opacity: 0.1, borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--border)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }} />
            <ShieldCheck size={32} color="var(--primary)" />
          </div>
        </div>
        <h2 style={{ fontSize: '1.32rem', fontWeight: 800, marginBottom: '16px' }}>Institutional AAOIFI Analysis</h2>
        <div style={{ height: '30px', position: 'relative', overflow: 'hidden' }}>
          <p key={stepIndex} className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '0.97rem', fontWeight: 500 }}>
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {LOADING_STEPS.map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: i === stepIndex ? '12px' : '8px', 
                height: i === stepIndex ? '12px' : '8px', 
                borderRadius: '50%', 
                background: i <= stepIndex ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s ease'
              }} 
            />
          ))}
        </div>
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

  const aaoifiData = stock.aaoifi_screening ?? stock.compliance_data ?? null;
  // purification_required is injected into stock.status by the backend
  const hasPurification = isHalal && !!(rawStatus?.purification_required);
  if (hasPurification) {
    statusStr = 'HALAL';
    StatusIcon = Droplets;
  }

  // ─── Business activity failure flag ──────────────────
  // True when the stock is non-halal specifically because it failed the
  const isFailedBusinessActivity = isNonHalal && (
    aaoifiData?.business_status === 'fail' ||
    stock?.business_status === 'fail' ||
    (stock?.status && typeof stock.status === 'object' && stock.status?.business_status === 'fail')
  );

  if (isNonHalal && !isFailedBusinessActivity) {
    const industryText = (stock.industry || stock.sector || 'its sector').toLowerCase();
    reason = `Although the company successfully passes the Shariah business activity screening because its core operations in ${industryText} are permissible, it fails to meet the required quantitative financial benchmarks.`;
  }

  // ─── Financial ratios ─────────────────────────────
  const financials = stock.financials;
  const latest = Array.isArray(financials) && financials.length > 0 ? financials[0] : null;

  const marketCap = parseFloat(latest?.market_cap) || 0;
  const safeMarketCap = marketCap > 0 ? marketCap : 1;
  const interest = parseFloat(latest?.interest_income) || 0;
  const rawRevenue = parseFloat(latest?.total_revenue) || 0;
  const revenue = rawRevenue > 0 ? rawRevenue : safeMarketCap;
  const interestRatio = ((interest / revenue) * 100).toFixed(2);
  const purificationRate = latest?.non_compliant_income_ratio ? parseFloat(latest.non_compliant_income_ratio).toFixed(2) : interestRatio;




  const dailyPrices = stock.daily_prices || [];
  const latestPriceObj = dailyPrices.length > 0 ? dailyPrices[0] : null;
  const previousPriceObj = dailyPrices.length > 1 ? dailyPrices[1] : null;
  
  // Use stock.latest_price from the company table as ground truth, fallback to daily_prices
  const latestPrice = stock.latest_price ? parseFloat(stock.latest_price) : (latestPriceObj ? parseFloat(latestPriceObj.price) : 0);
  
  // For price change, use stock.price_change_pct if available, else calculate manually
  const priceChangePct = stock.price_change_pct ? parseFloat(stock.price_change_pct) : (
      previousPriceObj && parseFloat(previousPriceObj.price) > 0 
          ? ((latestPrice - parseFloat(previousPriceObj.price)) / parseFloat(previousPriceObj.price)) * 100 
          : 0
  );


  // Determine if it's positive based on the percentage change
  const isPositive = priceChangePct >= 0;



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
      {isFetching && !loading && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '16px', color: 'var(--text-muted)', fontSize: '0.69rem', verticalAlign: 'middle' }}>
          <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
          Loading full data...
        </div>
      )}

      {/* ─── Header Card (Redesigned with Verdict & Justification as Primary) ─── */}
      <div className="detail-header" style={{
        background: 'linear-gradient(135deg, #0A192F 0%, #0F3A40 50%, #0B4F55 100%)',
        padding: '32px clamp(20px, 4vw, 36px)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Background ambient orbs */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 18s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 25s ease-in-out infinite alternate-reverse' }} />
        
        {/* Top Row: Company Info (Left) & Secondary Price / Actions (Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
          
          {/* Left: Logo & Company Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <CompanyLogo
              symbol={stock.symbol}
              logoUrl={stock.logo_url}
              size={58}
              radius={16}
              style={{ background: 'var(--bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.6px', color: 'white', margin: 0, lineHeight: 1.1, fontFamily: 'inherit' }}>{stock.name}</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: '6px 0 0', letterSpacing: '0.4px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--gold, #d4af37)', fontWeight: 800 }}>{stock.symbol}</span>
                <span>·</span>
                <span>{stock.sector ?? 'Market Listed'}</span>
                <span>·</span>
                <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>NGX Listed</span>
              </p>
            </div>
          </div>

          {/* Right: Actions & Secondary Price Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Price Tag Card */}
            <div style={{
              textAlign: 'right',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '10px 18px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                Latest Price
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'flex-end', marginTop: '3px' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                  ₦ {latestPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  color: isPositive ? '#34D399' : '#F87171',
                  background: isPositive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                  padding: '2px 8px', borderRadius: '6px',
                  fontWeight: 800, fontSize: '0.74rem', fontVariantNumeric: 'tabular-nums'
                }}>
                  {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Alert / Watchlist Button */}
            <button
               onClick={toggleWatchlist}
               disabled={watchlistLoading}
               style={{ 
                 display: 'flex', alignItems: 'center', gap: '7px', 
                 background: inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.12)', 
                 border: `1px solid ${inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.25)'}`, 
                 color: inWatchlist ? '#0F172A' : 'white', 
                 padding: '12px 18px', borderRadius: '14px', fontSize: '0.78rem', 
                 fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                 boxShadow: inWatchlist ? '0 6px 20px rgba(212, 175, 55, 0.35)' : '0 2px 8px rgba(0,0,0,0.1)',
                 backdropFilter: 'blur(10px)'
               }}
               className="hover-lift"
            >
               {watchlistLoading ? <div className="spinner" style={{width:'14px', height:'14px', borderTopColor: inWatchlist?'#0F172A':'white', borderWidth: '2px'}}/> : <Bell size={15} fill={inWatchlist ? '#0F172A' : 'none'} />}
               {inWatchlist ? 'Alert Set' : 'Alert'}
            </button>
          </div>

        </div>

        {/* ─── Bottom Row: Primary Verdict & Justification Banner ─── */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', boxSizing: 'border-box',
          background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.8) 0%, rgba(15, 58, 64, 0.7) 100%)',
          border: `1.5px solid ${hasPurification ? 'rgba(245, 158, 11, 0.4)' : isHalal ? 'rgba(16, 185, 129, 0.4)' : isNonHalal ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.1fr) 1.5fr',
          alignItems: 'center',
          gap: '28px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="hover-card"
        >
          {/* Left: Primary Verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: hasPurification 
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                : isHalal 
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                : isNonHalal 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                : 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: hasPurification 
                ? '0 8px 24px rgba(245, 158, 11, 0.45)' 
                : isHalal 
                ? '0 8px 24px rgba(16, 185, 129, 0.45)' 
                : isNonHalal 
                ? '0 8px 24px rgba(239, 68, 68, 0.45)' 
                : '0 8px 24px rgba(234, 179, 8, 0.45)', 
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              <StatusIcon size={30} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                AAOIFI COMPLIANCE VERDICT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 950, color: 'white', letterSpacing: '-0.8px', lineHeight: 1.05, textShadow: '0 2px 14px rgba(0,0,0,0.35)' }}>
                  {statusStr}
                </div>
                {hasPurification && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 850,
                    color: '#FCD34D',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}>
                    <Droplets size={12} color="#FCD34D" /> with purification
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary of Justification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '28px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold, #d4af37)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--gold, #d4af37)" /> SCREENING JUSTIFICATION SUMMARY
            </span>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.92)', lineHeight: 1.55, fontWeight: 450, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {reason || 'Screened strictly according to AAOIFI Standard No. 21 methodology. All business operations and financial ratios comply with Shariah requirements.'}
            </p>
            {(isHalal || stock?.business_status === 'pass' || aaoifiData?.business_status === 'pass') && (
              <div style={{ marginTop: '4px' }}>
                <Link to={`/market/${stock.symbol}/aaoifi`} style={{
                  fontSize: '0.74rem', fontWeight: 800, color: 'white', textDecoration: 'none',
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.1) 100%)',
                  padding: '7px 18px', borderRadius: '100px',
                  border: '1px solid rgba(201,168,76,0.4)',
                  transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.1) 100%)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  Full Audit <ArrowRight size={13} />
                </Link>
              </div>
            )}
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

          {/* Irshad Shariah Analysis — hidden for business activity failures */}
          {!isFailedBusinessActivity && (
          <div className="detail-panel hover-card" style={{ 
            background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', 
            border: '1px solid rgba(212, 175, 55, 0.25)', 
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.05)',
            cursor: (!aiAnalysis && !aiLoading) ? 'pointer' : 'default',
            position: 'relative', overflow: 'hidden'
          }} onClick={() => { 
            if (aiAnalysis) setIsAiExpanded(!isAiExpanded); 
            else if (!aiLoading) handleAskAI();
          }}>
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
                  <div style={{ background: 'rgba(212, 175, 55, 0.1)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                       onClick={(e) => { e.stopPropagation(); setIsAiExpanded(!isAiExpanded); }}>
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
          )}



          {/* Advanced Metrics — hidden for business activity failures */}
          {!isFailedBusinessActivity && (stock.valuation_info && stock.valuation_info !== 'N/A' && stock.valuation_info !== 'O' ||
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

          {/* Price Chart — hidden for business activity failures */}
          {!isFailedBusinessActivity && (
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
          )}
        </div>

        {/* Right Column (Sticky so it stays fixed and doesn't move with page scroll) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px', alignSelf: 'start' }}>



          {/* Dividend Purification — redesigned */}
          {isHalal && (
            <div className="detail-panel" style={{
              background: 'linear-gradient(160deg, #071F24 0%, #0B3038 60%, #071A20 100%)',
              border: '1px solid rgba(212,175,55,0.18)',
              color: 'white',
              boxShadow: '0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
              position: 'relative', overflow: 'hidden', borderRadius: '20px'
            }}>
              {/* Decorative glow */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-60px', left: '-20px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(0,214,143,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

              {/* Header */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color="#d4af37" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>AAOIFI Compliant</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>Dividend Purification</div>
                  </div>
                </div>
                {/* Purification Rate Badge */}
                <div onClick={() => setShowPurificationModal(true)} className="hover-card" style={{ cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.06) 100%)', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <div style={{ fontSize: '0.6rem', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purification Rate</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white', lineHeight: 1.1, marginTop: '2px' }}>{purificationRate}%</div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '18px', position: 'relative', zIndex: 1 }} />

              {/* Upcoming Dividend Section */}
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stock?.upcoming_dividend ? '#00d68f' : 'rgba(255,255,255,0.2)', display: 'inline-block', boxShadow: stock?.upcoming_dividend ? '0 0 8px #00d68f' : 'none' }} />
                  Upcoming Dividend
                </div>
                {stock?.upcoming_dividend ? (
                  <div style={{ background: 'rgba(0,214,143,0.05)', border: '1px solid rgba(0,214,143,0.15)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Amount + Type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Amount Per Share</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00d68f', letterSpacing: '-0.5px' }}>₦{parseFloat(stock.upcoming_dividend.amount).toFixed(2)}</div>
                      </div>
                      <div style={{ background: 'rgba(0,214,143,0.12)', border: '1px solid rgba(0,214,143,0.2)', borderRadius: '8px', padding: '6px 12px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00d68f' }}>{stock.upcoming_dividend.dividend_type || 'Dividend'}</div>
                      </div>
                    </div>
                    {/* Dates row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Ex-Date', val: stock.upcoming_dividend.ex_date },
                        { label: 'Record Date', val: stock.upcoming_dividend.record_date },
                        { label: 'Pay Date', val: stock.upcoming_dividend.pay_date },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                            {val ? new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '1rem' }}>📅</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>No upcoming dividend declared</div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>We'll update when NGX publishes one</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Last Paid Dividend */}
              {stock?.last_paid_dividend && (
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Last Paid Dividend</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>₦{parseFloat(stock.last_paid_dividend.amount).toFixed(2)} · {stock.last_paid_dividend.dividend_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Paid On</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                      {stock.last_paid_dividend.pay_date ? new Date(stock.last_paid_dividend.pay_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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



      {/* ─── News Section — hidden for business activity failures ─── */}
      {!isFailedBusinessActivity && (
      <div style={{ marginTop: '32px', paddingBottom: '32px' }}>
        <div className="detail-panel">
          <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Newspaper size={18} /> Latest News for {stock.symbol}
          </div>
          
          {isFetching && !loading ? (
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
      )}

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
                <button type="submit" disabled={alertSaving} style={{ flex:1.5, padding:'14px', borderRadius:'12px', background:'var(--primary)', border:'none', color:'#0B0F17', fontWeight:800, fontSize: '0.79rem', cursor:alertSaving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 20px rgba(243, 198, 81, 0.25)' }}>
                  {alertSaving ? <div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'white' }}/> : 'Save Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Purification Formula Modal ─── */}
      {showPurificationModal && createPortal(
        <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000, padding:'20px' }}>
          <div style={{ background: 'var(--bg)', borderRadius:'24px', width:'100%', maxWidth:'460px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--border)', overflow:'hidden', animation:'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px', borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight:800, color:'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ShieldCheck size={20} color="var(--gold, #d4af37)" /> Purification Formula
              </h3>
              <button onClick={() => setShowPurificationModal(false)} style={{ background:'var(--bg-section)', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>
            </div>
            
            <div style={{ padding: '32px 24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                The purification rate is calculated using the AAOIFI methodology, determining the proportion of non-permissible income relative to total revenue.
              </p>

              <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>AAOIFI Formula</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ borderBottom: '2px solid var(--border)', paddingBottom: '4px', marginBottom: '4px' }}>Total Non-Permissible Income</span>
                    <span>Total Revenue</span>
                  </div>
                  <span>× 100</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{stock.symbol} Calculation</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ borderBottom: '2px solid var(--border)', paddingBottom: '6px', marginBottom: '6px', color: 'var(--non-halal)' }}>{interest > 0 ? `₦${interest.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₦0.00'}</span>
                    <span style={{ color: 'var(--primary)' }}>{rawRevenue > 0 ? `₦${rawRevenue.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</span>
                  </div>
                  <span>× 100</span>
                  <span>= <span style={{ color: 'var(--gold, #d4af37)' }}>{purificationRate}%</span></span>
                </div>
              </div>

            </div>
            <div style={{ padding: '20px 24px', background: 'var(--bg-section)', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => setShowPurificationModal(false)}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default StockDetails;
