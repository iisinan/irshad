import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, HelpCircle, BarChart2, TrendingUp, TrendingDown, Building2, Brain, Globe, Newspaper } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchStockDetails, fetchAiAnalysis } from '../services/api';
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

  useEffect(() => {
    // Always fetch full data in background; merge so we add financials & chart
    fetchStockDetails(symbol)
      .then(r => { if (r.data) setStock(r.data); })
      .catch(console.error)
      .finally(() => { setLoading(false); setEnriching(false); });
      
    // Fetch related news
    setNewsLoading(true);
    fetch(`http://127.0.0.1:8000/api/news?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => setStockNews(data.data || []))
      .catch(console.error)
      .finally(() => setNewsLoading(false));
  }, [symbol]);

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
  let statusStr = 'QUESTIONABLE';
  let badgeClass = 'status-doubtful';
  let reason = 'Manual screening recommended.';
  let StatusIcon = HelpCircle;
  let isHalal = false;
  let isNonHalal = false;

  const rawStatus = stock.status;
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const s = rawStatus.status?.toLowerCase();
    if (s === 'halal') {
      statusStr = 'SHARIAH COMPLIANT'; badgeClass = 'status-halal'; StatusIcon = CheckCircle; isHalal = true;
    } else if (s === 'non-halal') {
      statusStr = 'NOT COMPLIANT'; badgeClass = 'status-non-halal'; StatusIcon = AlertCircle; isNonHalal = true;
    }
    reason = rawStatus.reason ?? reason;
  } else if (typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s === 'compliant' || s === 'halal') {
      statusStr = 'SHARIAH COMPLIANT'; badgeClass = 'status-halal'; StatusIcon = CheckCircle; isHalal = true;
    } else if (s === 'non-halal') {
      statusStr = 'NOT COMPLIANT'; badgeClass = 'status-non-halal'; StatusIcon = AlertCircle; isNonHalal = true;
    }
    reason = 'Automated business activity analysis.';
  }

  // ─── Financial ratios ─────────────────────────────
  const financials = stock.financials;
  const latest = Array.isArray(financials) && financials.length > 0 ? financials[0] : null;
  const debt = parseFloat(latest?.total_debt) || 0;
  const assets = parseFloat(latest?.total_assets) || 0;
  const safeAssets = assets > 0 ? assets : 1;
  const interest = parseFloat(latest?.interest_income) || 0;
  const rawRevenue = parseFloat(latest?.total_revenue) || 0;
  const revenue = rawRevenue > 0 ? rawRevenue : safeAssets;
  
  const hasFinancialHighlights = assets > 0 || debt > 0 || rawRevenue > 0 || interest > 0;

  const debtRatio = ((debt / safeAssets) * 100).toFixed(1);
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

  // ─── AI Analysis ───────────────────────────────────
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
          setAiError(e.response?.data?.message || 'Failed to get AI analysis. Ensure GEMINI_API_KEY is set or backend is updated.');
        }
      })
      .finally(() => setAiLoading(false));
  };

  return (
    <div className="animate-fade-in page-wrapper">
      {/* Back link */}
      <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, marginBottom: '28px', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Subtle enriching indicator */}
      {enriching && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '16px', color: 'var(--text-muted)', fontSize: '0.78rem', verticalAlign: 'middle' }}>
          <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
          Loading full data...
        </div>
      )}

      {/* ─── Header Card ─── */}
      <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background logo watermark */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
            height: '160px', opacity: 0.055,
            pointerEvents: 'none', userSelect: 'none',
            filter: 'saturate(0)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            {stock.logo_url ? (
              <img 
                src={stock.logo_url} 
                alt={`${stock.symbol} logo`}
                style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  objectFit: 'contain', background: 'white',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
            ) : (
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--gold), #D4AF37)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1A1208', fontSize: '1.4rem', fontWeight: 800,
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
              }}>
                {stock.symbol?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{stock.name}</h1>
                <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.75rem' }}>
                  <StatusIcon size={12} /> {statusStr}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px', letterSpacing: '0.5px' }}>
                {stock.symbol} · {stock.sector ?? 'Market Listed'} · Stock Exchange
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Latest Price</p>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-1px' }}>₦ {latestPrice.toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPositive ? 'var(--primary)' : 'var(--non-halal)', fontWeight: 700, justifyContent: 'flex-end', marginTop: '4px' }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {priceChangePct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="detail-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="detail-panel" style={{ background: 'var(--bg-section)', border: '1px solid var(--border-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="detail-section-label" style={{ marginBottom: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} /> Irshad AI
              </div>
              {!aiAnalysis && !aiLoading && (
                <button onClick={handleAskAI} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--gold)', color: '#1A1208', border: 'none' }}>
                  Ask Gemini AI
                </button>
              )}
            </div>
            
            {aiLoading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Gemini is analyzing the financials...</div>}
            {aiError && <div style={{ color: 'var(--non-halal)', fontSize: '0.9rem' }}>{aiError}</div>}
            {aiAnalysis && (
              <div style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            )}
            {!aiAnalysis && !aiLoading && !aiError && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                Get a plain-English explanation of why {stock.symbol} is classified as {statusStr}.
              </p>
            )}
          </div>

          {/* About Company */}
          <div className="detail-panel">
            <div className="detail-section-label">About Company</div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--text-body)' }}>
              {stock.overview || `${stock.name} is a publicly traded company on the Stock Exchange, operating within the ${stock.sector || 'Unknown'} sector. Its primary business activities include the production, provision, and distribution of goods and services specific to the ${stock.sector || 'Unknown'} industry. The company focuses on delivering sustainable, long-term value to its shareholders and stakeholders across the region.`}
            </p>
          </div>

          {/* Business Screening */}
          <div className="detail-panel" style={{ borderLeft: `4px solid ${screeningColor}` }}>
            <div className="detail-section-label">Business Screening</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                background: screeningBg,
                border: `1px solid ${screeningBorder}`,
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
              }}>
                <StatusIcon size={20} color={screeningColor} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: screeningColor, fontWeight: 700 }}>
                {isHalal ? 'Business activities are Halal' : isNonHalal ? 'Non-Halal activities detected' : 'Screening result is Questionable'}
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, fontSize: '1rem' }}>{reason}</p>
          </div>

          {/* Financial Ratios */}
          <div className="detail-panel">
            <div className="detail-section-label">Financial Ratios (AAOIFI)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { label: 'Debt to Asset Ratio', value: parseFloat(debtRatio), limit: 33, unit: '%' },
                { label: 'Cash & Interest Ratio', value: parseFloat(interestRatio), limit: 5, unit: '%' },
              ].map(({ label, value, limit, unit }) => {
                const pass = value <= limit;
                const pct = Math.min((value / (limit * 1.5)) * 100, 100);
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: pass ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.9rem' }}>
                        {value}{unit} / {limit}{unit} max
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-section)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pass ? 'var(--halal)' : 'var(--non-halal)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Financial Data */}
          {hasFinancialHighlights && (
            <div className="detail-panel">
              <div className="detail-section-label">Financial Highlights</div>
              <div className="detail-metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assets</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 800 }}>₦ {assets > 0 ? assets.toLocaleString() : 'N/A'}</span>
                </div>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Debt</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 800 }}>₦ {debt > 0 ? debt.toLocaleString() : '0'}</span>
                </div>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 800 }}>₦ {rawRevenue > 0 ? rawRevenue.toLocaleString() : 'N/A'}</span>
                </div>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interest Income</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 800 }}>₦ {interest > 0 ? interest.toLocaleString() : '0'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Metrics (Market Data) */}
          <div className="detail-panel">
            <div className="detail-section-label">Advanced Metrics</div>
            <div className="detail-metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valuation</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-dark)', fontWeight: 700 }}>{stock.valuation_info || 'N/A'}</span>
              </div>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth Forecast</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-dark)', fontWeight: 700 }}>{stock.growth_info || 'N/A'}</span>
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
                        contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
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
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Not enough data</span>
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
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.95rem' }}>{row.value}</span>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>SEC Registration</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--halal)', fontWeight: 700, fontSize: '0.85rem', background: 'var(--halal-bg)', padding: '2px 8px', borderRadius: '12px' }}>
                  <CheckCircle size={12} /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* Purification Calculator */}
          <div className="purification-card">
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '6px', fontSize: '1rem' }}>
              🌿 Purification Calculator
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Received dividends from this holding? Calculate your purification obligation instantly.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                DIVIDEND AMOUNT (₦)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={dividendInput}
                onChange={e => setDividendInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {purificationAmount !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                marginTop: '16px',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Purification Due</div>
                <div style={{ color: 'white', fontSize: '2rem', fontWeight: '800', marginTop: '4px' }}>₦ {purificationAmount}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '4px' }}>Rate: {purificationRate}% of dividends</div>
              </div>
            )}
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
            style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1rem', border: 'none', cursor: 'pointer' }}
          >
            Buy Now
          </button>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.5 }}>
            Link your Nigerian brokerage account to enable live trading.
          </p>
        </div>
      </div>

      {/* Brokerage Modal */}
      {showBrokerageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary-50)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
              <Building2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', textAlign: 'center', marginBottom: '12px' }}>Brokerage Integration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center', lineHeight: 1.5, marginBottom: '32px' }}>
              In-app trading with CSCS and top Nigerian brokerages is coming soon. Connect your account to enable one-click Halal trading.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }} onClick={() => setShowBrokerageModal(false)}>
              Got it, thanks!
            </button>
          </div>
        </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--primary-50)', color: 'var(--primary)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{article.source}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.4 }}>{article.title}</div>
                  {article.excerpt && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</div>
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
    </div>
  );
};

export default StockDetails;
