import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, 
  HelpCircle, ShieldCheck, ChevronRight, FileText, Brain, Download, Activity, Trash2, Droplets,
  Calendar, Sparkles, TrendingUp, Calculator, ExternalLink, Sliders,
  Building2, CreditCard, Coins, BarChart3, AlertCircle, CheckCircle2, Shield
} from 'lucide-react';
import { fetchAaoifiScreening, updateAaoifiData } from '../services/api';
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

const AaoifiScreening = () => {
  const { symbol } = useParams();
  
  const { data: res, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['aaoifi', symbol],
    queryFn: () => fetchAaoifiScreening(symbol),
    staleTime: 0, // Immediately refetch to clear cache
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 10000 : false,
  });

  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [modalData, setModalData] = useState(null);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [denominator, setDenominator] = useState('market_cap');
  const { user } = useAuth();
  
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    total_debt: '',
    cash: '',
    interest_income: '',
    total_assets: '',
    market_cap: '',
    total_revenue: '',
    evidence_links: ['']
  });
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');

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
    if (!queryLoading && res) {
      const minTimer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 1000);
      return () => clearTimeout(minTimer);
    }
  }, [queryLoading, res]);

  const loading = queryLoading || simulatedLoading;
  const report = res?.data;
  const error = queryError ? (queryError.response?.data?.message || queryError.message || 'An error occurred') : null;

  const formatNumber = (val) => {
    if (!val && val !== 0) return '0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    if (num >= 1000000000) return (num / 1000000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Billion';
    if (num >= 1000000) return (num / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Million';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      if (/^\d{4}$/.test(dateStr) || /^Q\d\s+\d{4}$/i.test(dateStr) || /^\d+M\s+\(FY\s+\d+\)$/i.test(dateStr)) {
        return dateStr;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatExactCurrency = (val) => {
    if (!val && val !== 0) return '0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openModal = (title, ratio, threshold, formula, numLabel, numVal, denLabel, denVal) => {
    setModalData({
      title,
      ratio: parseFloat(ratio) || 0,
      threshold,
      formula,
      numLabel,
      numVal,
      denLabel,
      denVal
    });
  };

  const handleOpenOverrideModal = () => {
    const fd = report?.financial_data_used || {};
    let evLinks = report?.evidence_link ? report.evidence_link : [];
    if (typeof evLinks === 'string') {
      try {
        const parsed = JSON.parse(evLinks);
        evLinks = Array.isArray(parsed) ? parsed : [evLinks];
      } catch {
        evLinks = [evLinks];
      }
    }
    if (!Array.isArray(evLinks) || evLinks.length === 0) {
      evLinks = [''];
    }

    setOverrideData({
      total_debt: fd.total_debt || '',
      cash: fd.cash_and_equivalents || fd.cash || '',
      interest_income: fd.interest_income || '',
      total_assets: fd.total_assets || '',
      market_cap: fd.market_cap || '',
      total_revenue: fd.total_revenue || '',
      evidence_links: evLinks
    });
    setShowOverrideModal(true);
  };

  const submitOverride = async (e) => {
    e.preventDefault();
    setOverrideLoading(true);
    setOverrideError('');
    try {
      await updateAaoifiData(symbol, overrideData);
      setShowOverrideModal(false);
      window.location.reload();
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to update AAOIFI data');
    } finally {
      setOverrideLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '48px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '32px', border: '1px solid var(--non-halal-bg)', boxShadow: '0 32px 64px -16px rgba(239,68,68,0.1)' }}>
        <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'var(--non-halal-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={40} color="var(--non-halal)" />
        </div>
        <h2 style={{ fontSize: '1.54rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-dark)' }}>Screening Error</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
        <Link 
          to={`/market/${symbol}`} 
          className="hover-card"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', color: 'var(--text-dark)', fontWeight: 700, textDecoration: 'none', borderRadius: '100px', border: '1px solid var(--border)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
        >
          <ArrowLeft size={18} /> Return to {symbol} Overview
        </Link>
      </div>
    );
  }

  if (!report) return null;
  const isNonHalalReport = report.final_status === 'non-halal' || report.stage1?.status === 'non-halal' || report.business_status === 'fail';
  const cleanStatusReason = formatAppJustification(report.status_reason, isNonHalalReport);
  const cleanStage1Reason = formatAppJustification(report.stage1?.reason || report.business_reasoning, isNonHalalReport);
  const fd = report.financial_data_used || {};
  const totalAssets = parseFloat(fd.total_assets) || 0;
  const marketCap = parseFloat(fd.market_cap) || 0;
  const totalDebt = parseFloat(fd.total_debt) || 0;
  const cashAndSecurities = (parseFloat(fd.cash) || 0) + (parseFloat(fd.interest_bearing_securities) || 0);
  const totalRevenue = parseFloat(fd.total_revenue) || 0;
  const interestIncome = parseFloat(fd.interest_income) || 0;

  const denVal = denominator === 'total_assets' ? totalAssets : marketCap;
  const denLabel = denominator === 'total_assets' ? 'Total Assets' : 'Market Cap';

  let debtRatio = null;
  if (denVal > 0) {
    debtRatio = (totalDebt / denVal) * 100;
  }

  let cashRatio = null;
  if (denVal > 0) {
    cashRatio = (cashAndSecurities / denVal) * 100;
  }

  // Ensure we use the exact final status calculated by the backend which respects the database ground truth
  // and admin manual overrides, instead of re-calculating it blindly on the frontend.
  let finalStatus = report.final_status || 'doubtful';

  // Purification detection
  const hasPurification = finalStatus === 'halal' && !!report.stage1?.purification_required;
  const rawPurification = parseFloat(report.stage1?.haram_revenue_percent) || 0;
  const purificationPercent = (Math.floor(rawPurification * 100) / 100).toFixed(2);

  let statusColor = 'var(--text-muted)';
  let StatusIcon = HelpCircle;
  let bgStatus = 'var(--bg-section)';

  if (finalStatus === 'halal') {
    statusColor = hasPurification ? 'var(--halal)' : 'var(--halal)';
    StatusIcon = hasPurification ? Droplets : CheckCircle;
    bgStatus = hasPurification
      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)'
      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)';
  } else if (finalStatus === 'non-halal') {
    statusColor = 'var(--non-halal)';
    StatusIcon = XCircle;
    bgStatus = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)';
  } else if (finalStatus === 'doubtful') {
    statusColor = 'var(--questionable)';
    StatusIcon = AlertTriangle;
    bgStatus = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)';
  }


  const renderRatioProgressBar = (title, subtitle, ratio, threshold, numLabel, numVal, denLabel, denVal, formula, isMinimum = false) => {
    if (ratio === null || ratio === undefined || isNaN(ratio)) {
      return (
        <div className="ratio-progress-row unavailable hover-card" style={{
          background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div className="ratio-col-label">
            <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.96rem', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
          
          <div className="ratio-col-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: '100px', height: '14px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.6px' }}>DATA UNAVAILABLE</span>
          </div>
          
          <div className="ratio-col-value">
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-muted)', lineHeight: 1.1 }}>N/A</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Insufficient data</div>
          </div>
        </div>
      );
    }

    const ratioVal = parseFloat(ratio) || 0;
    const thresholdNum = parseFloat(threshold);
    const isPassing = isMinimum ? ratioVal >= thresholdNum : ratioVal <= thresholdNum;
    
    const diff = Math.abs(thresholdNum - ratioVal).toFixed(2);
    const headroomDisplay = isPassing ? `${diff}pp headroom` : (isMinimum ? `${diff}pp shortfall` : `${diff}pp excess`);
    const color = isPassing ? 'var(--halal)' : 'var(--non-halal)';
    const barGradient = isPassing 
      ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' 
      : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
    
    const maxVisual = Math.max(thresholdNum / 0.7, ratioVal / 0.9, 1);
    const fillPercent = Math.min((ratioVal / maxVisual) * 100, 100);
    const thresholdPercent = Math.min((thresholdNum / maxVisual) * 100, 100);

    const numValParsed = parseFloat(numVal) || 0;
    const isClickable = numValParsed !== 0;

    // Parse index and name if formatted like "1. Debt ratio"
    const match = title.match(/^(\d+)\.\s*(.*)$/);
    const indexStr = match ? match[1] : null;
    const nameStr = match ? match[2] : title;

    return (
      <div 
        onClick={isClickable ? () => openModal(title, ratio, isMinimum ? `≥ ${threshold}%` : `≤ ${threshold}%`, formula, numLabel, numVal, denLabel, denVal) : undefined}
        className={`ratio-progress-row ${isClickable ? 'hover-card' : ''}`}
        style={{
          background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '16px',
          border: '1px solid var(--border)',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}
      >
        <div className="ratio-col-label">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {indexStr && (
              <span style={{ 
                width: '22px', 
                height: '22px', 
                borderRadius: '7px', 
                background: isPassing ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', 
                color: isPassing ? 'var(--halal)' : 'var(--non-halal)', 
                fontSize: '0.72rem', 
                fontWeight: 900, 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {indexStr}
              </span>
            )}
            <span style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.96rem' }}>
              {nameStr}
            </span>
            {isClickable && (
              <span style={{ 
                fontSize: '0.64rem', 
                padding: '2px 8px', 
                borderRadius: '100px', 
                background: 'var(--bg)', 
                color: 'var(--text-muted)', 
                fontWeight: 700, 
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Calculator size={10} /> Inspect ↗
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
        
        <div className="ratio-col-bar" style={{
          position: 'relative',
          height: '14px',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: '100px',
          overflow: 'visible'
        }}>
          {/* Progress fill bar */}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', 
            width: `${fillPercent}%`, 
            background: barGradient, 
            borderRadius: '100px',
            boxShadow: isPassing ? '0 0 12px rgba(16,185,129,0.3)' : '0 0 12px rgba(239,68,68,0.3)',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />

          {/* Threshold pin */}
          <div style={{
            position: 'absolute', top: '-5px', bottom: '-5px', 
            left: `${thresholdPercent}%`, width: '2.5px', 
            background: 'var(--non-halal)',
            borderRadius: '2px',
            zIndex: 10,
            boxShadow: '0 0 6px rgba(239,68,68,0.6)'
          }} />
          <div style={{
            position: 'absolute', top: '18px', left: `${thresholdPercent}%`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '2px'
          }}>
            <span style={{ 
              fontSize: '0.66rem', 
              fontWeight: 800, 
              color: 'var(--non-halal)', 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              padding: '1px 6px', 
              borderRadius: '4px',
              letterSpacing: '0.2px'
            }}>
              limit {threshold}%
            </span>
          </div>
        </div>
        
        <div className="ratio-col-value" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {ratioVal.toFixed(2)}%
          </div>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem', 
            fontWeight: 800, 
            color, 
            marginTop: '6px',
            padding: '3px 10px',
            borderRadius: '100px',
            background: isPassing ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: isPassing ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)'
          }}>
            <span>{isPassing ? '✓' : '✕'}</span>
            <span>{headroomDisplay}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link 
            to={`/market/${symbol}`} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '50%', color: 'var(--text-dark)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)' }}>{symbol} Screening</h1>
            <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AAOIFI Standard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
        {user?.role === 'admin' && (
          <button 
            onClick={handleOpenOverrideModal}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', border: 'none', borderRadius: '12px', 
              cursor: 'pointer', fontWeight: 800, color: '#ffffff', fontSize: '0.88rem', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 20px rgba(6, 78, 59, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(6, 78, 59, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(6, 78, 59, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
          >
            <ShieldCheck size={18} /> Edit Data
          </button>
        )}
        <button 
          onClick={() => window.print()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
            background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', border: '1px solid var(--border)', borderRadius: '12px', 
            cursor: 'pointer', fontWeight: 800, color: 'var(--text-dark)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-dark)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
          }}
        >
          <Download size={18} /> Export Report
        </button>
        </div>
      </div>

      <div className="detail-header" style={{ 
        padding: hasPurification ? '48px 36px 0 36px' : '56px 36px', borderRadius: '32px', background: bgStatus, 
        border: hasPurification ? '2px solid rgba(245,158,11,0.45)' : `2px solid ${statusColor}40`, textAlign: 'center', marginBottom: '40px',
        boxShadow: hasPurification
          ? '0 32px 64px -16px rgba(16,185,129,0.2), inset 0 2px 20px rgba(245,158,11,0.08)'
          : `0 32px 64px -16px ${statusColor}25, inset 0 2px 20px ${statusColor}10`,
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Background ambient orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '280px', height: '280px', background: `radial-gradient(circle, ${statusColor}15 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 20s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '320px', height: '320px', background: `radial-gradient(circle, ${statusColor}10 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 25s ease-in-out infinite alternate-reverse' }} />
        {hasPurification && (
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        )}
        
        {/* Top status bar — green for halal, amber for purification */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, height: '8px', 
          background: hasPurification
            ? 'linear-gradient(90deg, var(--halal) 0%, var(--questionable) 100%)'
            : statusColor,
          boxShadow: hasPurification
            ? '0 0 20px rgba(245,158,11,0.6)'
            : `0 0 20px ${statusColor}`
        }} />

        <div style={{ position: 'relative', zIndex: 1, animation: 'pulse 3s infinite alternate' }}>
          <StatusIcon size={96} color={hasPurification ? 'var(--halal)' : statusColor} style={{ margin: '0 auto 24px', filter: `drop-shadow(0 12px 32px ${hasPurification ? 'rgba(16,185,129,0.7)' : statusColor + '70'})` }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.86rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: hasPurification ? 'var(--halal)' : statusColor, marginBottom: '10px', textShadow: `0 2px 10px ${statusColor}30` }}>AAOIFI COMPLIANCE VERDICT</div>

        <h1 style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', fontWeight: 950, color: hasPurification ? 'var(--halal)' : statusColor, margin: '0 0 6px 0', letterSpacing: '-1.8px', textShadow: `0 4px 24px ${statusColor}40`, lineHeight: 1.05 }}>
          {finalStatus === 'halal'
            ? 'HALAL'
            : finalStatus === 'non-halal' ? 'NON-HALAL' : 'DOUBTFUL'}
        </h1>

        {hasPurification && (
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '14px' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 850,
              color: 'var(--questionable, #D97706)',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '4px 14px',
              borderRadius: '100px',
              boxShadow: '0 2px 8px rgba(245,158,11,0.2)'
            }}>
              <Droplets size={12} color="var(--questionable, #D97706)" /> with purification
            </span>
          </div>
        )}

        <p style={{ position: 'relative', zIndex: 1, color: 'var(--text-dark)', margin: '0 auto', fontWeight: 600, fontSize: '1.0rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: hasPurification ? '16px' : '0' }}>
          {cleanStatusReason || 'Screened in accordance with AAOIFI Shariah Standard No. 21 (Financial & Business Activity Rules).'}
        </p>

        {/* Reporting Metadata Pill */}
        {(report?.reporting_period || report?.reporting_year || report?.published_date) && (
          <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(0,0,0,0.05)', borderRadius: '100px', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: hasPurification ? '20px' : '0', border: '1px solid var(--border)' }}>
            <Calendar size={13} />
            <span>{report.reporting_period || 'Annual Report'} {report.reporting_year ? `(${report.reporting_year})` : ''}</span>
            {report.published_date && <span>· Published {report.published_date}</span>}
          </div>
        )}

        {/* Purification strip — only shown when purification is required */}
        {hasPurification && (
          <div style={{
            position: 'relative', zIndex: 1,
            width: 'calc(100% + 72px)', marginLeft: '-36px', marginRight: '-36px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.10) 100%)',
            borderTop: '1.5px solid rgba(245,158,11,0.35)',
            padding: '18px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap'
          }}>
            {/* Icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(245,158,11,0.2)', border: '1.5px solid rgba(245,158,11,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Droplets size={18} color="var(--questionable)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--questionable)', marginBottom: '2px' }}>Dividend Purification Required</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: 600, lineHeight: 1.4 }}>
                  Purify <strong style={{ color: 'var(--questionable)' }}>{purificationPercent}%</strong> of dividends
                </div>
              </div>
            </div>

            {/* Big stat */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(245,158,11,0.3)', borderRight: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--questionable)', lineHeight: 1, letterSpacing: '-0.5px' }}>
                  {purificationPercent}%
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>To Purify</div>
              </div>

              {/* Explanation */}
              <div style={{ maxWidth: '240px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dark)', fontWeight: 500, lineHeight: 1.4 }}>
                  The company earns <strong style={{ color: 'var(--questionable)' }}>{purificationPercent}%</strong> from non-compliant sources. Donate this portion to charity.
                </div>
              </div>
            </div>

            {/* Action Link */}
            <Link to="/portfolio" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
              color: 'var(--questionable)', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <span>Purify in Portfolio</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>



      {/* ─── STAGE 1: BUSINESS ACTIVITY SCREENING ─── */}
      <div className="hover-card" style={{ 
        background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', 
        borderRadius: '24px', 
        border: '1px solid var(--border)', 
        padding: '32px', 
        marginBottom: '40px', 
        boxShadow: '0 12px 32px rgba(0,0,0,0.03)', 
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle top indicator */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '3px',
          background: report.stage1?.status === 'halal' 
            ? 'linear-gradient(90deg, #10B981, rgba(16,185,129,0.3), transparent)' 
            : 'linear-gradient(90deg, #EF4444, rgba(239,68,68,0.3), transparent)'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(196,152,82,0.1)', border: '1px solid rgba(196,152,82,0.25)', marginBottom: '8px' }}>
              <ShieldCheck size={13} color="#C49852" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                STAGE 1: BUSINESS ACTIVITY SCREENING
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.4px' }}>
              Core Operations & Revenue
            </h2>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            borderRadius: '100px',
            background: report.stage1?.status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
            border: `1px solid ${report.stage1?.status === 'halal' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: report.stage1?.status === 'halal' ? 'var(--halal)' : 'var(--non-halal)',
            fontSize: '0.72rem',
            fontWeight: 900,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            boxShadow: report.stage1?.status === 'halal' ? '0 2px 10px rgba(16,185,129,0.15)' : '0 2px 10px rgba(239,68,68,0.15)'
          }}>
            {report.stage1?.status === 'halal' ? (
              <>
                <CheckCircle size={14} /> PASS
              </>
            ) : report.stage1?.status === 'non-halal' ? (
              <>
                <XCircle size={14} /> FAIL
              </>
            ) : 'UNKNOWN'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dividend Purification Callout */}
          {report.stage1?.purification_required && finalStatus === 'halal' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(217,119,6,0.07) 0%, rgba(245,158,11,0.02) 100%)',
              padding: '20px 24px',
              borderRadius: '18px',
              border: '1px solid rgba(217,119,6,0.25)',
              borderLeft: '4px solid #D97706',
              boxShadow: '0 4px 16px rgba(217,119,6,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                    <Droplets size={16} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#D97706', fontSize: '0.92rem', letterSpacing: '-0.2px' }}>
                    Dividend Purification Required
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: 500, fontSize: '0.86rem', lineHeight: 1.6 }}>
                  This company passes Stage 1, but derives <strong style={{ color: '#D97706', fontWeight: 800 }}>{purificationPercent}%</strong> of its revenue from non-compliant sources. In accordance with AAOIFI standards, you must purify this portion of your dividend payouts.
                </p>
              </div>

              {/* Stat highlight pill */}
              <div style={{
                background: 'var(--bg)',
                borderRadius: '14px',
                padding: '12px 20px',
                border: '1px solid rgba(217,119,6,0.2)',
                textAlign: 'center',
                minWidth: '120px',
                boxShadow: '0 2px 8px rgba(217,119,6,0.08)'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Impure Ratio
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.5px' }}>
                  {purificationPercent}%
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--halal)', marginTop: '2px' }}>
                  ≤ 5.00% Limit
                </div>
              </div>
            </div>
          )}

          {/* Prohibited Activities Exceed Limits */}
          {report.stage1?.status === 'non-halal' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(220,38,38,0.02) 100%)',
              padding: '20px 24px',
              borderRadius: '18px',
              border: '1px solid rgba(239,68,68,0.25)',
              borderLeft: '4px solid #EF4444',
              boxShadow: '0 4px 16px rgba(239,68,68,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                    <AlertTriangle size={16} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.92rem', letterSpacing: '-0.2px' }}>
                    Prohibited Activities Exceed Limits
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: 500, fontSize: '0.86rem', lineHeight: 1.6 }}>
                  This company fails Stage 1 because its non-compliant revenue (<strong style={{ color: '#EF4444' }}>{(parseFloat(report.stage1?.haram_revenue_percent) || 0).toFixed(2)}%</strong>) exceeds the 5% AAOIFI tolerance threshold, or it is primarily engaged in prohibited business activities.
                </p>
              </div>

              <div style={{
                background: 'var(--bg)',
                borderRadius: '14px',
                padding: '12px 20px',
                border: '1px solid rgba(239,68,68,0.2)',
                textAlign: 'center',
                minWidth: '120px',
                boxShadow: '0 2px 8px rgba(239,68,68,0.08)'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Impure Ratio
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#EF4444', letterSpacing: '-0.5px' }}>
                  {(parseFloat(report.stage1?.haram_revenue_percent) || 0).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#EF4444', marginTop: '2px' }}>
                  Exceeds 5% Limit
                </div>
              </div>
            </div>
          )}
          
          {/* Shariah Screening Reasoning */}
          <div style={{ paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} color="var(--primary)" /> Stage 1 Screening Reasoning
              </div>
              {(report.published_date || report.reporting_period || report.reporting_year) && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span>{report.reporting_period || 'Annual Report'} {report.reporting_year ? `(${report.reporting_year})` : ''}</span>
                  {report.published_date && <span>· Published {report.published_date}</span>}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '0.92rem', 
              lineHeight: 1.7, 
              color: 'var(--text-dark)', 
              padding: '20px 24px', 
              background: 'var(--bg-section)', 
              borderRadius: '16px', 
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
            }}>
              {cleanStage1Reason || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {!['JAIZBANK', 'TAJBANK', 'LOTUS', 'NREIT'].includes(symbol) && (finalStatus === 'halal' || report.business_status === 'pass') && (debtRatio !== null || report.impermissible_income_ratio != null || cashRatio !== null) && (
      <div className="hover-card" style={{ background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: '40px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(196,152,82,0.1)', border: '1px solid rgba(196,152,82,0.25)', marginBottom: '8px' }}>
              <TrendingUp size={13} color="#C49852" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                STAGE 2: QUANTITATIVE FINANCIAL SCREENING
              </span>
            </div>
            <p style={{ fontSize: '1.38rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>The Three AAOIFI Financial Ratios</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px 8px 6px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={13} color="var(--primary)" />
              Denominator:
            </span>
            <select 
              value={denominator}
              onChange={e => setDenominator(e.target.value)}
              style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none', color: 'var(--text-dark)', transition: 'all 0.2s' }}
            >
              <option value="market_cap">Market Cap (Default)</option>
              <option value="total_assets">Total Assets</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          {renderRatioProgressBar(
            '1. Debt ratio', `Total Debt / ${denLabel} × 100`, 
            debtRatio, 30, 
            'Total Debt', totalDebt, denLabel, denVal, `Total Debt / ${denLabel} × 100`
          )}
          {renderRatioProgressBar(
            '2. Cash ratio', `(Cash + Securities) / ${denLabel} × 100`, 
            cashRatio, 30, 
            'Cash & Securities', cashAndSecurities, denLabel, denVal, `(Cash + Securities) / ${denLabel} × 100`
          )}
          {renderRatioProgressBar(
            '3. Impure revenue', 'Impure Income / Total Revenue × 100', 
            report.impermissible_income_ratio, 5, 
            'Impure Income', report.financial_data_used?.interest_income, 'Total Revenue', report.financial_data_used?.total_revenue, 'Impure Income / Total Revenue × 100'
          )}
        </div>
      </div>
      )}

      {/* ─── STAGE 3: TRANSPARENCY & EVIDENCE ─── */}
      <div className="hover-card" style={{ background: 'linear-gradient(160deg, var(--bg-section) 0%, var(--bg) 100%)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: '48px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button 
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(196,152,82,0.1)', border: '1px solid rgba(196,152,82,0.25)', marginBottom: '8px' }}>
              <FileText size={13} color="#C49852" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#C49852', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                STAGE 3: TRANSPARENCY & EVIDENCE
              </span>
            </div>
            <p style={{ fontSize: '1.32rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>Data Sources & Financial References</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, background: 'var(--bg-section)', padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--border)' }}>
            <span>{evidenceExpanded ? 'Hide Details' : 'View Details'}</span>
            <ChevronRight size={18} color="var(--text-muted)" style={{ transform: evidenceExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </button>

        {evidenceExpanded && (
          <div className="animate-fade-in" style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px solid var(--border)' }}>

            {(report.financial_data_used?.source_links?.length > 0 || report.financial_data_used?.source || report.financial_data_used?.source_url) && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.92rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={16} color="var(--primary)" />
                  Extracted Financial Data Sources
                </div>
                
                {report.financial_data_used?.source_links?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {report.financial_data_used.source_links.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover-card" 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          gap: '16px', 
                          background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', 
                          padding: '20px', 
                          borderRadius: '18px', 
                          border: '1px solid var(--border)', 
                          textDecoration: 'none', 
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                          boxShadow: '0 4px 16px rgba(0,0,0,0.02)' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6, 78, 59, 0.12)' }}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>{link.name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{link.description || 'Official regulatory filing'}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: 'var(--halal)', border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'nowrap' }}>
                            Verified Source
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                          {(link.published_date || report.published_date) && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                              <Calendar size={12} color="var(--primary)" />
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Published:</span>
                              <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{formatFriendlyDate(link.published_date || report.published_date)}</span>
                            </div>
                          )}
                          {(link.report_quarter || link.financial_year || report.financial_year) && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                              <Activity size={12} color="#C49852" />
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
                              <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{link.report_quarter || 'Annual'} (FY {link.financial_year || report.financial_year || 'Latest'})</span>
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {report.financial_data_used?.source_url && !report.financial_data_used?.source_links?.length && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    <a 
                      href={report.financial_data_used.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover-card" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        gap: '16px', 
                        background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', 
                        padding: '20px', 
                        borderRadius: '18px', 
                        border: '1px solid var(--border)', 
                        textDecoration: 'none', 
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6, 78, 59, 0.12)' }}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>Nigerian Exchange Group (NGX)</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Official corporate filings and pricing disclosure</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: 'var(--halal)', border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'nowrap' }}>
                          Verified Source
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                        {(report.financial_data_used.published_date || report.published_date) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                            <Calendar size={12} color="var(--primary)" />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Published:</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{formatFriendlyDate(report.financial_data_used.published_date || report.published_date)}</span>
                          </div>
                        )}
                        {(report.financial_data_used.reporting_period || report.reporting_period || report.financial_data_used.financial_year || report.reporting_year) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                            <Activity size={12} color="#C49852" />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{report.financial_data_used.reporting_period || report.reporting_period || 'Annual Report'} (FY {report.financial_data_used.financial_year || report.reporting_year || 'Latest'})</span>
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                )}

                {report.financial_data_used?.source && !report.financial_data_used?.source_links?.length && !report.financial_data_used?.source_url && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    <a
                      href={`https://ngxgroup.com/exchange/data/company-profile/?symbol=${report.ticker || report.stock_ticker || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)',
                        padding: '20px',
                        borderRadius: '18px',
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6, 78, 59, 0.12)' }}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>
                              {report.financial_data_used.source}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Official NGX Corporate Disclosure</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: 'var(--halal)', border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'nowrap' }}>
                          View on NGX
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                        {(report.financial_data_used.published_date || report.published_date) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                            <Calendar size={12} color="var(--primary)" />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Published:</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{formatFriendlyDate(report.financial_data_used.published_date || report.published_date)}</span>
                          </div>
                        )}
                        {(report.financial_data_used.reporting_period || report.reporting_period || report.financial_data_used.financial_year || report.reporting_year) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-section)', border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                            <Activity size={12} color="#C49852" />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{report.financial_data_used.reporting_period || report.reporting_period || 'Annual Report'} (FY {report.financial_data_used.financial_year || report.reporting_year || 'Latest'})</span>
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Referenced Financial Data Used for Screening */}
            <div style={{ borderTop: `1px solid var(--border)`, paddingTop: '28px', margin: '32px 0 0 0', textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
                <Activity size={16} color="var(--primary)" /> Referenced Financial Inputs for AAOIFI Screening
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* 1. Market Capitalization */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(6, 78, 59, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Market Capitalization</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'var(--primary-bg)', color: 'var(--primary)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Denominator
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {marketCap ? `₦${formatNumber(marketCap)}` : 'N/A'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Primary AAOIFI Market Cap baseline
                    </p>
                  </div>
                </div>

                {/* 2. Total Assets */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Assets</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', color: '#2563EB', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Alternative
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {totalAssets ? `₦${formatNumber(totalAssets)}` : 'N/A'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Total balance sheet asset baseline
                    </p>
                  </div>
                </div>

                {/* 3. Total Interest Debt */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Interest Debt</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Ratio 1 Numerator
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {totalDebt ? `₦${formatNumber(totalDebt)}` : '₦0.00'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Interest-bearing borrowings (&lt; 30% limit)
                    </p>
                  </div>
                </div>

                {/* 4. Cash & Securities */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Coins size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Cash & Securities</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', color: '#059669', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Ratio 2 Numerator
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {cashAndSecurities ? `₦${formatNumber(cashAndSecurities)}` : '₦0.00'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Liquid interest-bearing assets (&lt; 30% limit)
                    </p>
                  </div>
                </div>

                {/* 5. Total Revenue */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Revenue</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.08)', color: '#7C3AED', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Ratio 3 Denom
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {totalRevenue ? `₦${formatNumber(totalRevenue)}` : 'N/A'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Top-line annual or interim revenue
                    </p>
                  </div>
                </div>

                {/* 6. Impure / Interest Income */}
                <div className="hover-card" style={{ background: 'linear-gradient(145deg, var(--bg-section) 0%, var(--bg) 100%)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={17} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Impure / Interest Income</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.08)', color: '#D97706', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Ratio 3 Numerator
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.22rem', color: 'var(--text-dark)', fontWeight: 900, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {interestIncome ? `₦${formatNumber(interestIncome)}` : '₦0.00'}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Non-operating impure income (&lt; 5% limit)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay: Calculation Details */}
      {modalData && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px', opacity: 1, transition: 'opacity 0.3s' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '28px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.25), 0 0 0 1px var(--border)' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(196,152,82,0.15)', border: '1px solid rgba(196,152,82,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={19} color="#C49852" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-dark)' }}>Calculation Breakdown</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>AAOIFI Shariah Standard No. 21</p>
                </div>
              </div>
              <button 
                onClick={() => setModalData(null)} 
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text-dark)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>{modalData.title}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', background: 'rgba(196,152,82,0.1)', border: '1px solid rgba(196,152,82,0.25)', borderRadius: '100px', color: '#C49852', fontSize: '0.74rem', fontWeight: 700 }}>
                  <span>Max Limit: <strong>{modalData.threshold}</strong></span>
                </div>
              </div>

              {/* Mathematical Equation Fraction Visual */}
              <div style={{ background: 'var(--bg-section)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px', textAlign: 'center' }}>
                  Mathematical Formulation
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Fraction */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px' }}>
                    {/* Numerator */}
                    <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{modalData.numLabel}</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', fontVariantNumeric: 'tabular-nums' }}>₦{formatExactCurrency(modalData.numVal)}</div>
                    </div>
                    {/* Division line */}
                    <div style={{ width: '100%', height: '2px', background: 'var(--border-strong, #ccc)', borderRadius: '1px' }} />
                    {/* Denominator */}
                    <div style={{ textAlign: 'center', paddingTop: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{modalData.denLabel}</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-dark)', fontVariantNumeric: 'tabular-nums' }}>₦{formatExactCurrency(modalData.denVal)}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)' }}>× 100</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>=</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: modalData.ratio <= parseFloat(modalData.threshold.replace(/[^0-9.]/g, '')) ? 'var(--halal)' : 'var(--non-halal)', fontVariantNumeric: 'tabular-nums' }}>
                    {modalData.ratio.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Calculated Result Card */}
              {(() => {
                const numericThreshold = parseFloat(modalData.threshold.replace(/[^0-9.]/g, '')) || 0;
                const isCompliant = modalData.ratio <= numericThreshold;
                const delta = Math.abs(numericThreshold - modalData.ratio).toFixed(2);

                return (
                  <div style={{ 
                    background: isCompliant 
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)' 
                      : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)', 
                    padding: '22px', 
                    borderRadius: '20px', 
                    textAlign: 'center', 
                    border: isCompliant 
                      ? '1px solid rgba(16,185,129,0.3)' 
                      : '1px solid rgba(239,68,68,0.3)',
                    boxShadow: isCompliant 
                      ? '0 8px 24px rgba(16,185,129,0.08)' 
                      : '0 8px 24px rgba(239,68,68,0.08)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Screening Assessment
                    </div>
                    <div style={{ fontSize: '2.8rem', fontWeight: 950, color: isCompliant ? 'var(--halal)' : 'var(--non-halal)', lineHeight: 1, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' }}>
                      {modalData.ratio.toFixed(2)}%
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 14px',
                        borderRadius: '100px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: isCompliant ? 'var(--halal-bg)' : 'var(--non-halal-bg)',
                        color: isCompliant ? 'var(--halal)' : 'var(--non-halal)',
                        border: isCompliant ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)'
                      }}>
                        {isCompliant ? `✓ Compliant · ${delta}pp Headroom` : `✕ Non-Compliant · ${delta}pp Excess`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Override Modal */}
      {showOverrideModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Admin Data Override</h3>
              <button 
                onClick={() => setShowOverrideModal(false)} 
                style={{ background: 'var(--bg-section)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={submitOverride} style={{ padding: '24px', overflowY: 'auto' }}>
              {overrideError && <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '20px' }}>{overrideError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Assets</label>
                  <input required type="number" step="any" value={overrideData.total_assets} onChange={e => setOverrideData({...overrideData, total_assets: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Revenue</label>
                  <input required type="number" step="any" value={overrideData.total_revenue} onChange={e => setOverrideData({...overrideData, total_revenue: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Market Cap</label>
                  <input required type="number" step="any" value={overrideData.market_cap} onChange={e => setOverrideData({...overrideData, market_cap: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Debt</label>
                  <input required type="number" step="any" value={overrideData.total_debt} onChange={e => setOverrideData({...overrideData, total_debt: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Cash & Equivalents</label>
                  <input required type="number" step="any" value={overrideData.cash} onChange={e => setOverrideData({...overrideData, cash: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Interest / Non-Permissible Income</label>
                <input required type="number" step="any" value={overrideData.interest_income} onChange={e => setOverrideData({...overrideData, interest_income: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Evidence / Reference Links (Required)</label>
                  <button type="button" onClick={() => setOverrideData({...overrideData, evidence_links: [...overrideData.evidence_links, '']})} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>+ Add Link</button>
                </div>
                {overrideData.evidence_links.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input required type="url" placeholder="https://..." value={link} onChange={e => {
                      const newLinks = [...overrideData.evidence_links];
                      newLinks[idx] = e.target.value;
                      setOverrideData({...overrideData, evidence_links: newLinks});
                    }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
                    {overrideData.evidence_links.length > 1 && (
                      <button type="button" onClick={() => {
                        const newLinks = overrideData.evidence_links.filter((_, i) => i !== idx);
                        setOverrideData({...overrideData, evidence_links: newLinks});
                      }} style={{ padding: '0 16px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Provide links to the financial report or announcement justifying this override.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowOverrideModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={overrideLoading} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: overrideLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {overrideLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Save & Recalculate'}
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

export default AaoifiScreening;
